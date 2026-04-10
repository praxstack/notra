import { orchestrateStandaloneChat } from "@notra/ai/orchestration/orchestrate-standalone";
import { standaloneChatRequestSchema } from "@notra/ai/schemas/standalone-chat";

import type { CheckResponse } from "autumn-js";
import { nanoid } from "nanoid";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { FEATURES } from "@/constants/features";
import { withOrganizationAuth } from "@/lib/auth/organization";
import { autumn } from "@/lib/billing/autumn";
import {
  calculateTokenCostCents,
  shouldApplyMarkup,
} from "@/lib/billing/token-pricing";
import {
  generateChatId,
  loadChatHistory,
  saveChatMessage,
  saveChatMessages,
} from "@/lib/chat-history";
import { useLogger, withEvlog } from "@/lib/evlog";
import { realtime } from "@/lib/realtime";
import {
  getGitHubIntegrationById,
  getGitHubToolRepositoryContextByIntegrationId,
} from "@/lib/services/github-integration";
import {
  getLinearIntegrationById,
  getLinearToolContextByIntegrationId,
} from "@/lib/services/linear-integration";

interface RouteContext {
  params: Promise<{ organizationId: string }>;
}

export const maxDuration = 60;

export const POST = withEvlog(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const requestId = nanoid(10);
  const log = useLogger();

  try {
    const { organizationId } = await params;

    log.set({
      feature: "standalone_chat",
      organizationId,
      requestId,
    });

    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    let useMarkup = false;
    if (autumn) {
      let checkData: CheckResponse | null = null;
      try {
        checkData = await autumn.check({
          customerId: organizationId,
          featureId: FEATURES.AI_CREDITS,
        });
      } catch (checkError) {
        console.error("[Autumn] Check error:", {
          requestId,
          customerId: organizationId,
          error: checkError,
        });
        return NextResponse.json(
          { error: "Failed to check usage limits", code: "BILLING_ERROR" },
          { status: 500 }
        );
      }

      if (!checkData?.allowed) {
        return NextResponse.json(
          {
            error: "Usage limit reached",
            code: "USAGE_LIMIT_REACHED",
            balance: checkData?.balance ?? 0,
          },
          { status: 403 }
        );
      }

      useMarkup = shouldApplyMarkup(checkData?.balance ?? null);
    }

    const body = await request.json();
    const parseResult = standaloneChatRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { messages, context } = parseResult.data;
    const chatId = parseResult.data.chatId ?? generateChatId();

    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage?.role === "user") {
      saveChatMessage(organizationId, chatId, lastUserMessage).catch((err) => {
        console.error("[Chat Persistence] Failed to save user message:", err);
      });
    }

    const autumnClient = autumn;

    const { stream, routingDecision } = await orchestrateStandaloneChat(
      {
        organizationId,
        messages,
        context,
        maxSteps: 5,
        log,
      },
      {
        integrationFetchers: {
          getGitHubIntegrationById,
          getLinearIntegrationById,
        },
        resolveContext: getGitHubToolRepositoryContextByIntegrationId,
        resolveLinearContext: getLinearToolContextByIntegrationId,
        onUsage(usage, modelId) {
          if (!autumnClient) {
            return;
          }

          const costCents = calculateTokenCostCents(
            {
              inputTokens: usage.inputTokens ?? 0,
              outputTokens: usage.outputTokens ?? 0,
              totalTokens: usage.totalTokens ?? 0,
              cacheReadTokens: usage.inputTokenDetails?.cacheReadTokens ?? 0,
              cacheWriteTokens: usage.inputTokenDetails?.cacheWriteTokens ?? 0,
            },
            modelId,
            useMarkup
          );

          autumnClient
            .track({
              customerId: organizationId,
              featureId: FEATURES.AI_CREDITS,
              value: costCents,
              properties: {
                source: "standalone_chat",
                model: modelId,
                input_tokens: usage.inputTokens ?? 0,
                output_tokens: usage.outputTokens ?? 0,
                cache_read_tokens:
                  usage.inputTokenDetails?.cacheReadTokens ?? 0,
                cache_write_tokens:
                  usage.inputTokenDetails?.cacheWriteTokens ?? 0,
                total_tokens: usage.totalTokens ?? 0,
                cost_cents: costCents,
              },
            })
            .catch((trackError) => {
              console.error("[Autumn] Track error after standalone chat:", {
                requestId,
                customerId: organizationId,
                error: trackError,
              });
            });
        },
        log,
      }
    );

    console.log("[Standalone Chat] Routing decision:", {
      requestId,
      chatId,
      decision: routingDecision,
    });

    const channel = realtime?.channel(`chat:${organizationId}:${chatId}`);

    (async () => {
      try {
        const finalText = await stream.text;
        const finalReasoningRaw = await stream.reasoning;
        const finalReasoning = Array.isArray(finalReasoningRaw)
          ? finalReasoningRaw
              .map((part) => {
                if (typeof part === "string") {
                  return part;
                }

                if (
                  typeof part === "object" &&
                  part !== null &&
                  "text" in part &&
                  typeof part.text === "string"
                ) {
                  return part.text;
                }

                return "";
              })
              .join("")
              .trim()
          : typeof finalReasoningRaw === "string"
            ? finalReasoningRaw
            : "";
        const assistantMessage = {
          id: nanoid(),
          role: "assistant" as const,
          parts: [
            ...(finalReasoning
              ? [{ type: "reasoning" as const, text: finalReasoning }]
              : []),
            ...(finalText ? [{ type: "text" as const, text: finalText }] : []),
          ],
        };
        await saveChatMessages(organizationId, chatId, [assistantMessage]);
        if (channel) {
          channel.emit("ai.chunk", assistantMessage).catch(() => {});
        }
      } catch (err) {
        console.error("[Chat Persistence] Stream consumption error:", err);
      }
    })();

    return stream.toUIMessageStreamResponse({
      sendReasoning: true,
      headers: { "X-Chat-Id": chatId },
      onError: (error) => {
        console.error("[Standalone Chat] Stream error:", { requestId, error });
        if (error instanceof Error) {
          return error.message;
        }
        return "An error occurred while processing your request.";
      },
    });
  } catch (e) {
    console.error("[Standalone Chat] Error:", {
      requestId,
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
});

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { organizationId } = await params;
  const auth = await withOrganizationAuth(request, organizationId);

  if (!auth.success) {
    return auth.response;
  }

  const chatId = request.nextUrl.searchParams.get("chatId");

  if (!chatId) {
    return NextResponse.json({ error: "chatId is required" }, { status: 400 });
  }

  const messages = await loadChatHistory(organizationId, chatId);
  return NextResponse.json({ chatId, messages });
}

import { orchestrateStandaloneChat } from "@notra/ai/orchestration/orchestrate-standalone";
import type { StandaloneChatContextItem } from "@notra/ai/schemas/standalone-chat";
import { standaloneChatContextSchema } from "@notra/ai/schemas/standalone-chat";
import type { CheckResponse } from "autumn-js";
import { nanoid } from "nanoid";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { FEATURES } from "@/constants/features";
import { withOrganizationAuth } from "@/lib/auth/organization";
import { autumn } from "@/lib/billing/autumn";
import {
  calculateTokenCostCents,
  shouldApplyMarkup,
} from "@/lib/billing/token-pricing";
import {
  clearActiveChatStream,
  generateAndSetChatTitle,
  generateChatId,
  loadChatHistory,
  replaceChatHistory,
  setActiveChatStream,
} from "@/lib/chat-history";
import { useLogger, withEvlog } from "@/lib/evlog";
import { getWorkflowClient } from "@/lib/qstash";
import { realtime } from "@/lib/realtime";
import {
  getGitHubIntegrationById,
  getGitHubIntegrationsByOrganization,
  getGitHubToolRepositoryContextByIntegrationId,
} from "@/lib/services/github-integration";
import {
  getLinearIntegrationById,
  getLinearIntegrationsByOrganization,
  getLinearToolContextByIntegrationId,
} from "@/lib/services/linear-integration";
import { getBaseUrl } from "@/lib/triggers/qstash";

const triggerStandaloneChatSchema = z.object({
  chatId: z.string().optional(),
  messages: z.array(z.any()),
  context: z.array(standaloneChatContextSchema).optional(),
  model: z.string().optional(),
  enableThinking: z.boolean().optional(),
  thinkingLevel: z.enum(["off", "low", "medium", "high"]).optional(),
});

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
  let cleanupOrganizationId: string | null = null;
  let cleanupChatId: string | null = null;

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
    const parseResult = triggerStandaloneChatSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { messages } = parseResult.data;
    const chatId = parseResult.data.chatId ?? generateChatId();
    cleanupOrganizationId = organizationId;
    cleanupChatId = chatId;
    const context =
      parseResult.data.context ??
      (await loadDefaultStandaloneChatContext(organizationId));

    if (!messages.length) {
      return NextResponse.json(
        { error: "At least one message is required" },
        { status: 400 }
      );
    }

    const latestMessage = messages[messages.length - 1];
    if (!latestMessage?.id) {
      return NextResponse.json(
        { error: "Latest message must include an id" },
        { status: 400 }
      );
    }

    await replaceChatHistory(organizationId, chatId, messages);
    await setActiveChatStream(organizationId, chatId, latestMessage.id);

    if (messages.length === 1 && latestMessage.role === "user") {
      const textPart = latestMessage.parts?.find(
        (p: { type: string }) => p.type === "text"
      );
      const userText = textPart?.text?.trim();
      if (userText) {
        generateAndSetChatTitle(organizationId, chatId, userText).catch(
          () => undefined
        );
      }
    }

    const canUseWorkflowStreaming = canUseUpstashWorkflowStreaming();

    if (!canUseWorkflowStreaming) {
      return createDirectStandaloneChatResponse({
        organizationId,
        chatId,
        messages,
        context,
        useMarkup,
        requestId,
        log,
        model: parseResult.data.model,
        enableThinking: parseResult.data.enableThinking,
      });
    }

    await getWorkflowClient().trigger({
      url: `${getBaseUrl()}/api/workflows/chat`,
      body: {
        requestId,
        organizationId,
        chatId,
        context,
        useMarkup,
      },
    });

    return NextResponse.json(
      { ok: true, chatId, streamId: latestMessage.id },
      { status: 202, headers: { "X-Chat-Id": chatId } }
    );
  } catch (e) {
    if (cleanupOrganizationId && cleanupChatId) {
      await clearActiveChatStream(cleanupOrganizationId, cleanupChatId).catch(
        () => undefined
      );
    }
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error("[Standalone Chat] Error:", {
      requestId,
      error: errorMessage,
      stack: e instanceof Error ? e.stack : undefined,
    });
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? errorMessage
            : "Failed to process chat request",
      },
      { status: 500 }
    );
  }
});

function canUseUpstashWorkflowStreaming() {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.FORCE_UPSTASH_CHAT_STREAMING !== "true"
  ) {
    return false;
  }

  if (!(realtime && process.env.QSTASH_TOKEN)) {
    return false;
  }

  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    return false;
  }

  try {
    const hostname = new URL(baseUrl).hostname.toLowerCase();

    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1"
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

async function loadDefaultStandaloneChatContext(
  organizationId: string
): Promise<StandaloneChatContextItem[]> {
  const [githubIntegrations, linearIntegrations] = await Promise.all([
    getGitHubIntegrationsByOrganization(organizationId),
    getLinearIntegrationsByOrganization(organizationId),
  ]);

  const githubContext = githubIntegrations.flatMap((integration) => {
    if (!integration.enabled) {
      return [];
    }

    return integration.repositories
      .filter(
        (repository) =>
          repository.enabled &&
          typeof repository.owner === "string" &&
          repository.owner.length > 0 &&
          typeof repository.repo === "string" &&
          repository.repo.length > 0
      )
      .map(
        (repository): StandaloneChatContextItem => ({
          type: "github-repo",
          integrationId: integration.id,
          owner: repository.owner,
          repo: repository.repo,
        })
      );
  });

  const linearContext = linearIntegrations
    .filter((integration) => integration.enabled)
    .map(
      (integration): StandaloneChatContextItem => ({
        type: "linear-team",
        integrationId: integration.id,
        teamName: integration.linearTeamName ?? undefined,
      })
    );

  return [...githubContext, ...linearContext];
}

async function createDirectStandaloneChatResponse({
  organizationId,
  chatId,
  messages,
  context,
  useMarkup,
  requestId,
  log,
  model,
  enableThinking,
}: {
  organizationId: string;
  chatId: string;
  messages: unknown[];
  context: StandaloneChatContextItem[];
  useMarkup: boolean;
  requestId: string;
  log: ReturnType<typeof useLogger>;
  model?: string;
  enableThinking?: boolean;
}) {
  const autumnClient = autumn;

  const { stream } = await orchestrateStandaloneChat(
    {
      organizationId,
      messages: messages as never,
      context,
      maxSteps: 5,
      log,
      requestedModel: model,
      enableThinking,
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
              cache_read_tokens: usage.inputTokenDetails?.cacheReadTokens ?? 0,
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

  return stream.toUIMessageStreamResponse({
    originalMessages: messages as never,
    generateMessageId: nanoid,
    sendReasoning: enableThinking !== false,
    headers: { "X-Chat-Id": chatId },
    onFinish: async ({ messages: responseMessages }) => {
      try {
        await replaceChatHistory(organizationId, chatId, responseMessages);
      } finally {
        await clearActiveChatStream(organizationId, chatId);
      }
    },
    onError: (error) => {
      console.error("[Standalone Chat] Direct stream error:", {
        requestId,
        error,
      });
      if (error instanceof Error) {
        return error.message;
      }
      return "An error occurred while processing your request.";
    },
  });
}

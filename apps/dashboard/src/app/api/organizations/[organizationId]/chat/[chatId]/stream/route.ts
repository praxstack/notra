import type { UIMessageChunk } from "ai";
import { UI_MESSAGE_STREAM_HEADERS } from "ai";
import type { NextRequest } from "next/server";
import { isAiChatExperimentEnabled } from "@/lib/ai-chat-experiment";
import { withOrganizationAuth } from "@/lib/auth/organization";
import {
  getActiveChatStream,
  getChatStreamChannelName,
} from "@/lib/chat-history";
import { realtime } from "@/lib/realtime";

interface RouteContext {
  params: Promise<{ organizationId: string; chatId: string }>;
}

function toSseChunk(chunk: UIMessageChunk) {
  return `data: ${JSON.stringify(chunk)}\n\n`;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { organizationId, chatId } = await params;
  const auth = await withOrganizationAuth(request, organizationId);

  if (!auth.success) {
    return auth.response;
  }

  const aiChatEnabled = await isAiChatExperimentEnabled({
    userId: auth.context.user.id,
    email: auth.context.user.email,
    organizationId,
  });

  if (!aiChatEnabled) {
    return new Response("AI chat is not enabled for this organization", {
      status: 403,
    });
  }

  const activeStreamId = await getActiveChatStream(organizationId, chatId);

  if (!activeStreamId) {
    return new Response(null, { status: 204 });
  }

  if (!realtime) {
    return new Response("Realtime not configured", { status: 503 });
  }

  const channel = realtime.channel(
    getChatStreamChannelName(organizationId, chatId, activeStreamId)
  );

  let unsubscribe: (() => void) | undefined;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const history = await channel.history();

      for (const item of history) {
        if (item.event !== "ai.chunk") {
          continue;
        }

        const chunk = item.data as UIMessageChunk;
        controller.enqueue(encoder.encode(toSseChunk(chunk)));

        if (chunk.type === "finish" || chunk.type === "abort") {
          controller.close();
          return;
        }
      }

      unsubscribe = await channel.subscribe({
        events: ["ai.chunk"],
        onData: ({ data }) => {
          const chunk = data as UIMessageChunk;
          controller.enqueue(encoder.encode(toSseChunk(chunk)));

          if (chunk.type === "finish" || chunk.type === "abort") {
            unsubscribe?.();
            controller.close();
          }
        },
      });
    },
    cancel() {
      unsubscribe?.();
    },
  });

  return new Response(stream, { headers: UI_MESSAGE_STREAM_HEADERS });
}

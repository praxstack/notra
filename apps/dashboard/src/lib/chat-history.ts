import { nanoid } from "nanoid";
import type { UIMessage } from "ai";
import { redis } from "./redis";

function historyKey(organizationId: string, chatId: string) {
  return `chat:history:${organizationId}:${chatId}`;
}

export function generateChatId() {
  return nanoid(16);
}

export async function saveChatMessage(
  organizationId: string,
  chatId: string,
  message: UIMessage
) {
  if (!redis) return;
  await redis.zadd(historyKey(organizationId, chatId), {
    score: Date.now(),
    member: JSON.stringify(message),
  });
}

export async function saveChatMessages(
  organizationId: string,
  chatId: string,
  messages: UIMessage[]
) {
  if (!redis) return;
  const key = historyKey(organizationId, chatId);
  const now = Date.now();
  const pipeline = redis.pipeline();
  for (let i = 0; i < messages.length; i++) {
    pipeline.zadd(key, {
      score: now + i,
      member: JSON.stringify(messages[i]),
    });
  }
  await pipeline.exec();
}

export async function loadChatHistory(
  organizationId: string,
  chatId: string
): Promise<UIMessage[]> {
  if (!redis) return [];
  const raw = await redis.zrange<string[]>(
    historyKey(organizationId, chatId),
    0,
    -1
  );
  return raw.map((entry) =>
    typeof entry === "string" ? JSON.parse(entry) : entry
  );
}

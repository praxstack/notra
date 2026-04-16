import { gateway } from "@notra/ai/gateway";
import type { UIMessage } from "ai";
import { generateText } from "ai";
import { nanoid } from "nanoid";
import { CHAT_ABORT_FLAG_TTL_SECONDS } from "@/constants/chat";
import { redis } from "./redis";

function historyKey(organizationId: string, chatId: string) {
  return `chat:history:${organizationId}:${chatId}`;
}

function activeStreamKey(organizationId: string, chatId: string) {
  return `chat:stream:${organizationId}:${chatId}`;
}

function abortFlagKey(
  organizationId: string,
  chatId: string,
  streamId: string
) {
  return `chat:abort:${organizationId}:${chatId}:${streamId}`;
}

function lastStoppedKey(organizationId: string, chatId: string) {
  return `chat:lastStopped:${organizationId}:${chatId}`;
}

function sessionsKey(organizationId: string) {
  return `chat:sessions:${organizationId}`;
}

function sessionMetaKey(organizationId: string, chatId: string) {
  return `chat:session:${organizationId}:${chatId}`;
}

export function getChatStreamChannelName(
  organizationId: string,
  chatId: string,
  streamId: string
) {
  return `chat:${organizationId}:${chatId}:${streamId}`;
}

export function generateChatId() {
  return nanoid(16);
}

export interface ChatSessionSummary {
  chatId: string;
  title: string;
  updatedAt: string;
  createdAt: string;
}

export async function saveChatMessage(
  organizationId: string,
  chatId: string,
  message: UIMessage
) {
  if (!redis) return;
  const now = Date.now();
  await redis.zadd(historyKey(organizationId, chatId), {
    score: now,
    member: JSON.stringify(message),
  });
  await saveSessionMetadata(organizationId, chatId, [message], now);
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
  await saveSessionMetadata(organizationId, chatId, messages, now);
}

export async function replaceChatHistory(
  organizationId: string,
  chatId: string,
  messages: UIMessage[]
) {
  if (!redis) return;
  const key = historyKey(organizationId, chatId);
  const now = Date.now();
  const pipeline = redis.pipeline();

  pipeline.del(key);

  for (let i = 0; i < messages.length; i++) {
    pipeline.zadd(key, {
      score: now + i,
      member: JSON.stringify(messages[i]),
    });
  }

  await saveSessionMetadata(organizationId, chatId, messages, now);
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

export async function listChatSessions(
  organizationId: string
): Promise<ChatSessionSummary[]> {
  if (!redis) return [];
  const redisClient = redis;

  const chatIds = await redisClient.zrange<string[]>(
    sessionsKey(organizationId),
    0,
    -1
  );
  const orderedChatIds = [...chatIds].reverse();

  const sessions = await Promise.all(
    orderedChatIds.map(async (chatId) => {
      const raw = await redisClient.get<ChatSessionSummary | string>(
        sessionMetaKey(organizationId, chatId)
      );

      if (!raw) {
        return null;
      }

      const session = typeof raw === "string" ? JSON.parse(raw) : raw;
      return {
        chatId,
        title: session.title,
        updatedAt: session.updatedAt,
        createdAt: session.createdAt,
      } satisfies ChatSessionSummary;
    })
  );

  return sessions.filter(
    (session): session is ChatSessionSummary => session !== null
  );
}

export async function getActiveChatStream(
  organizationId: string,
  chatId: string
): Promise<string | null> {
  if (!redis) return null;
  const streamId = await redis.get<string>(
    activeStreamKey(organizationId, chatId)
  );
  return typeof streamId === "string" && streamId.length > 0 ? streamId : null;
}

export async function setActiveChatStream(
  organizationId: string,
  chatId: string,
  streamId: string
) {
  if (!redis) return;
  await redis.set(activeStreamKey(organizationId, chatId), streamId);
}

export async function clearActiveChatStream(
  organizationId: string,
  chatId: string
) {
  if (!redis) return;
  await redis.del(activeStreamKey(organizationId, chatId));
}

export async function setChatAbortFlag(
  organizationId: string,
  chatId: string,
  streamId: string
) {
  if (!redis) return;
  await redis.set(abortFlagKey(organizationId, chatId, streamId), "1", {
    ex: CHAT_ABORT_FLAG_TTL_SECONDS,
  });
}

export async function isChatAborted(
  organizationId: string,
  chatId: string,
  streamId: string
): Promise<boolean> {
  if (!redis) return false;
  const value = await redis.get<string>(
    abortFlagKey(organizationId, chatId, streamId)
  );
  return value === "1";
}

export async function clearChatAbortFlag(
  organizationId: string,
  chatId: string,
  streamId: string
) {
  if (!redis) return;
  await redis.del(abortFlagKey(organizationId, chatId, streamId));
}

export async function setLastResponseStopped(
  organizationId: string,
  chatId: string
) {
  if (!redis) return;
  await redis.set(lastStoppedKey(organizationId, chatId), "1");
}

export async function getLastResponseStopped(
  organizationId: string,
  chatId: string
): Promise<boolean> {
  if (!redis) return false;
  const value = await redis.get<string>(lastStoppedKey(organizationId, chatId));
  return value === "1";
}

export async function clearLastResponseStopped(
  organizationId: string,
  chatId: string
) {
  if (!redis) return;
  await redis.del(lastStoppedKey(organizationId, chatId));
}

async function saveSessionMetadata(
  organizationId: string,
  chatId: string,
  messages: UIMessage[],
  timestamp: number
) {
  if (!redis) return;

  const existing = await redis.get<ChatSessionSummary | string>(
    sessionMetaKey(organizationId, chatId)
  );
  const parsedExisting =
    typeof existing === "string" ? JSON.parse(existing) : existing;

  const session: ChatSessionSummary = {
    chatId,
    title: parsedExisting?.title ?? getChatTitle(messages) ?? "New chat",
    createdAt: parsedExisting?.createdAt ?? new Date(timestamp).toISOString(),
    updatedAt: new Date(timestamp).toISOString(),
  };

  await Promise.all([
    redis.set(sessionMetaKey(organizationId, chatId), session),
    redis.zadd(sessionsKey(organizationId), {
      score: timestamp,
      member: chatId,
    }),
  ]);
}

function getFirstUserMessage(messages: UIMessage[]): string | null {
  for (const message of messages) {
    if (message.role !== "user" || !Array.isArray(message.parts)) {
      continue;
    }

    for (const part of message.parts) {
      if (part.type === "text") {
        const normalized = part.text.replace(/\s+/g, " ").trim();
        if (normalized) {
          return normalized;
        }
      }
    }
  }

  return null;
}

function getFallbackTitle(userMessage: string): string {
  return userMessage.length > 60
    ? `${userMessage.slice(0, 57).trimEnd()}...`
    : userMessage;
}

function getChatTitle(messages: UIMessage[]) {
  const text = getFirstUserMessage(messages);
  return text ? getFallbackTitle(text) : null;
}

export async function generateAndSetChatTitle(
  organizationId: string,
  chatId: string,
  userMessage: string
) {
  try {
    const fallbackTitle = getFallbackTitle(userMessage);

    const { text } = await generateText({
      model: gateway("openai/gpt-5.4"),
      system: `Generate a short, descriptive title (max 50 chars) for a chat conversation based on the user's first message. Return ONLY the title text, nothing else. No quotes, no prefix. Be specific and concise.`,
      prompt: userMessage,
      maxOutputTokens: 30,
    });

    const aiTitle = text.replace(/^["']|["']$/g, "").trim();
    const title = aiTitle || fallbackTitle;

    if (!redis) {
      return;
    }

    const metaKey = sessionMetaKey(organizationId, chatId);
    const existing = await redis.get<ChatSessionSummary | string>(metaKey);
    const parsed =
      typeof existing === "string" ? JSON.parse(existing) : existing;

    if (!parsed) {
      return;
    }

    await redis.set(metaKey, { ...parsed, title });
  } catch (err) {
    console.error("[Chat Title] Generation failed:", err);
  }
}

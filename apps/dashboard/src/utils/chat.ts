import { CHAT_TITLE_MAX_LENGTH } from "@/constants/chat";
import type { ChatSessionSummary } from "@/types/chat";

export function normalizeChatTitle(title: string) {
  return title.replace(/\s+/g, " ").trim().slice(0, CHAT_TITLE_MAX_LENGTH);
}

export function sortChatSessions(sessions: ChatSessionSummary[]) {
  return [...sessions].sort((left, right) => {
    const leftPinnedAt = left.pinnedAt ? Date.parse(left.pinnedAt) : Number.NaN;
    const rightPinnedAt = right.pinnedAt
      ? Date.parse(right.pinnedAt)
      : Number.NaN;

    if (Number.isFinite(leftPinnedAt) || Number.isFinite(rightPinnedAt)) {
      if (!Number.isFinite(leftPinnedAt)) {
        return 1;
      }

      if (!Number.isFinite(rightPinnedAt)) {
        return -1;
      }

      return rightPinnedAt - leftPinnedAt;
    }

    return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
  });
}

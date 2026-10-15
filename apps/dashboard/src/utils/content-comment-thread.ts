import type { DiscussionComment } from "@/types/comments";

export function getContentCommentThreadEntries(
  items: DiscussionComment[],
  threadId: string
) {
  const byId = new Map(items.map((item) => [item.id, item]));
  return items.filter((item) => {
    if (item.id === threadId) {
      return true;
    }
    let parentId = item.parentId;
    for (let depth = 0; parentId && depth < 5; depth += 1) {
      if (parentId === threadId) {
        return true;
      }
      parentId = byId.get(parentId)?.parentId ?? null;
    }
    return false;
  });
}

export function getContentCommentReplyParent(
  entries: DiscussionComment[],
  selectedId: string | undefined
) {
  const selected = entries.find((entry) => entry.id === selectedId);
  return selected && !selected.deletedAt && selected.depth < 5
    ? selected
    : entries.find((entry) => !entry.deletedAt && entry.depth < 5);
}

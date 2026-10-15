"use client";

import type { RealtimeSchema } from "@notra/ai/realtime";
import type { DiscussionCommentAnchor } from "@notra/db/types/discussion-comments";
import { ORPCError } from "@orpc/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRealtime } from "@upstash/realtime/client";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "use-intl";

import { COMMENT_REACTIONS } from "@/constants/comments";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { CommentTarget, DiscussionComment } from "@/types/comments";
import { commentChannel } from "@/utils/comment-channel";
import { commentSubmitId } from "@/utils/comment-submit-id";

export function useDiscussion(target: CommentTarget, active = true) {
  const t = useTranslations("comments");
  const client = useQueryClient();
  const { organizationId, targetId, targetType } = target;
  const options = useMemo(
    () =>
      dashboardOrpc.comments.list.queryOptions({
        input: { organizationId, targetId, targetType },
      }),
    [organizationId, targetId, targetType]
  );
  const lock = useRef(false);
  const resolveToasts = useRef({ active: false, ids: new Set<string>() });
  useEffect(() => {
    const scope = { active: true, ids: new Set<string>() };
    resolveToasts.current = scope;
    return () => {
      scope.active = false;
      for (const id of scope.ids) {
        toast.dismiss(id);
      }
      scope.ids.clear();
    };
  }, [organizationId, targetId, targetType]);
  const { status } = useRealtime<RealtimeSchema, "discussion.changed">({
    channels: [commentChannel(target)],
    events: ["discussion.changed"],
    enabled:
      active && client.getQueryData(options.queryKey)?.realtimeEnabled === true,
    onData: () => {
      if (!lock.current) {
        void client.invalidateQueries({ queryKey: options.queryKey });
      }
    },
  });
  const query = useQuery({
    ...options,
    enabled: active,
    staleTime: 15000,
    retry: (failureCount, error) =>
      !(error instanceof ORPCError && error.code === "NOT_FOUND") &&
      failureCount < 1,
    refetchInterval: (current) =>
      status === "connected" || lock.current || current.state.status === "error"
        ? false
        : 10000,
    refetchOnWindowFocus: (current) =>
      !lock.current && current.state.status !== "error",
    refetchOnReconnect: (current) =>
      !lock.current && current.state.status !== "error",
  });
  useEffect(() => {
    if (active && status === "connected" && !lock.current) {
      void client.invalidateQueries({ queryKey: options.queryKey });
    }
  }, [active, status, client, options.queryKey]);
  const [draft, setDraft] = useState("");
  const [reply, setReply] = useState<DiscussionComment | null>(null);
  const [busy, setBusy] = useState(false);
  const section = useRef<HTMLElement>(null);
  const scrollToComment = useRef<string | null>(null);
  const retry = useRef<{
    id: string;
    body: string;
    parentId: string | null;
    anchorKey: string | null;
  } | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const items = useMemo(() => query.data?.items ?? [], [query.data?.items]);
  const user = query.data?.currentUser;

  useEffect(() => {
    const id = scrollToComment.current;
    if (!id) {
      return;
    }
    const comment = section.current?.querySelector(`[data-comment-id="${id}"]`);
    if (!comment) {
      return;
    }
    comment.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "nearest",
    });
    scrollToComment.current = null;
  }, [items]);

  function update(
    optimistic: (comments: DiscussionComment[]) => DiscussionComment[],
    persist: () => Promise<unknown>
  ) {
    if (lock.current) {
      return Promise.resolve(false);
    }
    lock.current = true;
    setBusy(true);
    let previous = client.getQueryData(options.queryKey);
    return client
      .cancelQueries({ queryKey: options.queryKey })
      .then(() => {
        previous = client.getQueryData(options.queryKey);
        client.setQueryData(options.queryKey, (data) =>
          data ? { ...data, items: optimistic(data.items) } : data
        );
        return persist();
      })
      .then(() => {
        client.setQueryData(options.queryKey, (data) =>
          data
            ? {
                ...data,
                items: data.items.map((item) => ({
                  ...item,
                  pending: false,
                })),
              }
            : data
        );
        return true;
      })
      .catch((error: unknown) => {
        client.setQueryData(options.queryKey, previous);
        toast.error(error instanceof Error ? error.message : t("saveFailed"));
        return false;
      })
      .finally(() => {
        void client.invalidateQueries({ queryKey: options.queryKey });
        lock.current = false;
        setBusy(false);
      });
  }

  function createComment(
    body: string,
    parent: DiscussionComment | null,
    anchor?: DiscussionCommentAnchor
  ) {
    if (!body || !user || lock.current) {
      return Promise.resolve(null);
    }
    const parentId = parent?.id ?? null;
    const anchorKey = anchor ? JSON.stringify(anchor) : null;
    const id = commentSubmitId(retry.current, body, parentId, anchorKey);
    retry.current = { id, body, parentId, anchorKey };
    scrollToComment.current = id;
    return update(
      (comments) =>
        comments.some((item) => item.id === id)
          ? comments
          : [
              ...comments,
              {
                id,
                parentId,
                depth: parent ? parent.depth + 1 : 0,
                userId: user.id,
                name: user.name,
                image: user.image,
                body,
                createdAt: new Date().toISOString(),
                editedAt: null,
                deletedAt: null,
                reactions: [],
                pending: true,
                anchor: anchor ?? null,
              },
            ],
      () =>
        dashboardOrpc.comments.create.call({
          ...target,
          id,
          parentId,
          body,
          ...(anchor ? { anchor } : {}),
        })
    ).then((saved) => {
      if (saved) {
        retry.current = null;
      } else {
        scrollToComment.current = null;
      }
      return saved ? id : null;
    });
  }

  function submit() {
    const body = draft.trim();
    if (!body || !user || lock.current) {
      return;
    }
    const parent = reply;
    setDraft("");
    setReply(null);
    void createComment(body, parent).then((saved) => {
      if (saved) {
        return;
      }
      setDraft((current) => (current ? `${body}\n\n${current}` : body));
      setReply(parent);
    });
  }

  function editComment(commentId: string, body: string) {
    return update(
      (comments) =>
        comments.map((item) =>
          item.id === commentId
            ? {
                ...item,
                body,
                editedAt: new Date().toISOString(),
              }
            : item
        ),
      () =>
        dashboardOrpc.comments.edit.call({
          ...target,
          commentId,
          body,
        })
    );
  }

  function deleteComment(commentId: string) {
    return update(
      (comments) =>
        comments.map((item) =>
          item.id === commentId
            ? {
                ...item,
                body: "",
                deletedAt: new Date().toISOString(),
              }
            : item
        ),
      () =>
        dashboardOrpc.comments.delete.call({
          ...target,
          commentId,
        })
    ).then(() => undefined);
  }

  function reactToComment(commentId: string, emoji: string, active: boolean) {
    const parsedEmoji = COMMENT_REACTIONS.find(
      (reaction) => reaction.emoji === emoji
    )?.emoji;
    if (!parsedEmoji || !user) {
      return;
    }
    void update(
      (comments) =>
        comments.map((item) =>
          item.id === commentId
            ? {
                ...item,
                reactions: [
                  ...item.reactions.filter(
                    (reaction) =>
                      !(reaction.userId === user.id && reaction.emoji === emoji)
                  ),
                  ...(active ? [{ userId: user.id, emoji }] : []),
                ],
              }
            : item
        ),
      () =>
        dashboardOrpc.comments.react.call({
          ...target,
          commentId,
          emoji: parsedEmoji,
          active,
        })
    );
  }

  function setCommentResolved(commentId: string, resolved: boolean) {
    if (target.targetType !== "content" || !user) {
      return Promise.resolve(false);
    }
    return update(
      (comments) =>
        comments.map((item) =>
          item.id === commentId
            ? {
                ...item,
                resolvedAt: resolved ? new Date().toISOString() : null,
                resolvedByUserId: resolved ? user.id : null,
              }
            : item
        ),
      () =>
        dashboardOrpc.comments.resolve.call({
          ...target,
          targetType: "content",
          commentId,
          resolved,
        })
    );
  }

  function resolveComment(commentId: string, resolved: boolean) {
    const toastId = `resolved:${organizationId}:${targetId}:${commentId}`;
    const scope = resolveToasts.current;
    return setCommentResolved(commentId, resolved).then((saved) => {
      if (!saved) {
        return false;
      }
      if (!scope.active) {
        return true;
      }
      if (resolved) {
        scope.ids.add(toastId);
        toast.success(t("threadResolved"), {
          id: toastId,
          duration: Infinity,
          closeButton: true,
          onDismiss: () => scope.ids.delete(toastId),
          action: {
            label: t("reopenThread"),
            onClick: async (event) => {
              event.preventDefault();
              if (await setCommentResolved(commentId, false)) {
                scope.ids.delete(toastId);
                toast.dismiss(toastId);
              }
            },
          },
        });
      } else {
        scope.ids.delete(toastId);
        toast.dismiss(toastId);
      }
      return true;
    });
  }

  return {
    query,
    items,
    user,
    busy,
    draft,
    setDraft,
    reply,
    setReply,
    section,
    textarea,
    submit,
    createComment,
    editComment,
    deleteComment,
    reactToComment,
    resolveComment,
  };
}

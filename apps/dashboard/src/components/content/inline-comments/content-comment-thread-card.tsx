"use client";

import { ArrowUp02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Spinner } from "@notra/ui/components/ui/spinner";
import { cn } from "@notra/ui/lib/utils";
import { useId, useRef, useState } from "react";
import { useTranslations } from "use-intl";

import { Button } from "@/components/button";
import { ContentCommentAvatar } from "@/components/content/inline-comments/content-comment-avatar";
import { useContentComments } from "@/components/content/inline-comments/content-comments-provider";
import { ContentInlineComment } from "@/components/content/inline-comments/content-inline-comment";
import type { DiscussionComment } from "@/types/comments";
import type {
  ContentCommentReplyFormProps,
  ContentCommentThreadCardProps,
} from "@/types/content/inline-comments";
import {
  getContentCommentReplyParent,
  getContentCommentThreadEntries,
} from "@/utils/content-comment-thread";

export function ContentCommentThreadCard({
  thread,
}: ContentCommentThreadCardProps) {
  const t = useTranslations("content.comments");
  const comments = useContentComments();
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [replyTo, setReplyTo] = useState<DiscussionComment | null>(null);
  if (!comments) {
    return null;
  }
  const { activeThreadId, discussion } = comments;
  const { comment, match } = thread;
  const active = activeThreadId === comment.id;
  const entries = getContentCommentThreadEntries(discussion.items, comment.id);

  return (
    <article
      aria-label={t("threadLabel", { name: comment.name })}
      className={cn(
        "bg-muted text-foreground focus-visible:ring-ring/50 w-full min-w-0 rounded-xl border p-2 shadow-sm transition-shadow outline-none focus-visible:ring-2 motion-reduce:transition-none",
        active && "shadow-md"
      )}
      data-comment-thread={comment.id}
      tabIndex={-1}
    >
      {comment.anchor && !match ? (
        <p className="text-muted-foreground px-1.5 pt-0.5 text-xs">
          {t("textNotFound")}
        </p>
      ) : null}
      <ol className="space-y-1">
        {entries.map((entry) => (
          <ContentInlineComment
            key={entry.id}
            busy={discussion.busy}
            comment={entry}
            comments={discussion.items}
            currentUserId={discussion.user?.id ?? ""}
            onDelete={discussion.deleteComment}
            onEdit={discussion.editComment}
            onReact={discussion.reactToComment}
            onReply={(item) => {
              setReplyTo(item);
              textarea.current?.focus();
            }}
            onResolve={discussion.resolveComment}
          />
        ))}
      </ol>
      <ContentCommentReplyForm
        comments={comments}
        comment={comment}
        entries={entries}
        replyTo={replyTo}
        onClearReply={() => setReplyTo(null)}
        textarea={textarea}
      />
    </article>
  );
}

function useContentCommentReply({
  comments,
  comment,
  entries,
  replyTo,
  onClearReply,
}: Pick<
  ContentCommentReplyFormProps,
  "comments" | "comment" | "entries" | "replyTo" | "onClearReply"
>) {
  const t = useTranslations("content.comments");
  const submitting = useRef(false);
  const [replyError, setReplyError] = useState(false);
  const { discussion, replyDrafts } = comments;
  const draft = replyDrafts[comment.id] ?? "";
  const replyParent = getContentCommentReplyParent(entries, replyTo?.id);
  const canReply = Boolean(
    replyParent &&
    draft.trim() &&
    discussion.user &&
    !discussion.busy &&
    !comment.pending &&
    !comments.blockedReason
  );
  const error =
    comments.blockedReason ?? (replyError ? t("replyFailed") : null);
  const submit = () => {
    if (!canReply || !replyParent || submitting.current) {
      return;
    }
    submitting.current = true;
    setReplyError(false);
    return discussion
      .createComment(draft.trim(), replyParent)
      .then((created) => {
        if (created) {
          comments.setReplyDraft(comment.id, "");
          onClearReply();
        } else {
          setReplyError(true);
        }
      })
      .catch(() => setReplyError(true))
      .finally(() => {
        submitting.current = false;
      });
  };
  return { draft, canReply, error, submit };
}

function ContentCommentReplyForm(props: ContentCommentReplyFormProps) {
  const { comments, comment, replyTo, onClearReply, textarea } = props;
  const tComments = useTranslations("comments");
  const errorId = useId();
  const { discussion, activateThread } = comments;
  const { draft, canReply, error, submit } = useContentCommentReply(props);

  return (
    <form
      className="border-border/70 mt-2 border-t border-dashed pt-2"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      {replyTo && replyTo.id !== comment.id ? (
        <div className="text-muted-foreground mb-1 flex items-center justify-between gap-2 text-xs">
          <span>{tComments("replyingTo", { name: replyTo.name })}</span>
          <Button
            aria-label={tComments("cancelReply")}
            onClick={() => {
              onClearReply();
              textarea.current?.focus();
            }}
            size="icon-sm"
            variant="ghost"
          >
            <HugeiconsIcon className="size-3" icon={Cancel01Icon} />
          </Button>
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <ContentCommentAvatar
          name={discussion.user?.name ?? "?"}
          image={discussion.user?.image ?? null}
        />
        <textarea
          aria-label={tComments("replyTo", { name: comment.name })}
          aria-describedby={error ? errorId : undefined}
          className="placeholder:text-muted-foreground field-sizing-content max-h-32 min-h-8 min-w-0 flex-1 resize-none border-0 bg-transparent py-1.5 text-sm leading-5 outline-none"
          onFocus={() => {
            if (
              comments.activeThreadId !== comment.id &&
              comment.anchor &&
              !comment.resolvedAt
            ) {
              activateThread(comment.id);
            }
          }}
          maxLength={10000}
          onChange={(event) =>
            comments.setReplyDraft(comment.id, event.target.value)
          }
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              void submit();
            }
          }}
          placeholder={tComments("writeReplyPlaceholder")}
          ref={textarea}
          readOnly={discussion.busy || Boolean(comment.pending)}
          rows={1}
          value={draft}
        />
        <button
          type="button"
          className="border-border text-muted-foreground hover:bg-muted focus-visible:ring-ring/50 inline-flex size-8 shrink-0 items-center justify-center rounded-md border outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40"
          aria-busy={discussion.busy}
          disabled={!canReply}
          aria-label={tComments("send")}
          onClick={() => {
            void submit();
          }}
          title={tComments("send")}
        >
          {discussion.busy ? (
            <Spinner />
          ) : (
            <HugeiconsIcon
              aria-hidden="true"
              className="size-4"
              icon={ArrowUp02Icon}
            />
          )}
        </button>
      </div>
      {error ? (
        <p
          className="text-destructive px-2 pt-1 text-xs"
          id={errorId}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}

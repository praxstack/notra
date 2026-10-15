"use client";

import { Popover } from "@base-ui/react/popover";
import {
  ArrowTurnBackwardIcon,
  Tick02Icon,
  Undo02Icon,
  MoreHorizontalIcon,
  SmilePlusIcon,
  PencilEdit02Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { useState } from "react";
import { useTranslations } from "use-intl";

import { Button } from "@/components/button";
import { CommentBody } from "@/components/comments/comment-body";
import { CommentEditForm } from "@/components/comments/comment-edit-form";
import { CommentTimestamp } from "@/components/comments/comment-timestamp";
import { ContentCommentAvatar } from "@/components/content/inline-comments/content-comment-avatar";
import {
  COMMENT_REACTIONS,
  INLINE_COMMENT_REACTIONS,
} from "@/constants/comments";
import type { CommentItemProps } from "@/types/comments";
import type { ContentInlineCommentReactionsProps } from "@/types/content/inline-comments";

export function ContentInlineComment({
  comment,
  currentUserId,
  busy,
  onEdit,
  onDelete,
  onReact,
  onReply,
  onResolve,
}: CommentItemProps) {
  const t = useTranslations("comments");
  const tCommon = useTranslations("common.actions");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [pickerOpen, setPickerOpen] = useState(false);
  const disabled = Boolean(busy || comment.pending);
  const author = comment.userId === currentUserId;
  if (comment.deletedAt) {
    return null;
  }
  return (
    <li
      className="group/inline-comment duration-normal ease-emphasized relative space-y-2 py-2 transition-[opacity,translate] motion-reduce:transition-none starting:translate-y-1 starting:opacity-0 motion-reduce:starting:translate-y-0"
      data-comment-id={comment.id}
    >
      <div className="relative flex h-6 items-center gap-2">
        <ContentCommentAvatar name={comment.name} image={comment.image} />
        <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
          <span className="text-foreground max-w-[65%] shrink-0 truncate font-medium">
            {comment.name}
          </span>
          <span className="text-muted-foreground min-w-0 truncate whitespace-nowrap">
            <CommentTimestamp createdAt={comment.createdAt} />
          </span>
        </div>
        <div className="bg-muted duration-fast before:from-muted before:to-muted/0 absolute inset-y-0 right-0 flex items-center gap-0.5 rounded-md opacity-100 transition-opacity ease-out before:pointer-events-none before:absolute before:inset-y-0 before:-left-8 before:w-8 before:bg-linear-to-l focus-within:opacity-100 has-[[data-popup-open]]:opacity-100 motion-reduce:transition-none [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/inline-comment:opacity-100">
          {!comment.parentId && onResolve ? (
            <Button
              aria-label={t(
                comment.resolvedAt ? "reopenThread" : "resolveThread"
              )}
              title={t(comment.resolvedAt ? "reopenThread" : "resolveThread")}
              size="icon-sm"
              variant="ghost"
              disabled={disabled}
              onClick={() => onResolve(comment.id, !comment.resolvedAt)}
            >
              <HugeiconsIcon
                aria-hidden="true"
                icon={comment.resolvedAt ? Undo02Icon : Tick02Icon}
              />
            </Button>
          ) : null}
          {(comment.parentId || !onResolve) && comment.depth < 5 ? (
            <Button
              aria-label={t("replyToComment")}
              title={t("replyToComment")}
              size="icon-sm"
              variant="ghost"
              disabled={disabled}
              onClick={() => onReply(comment)}
            >
              <HugeiconsIcon aria-hidden="true" icon={ArrowTurnBackwardIcon} />
            </Button>
          ) : null}
          <Popover.Root open={pickerOpen} onOpenChange={setPickerOpen}>
            <Popover.Trigger
              render={
                <Button
                  aria-label={t("addReaction")}
                  title={t("addReaction")}
                  size="icon-sm"
                  variant="ghost"
                  disabled={disabled}
                />
              }
            >
              <HugeiconsIcon aria-hidden="true" icon={SmilePlusIcon} />
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner
                side="top"
                align="end"
                sideOffset={8}
                collisionPadding={8}
                className="z-50"
              >
                <Popover.Popup
                  aria-label={t("addReaction")}
                  className="bg-background text-foreground flex items-center gap-1 rounded-xl border p-1 shadow-lg outline-none"
                >
                  {INLINE_COMMENT_REACTIONS.map(({ emoji, key }) => (
                    <button
                      key={emoji}
                      type="button"
                      aria-label={t(`reactions.${key}`)}
                      className="hover:bg-muted focus-visible:ring-ring/50 inline-flex size-8 items-center justify-center rounded-md text-lg outline-none focus-visible:ring-2"
                      disabled={disabled}
                      onClick={() => {
                        onReact(
                          comment.id,
                          emoji,
                          !comment.reactions.some(
                            (reaction) =>
                              reaction.emoji === emoji &&
                              reaction.userId === currentUserId
                          )
                        );
                        setPickerOpen(false);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          {author ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    aria-label={t("commentActions")}
                    title={t("commentActions")}
                    size="icon-sm"
                    variant="ghost"
                    disabled={disabled}
                  />
                }
              >
                <HugeiconsIcon aria-hidden="true" icon={MoreHorizontalIcon} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  disabled={disabled}
                  onClick={() => {
                    setDraft(comment.body);
                    setEditing(true);
                  }}
                >
                  <HugeiconsIcon icon={PencilEdit02Icon} />
                  {tCommon("edit")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={disabled}
                  variant="destructive"
                  onClick={() => {
                    void onDelete(comment.id);
                  }}
                >
                  <HugeiconsIcon icon={Delete02Icon} />
                  {tCommon("delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
      {editing ? (
        <CommentEditForm
          draft={draft}
          disabled={disabled}
          onDraftChange={setDraft}
          onCancel={() => setEditing(false)}
          onSave={async () => {
            if (await onEdit(comment.id, draft.trim())) {
              setEditing(false);
            }
          }}
        />
      ) : (
        <CommentBody body={comment.body} />
      )}
      <ContentInlineCommentReactions
        comment={comment}
        currentUserId={currentUserId}
        disabled={disabled}
        onReact={onReact}
      />
    </li>
  );
}

function ContentInlineCommentReactions({
  comment,
  currentUserId,
  disabled,
  onReact,
}: ContentInlineCommentReactionsProps) {
  const t = useTranslations("comments");
  return comment.reactions.length ? (
    <div className="flex flex-wrap gap-1">
      {COMMENT_REACTIONS.map(({ emoji, key }) => {
        const reactions = comment.reactions.filter(
          (reaction) => reaction.emoji === emoji
        );
        const active = reactions.some(
          (reaction) => reaction.userId === currentUserId
        );
        return reactions.length ? (
          <button
            key={emoji}
            type="button"
            aria-label={t("reactionCount", {
              label: t(`reactions.${key}`),
              count: reactions.length,
            })}
            aria-pressed={active}
            disabled={disabled}
            className="border-border hover:bg-muted aria-pressed:bg-muted inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs"
            onClick={() => onReact(comment.id, emoji, !active)}
          >
            {emoji} {reactions.length}
          </button>
        ) : null;
      })}
    </div>
  ) : null;
}

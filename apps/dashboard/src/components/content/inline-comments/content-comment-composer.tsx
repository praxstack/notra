"use client";

import { Popover } from "@base-ui/react/popover";
import { ArrowUp02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Composer } from "@notra/ui/components/ui/composer";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { useId, useRef } from "react";
import { useTranslations } from "use-intl";

import { useContentComments } from "@/components/content/inline-comments/content-comments-provider";
import { commentMatchAnchor } from "@/utils/comment-anchor";

export function ContentCommentComposer() {
  const t = useTranslations("content.comments");
  const comments = useContentComments();
  const textarea = useRef<HTMLTextAreaElement>(null);
  const errorId = useId();
  if (!comments?.enabled) {
    return null;
  }
  const {
    blockedReason,
    closeComposer,
    composerOpen,
    discussion,
    draft,
    draftMatch,
    editorRoot,
    setDraftBody,
    submitDraft,
    submitError,
    submitting,
  } = comments;
  const body = draft?.body ?? "";
  const canSubmit = Boolean(
    body.trim() && discussion.user && !submitting && !blockedReason
  );
  const open = Boolean(composerOpen && draft && draftMatch && editorRoot);
  const error = submitError ?? blockedReason;
  const submit = () => {
    if (canSubmit) {
      void submitDraft();
    }
  };

  return (
    <Popover.Root
      onOpenChange={(next) => {
        if (!next) {
          closeComposer();
        }
      }}
      open={open}
    >
      <Popover.Portal>
        <Popover.Positioner
          align="start"
          anchor={
            open && editorRoot && draftMatch
              ? commentMatchAnchor(editorRoot, draftMatch)
              : null
          }
          className="z-50"
          collisionPadding={12}
          side="bottom"
          sideOffset={8}
        >
          <Popover.Popup
            aria-label={t("composerLabel")}
            className="bg-popover text-popover-foreground duration-fast ease-emphasized w-[min(26rem,calc(100vw-2rem))] rounded-2xl border p-1 opacity-100 shadow-lg transition-[opacity,translate] outline-none data-ending-style:translate-y-1 data-ending-style:opacity-0 data-starting-style:translate-y-1 data-starting-style:opacity-0 motion-reduce:transition-none motion-reduce:data-ending-style:translate-y-0 motion-reduce:data-starting-style:translate-y-0"
            initialFocus={textarea}
          >
            <form
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
            >
              <Composer.Frame flat>
                <div className="flex items-end gap-2 p-1.5">
                  <Textarea
                    aria-describedby={error ? errorId : undefined}
                    aria-label={t("composerLabel")}
                    className="max-h-40 min-h-8 flex-1 resize-none"
                    maxLength={10000}
                    onChange={(event) => setDraftBody(event.target.value)}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.shiftKey &&
                        !event.nativeEvent.isComposing
                      ) {
                        event.preventDefault();
                        submit();
                      }
                    }}
                    placeholder={t("composerPlaceholder")}
                    readOnly={submitting}
                    ref={textarea}
                    rows={1}
                    value={body}
                  />
                  <Composer.Send
                    busy={submitting}
                    disabled={!canSubmit}
                    label={t("send")}
                    onClick={submit}
                    tooltip={t("send")}
                  >
                    <HugeiconsIcon className="size-4" icon={ArrowUp02Icon} />
                  </Composer.Send>
                </div>
              </Composer.Frame>
              {error ? (
                <p
                  className="text-destructive px-2.5 pt-1.5 pb-1 text-xs text-pretty"
                  id={errorId}
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
            </form>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

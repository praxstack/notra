"use client";

import { Popover } from "@base-ui/react/popover";
import { useEffect, useRef } from "react";
import { useTranslations } from "use-intl";

import { ContentCommentThreadCard } from "@/components/content/inline-comments/content-comment-thread-card";
import { useContentComments } from "@/components/content/inline-comments/content-comments-provider";
import { useContentCommentRail } from "@/lib/hooks/use-content-comment-rail";
import type { ContentCommentsLayerProps } from "@/types/content/inline-comments";
import { commentMatchAnchor, createCommentRange } from "@/utils/comment-anchor";

export function ContentCommentsLayer({ container }: ContentCommentsLayerProps) {
  const t = useTranslations("comments");
  const comments = useContentComments();
  const rail = useRef<HTMLDivElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const { fits, left, layout } = useContentCommentRail(container, rail);
  const request = comments?.focusRequest;
  const active = comments?.threads.find(
    (thread) => thread.comment.id === comments.activeThreadId
  );

  useEffect(() => {
    if (comments?.activeThreadId && !active) {
      comments.activateThread(null);
      if (document.activeElement === document.body) {
        comments.editorRoot?.focus({ preventScroll: true });
      }
    }
  }, [active, comments]);

  useEffect(() => {
    if (!request) {
      return;
    }
    const thread = comments?.threads.find(
      (item) => item.comment.id === request
    );
    if (thread?.match && comments?.editorRoot) {
      const range = createCommentRange(comments.editorRoot, thread.match);
      range?.startContainer.parentElement?.scrollIntoView({
        block: "nearest",
        behavior: "instant",
      });
    }
    const target = fits
      ? rail.current?.querySelector<HTMLElement>(
          `[data-comment-thread="${CSS.escape(request)}"]`
        )
      : popup.current?.querySelector<HTMLElement>("[data-comment-thread]");
    if (target) {
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: "nearest", behavior: "instant" });
      comments?.clearFocusRequest();
    }
  }, [request, fits, layout, comments]);

  if (!comments?.enabled) {
    return null;
  }
  return (
    <>
      {fits ? (
        <div
          aria-label={t("title")}
          className="absolute top-0 left-(--comment-rail-left) w-80"
          ref={rail}
          role="region"
          style={{ "--comment-rail-left": `${left}px` } as React.CSSProperties}
        >
          {layout.map(({ id, top }) => {
            const thread = comments.threads.find(
              (item) => item.comment.id === id
            );
            return thread ? (
              <div
                className="absolute top-(--comment-thread-top) w-full"
                data-rail-thread={id}
                key={id}
                style={
                  { "--comment-thread-top": `${top}px` } as React.CSSProperties
                }
              >
                <ContentCommentThreadCard thread={thread} />
              </div>
            ) : null;
          })}
        </div>
      ) : null}
      <Popover.Root
        open={Boolean(!fits && active?.match && comments.editorRoot)}
        onOpenChange={(open) => {
          if (!open) {
            comments.activateThread(null);
          }
        }}
      >
        <Popover.Portal>
          <Popover.Positioner
            anchor={
              active?.match && comments.editorRoot
                ? commentMatchAnchor(comments.editorRoot, active.match)
                : null
            }
            align="start"
            side="bottom"
            sideOffset={8}
            collisionPadding={12}
            className="z-50"
          >
            <Popover.Popup
              aria-label={t("title")}
              className="bg-popover text-popover-foreground duration-fast ease-emphasized max-h-[min(32rem,70dvh)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-xl transition-[opacity,translate] outline-none data-ending-style:translate-y-1 data-ending-style:opacity-0 data-starting-style:translate-y-1 data-starting-style:opacity-0 motion-reduce:transition-none motion-reduce:data-ending-style:translate-y-0 motion-reduce:data-starting-style:translate-y-0"
              ref={(element) => {
                popup.current = element;
                if (element && request) {
                  element
                    .querySelector<HTMLElement>("[data-comment-thread]")
                    ?.focus({ preventScroll: true });
                  comments.clearFocusRequest();
                }
              }}
              initialFocus={false}
            >
              {active ? <ContentCommentThreadCard thread={active} /> : null}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </>
  );
}

"use client";

import { type RefObject, useEffect, useEffectEvent, useState } from "react";

import { useContentComments } from "@/components/content/inline-comments/content-comments-provider";
import {
  CONTENT_COMMENT_CARD_FALLBACK_HEIGHT,
  CONTENT_COMMENT_CARD_GAP,
  CONTENT_COMMENT_RAIL_OFFSET,
  CONTENT_COMMENT_RAIL_WIDTH,
} from "@/constants/comments";
import type { ContentCommentRailLayout } from "@/types/content/inline-comments";
import {
  collectCommentTextNodes,
  createCommentRange,
} from "@/utils/comment-anchor";

export function useContentCommentRail(
  viewport: RefObject<HTMLElement | null>,
  rail: RefObject<HTMLElement | null>
) {
  const comments = useContentComments();
  const [fits, setFits] = useState(false);
  const [left, setLeft] = useState(0);
  const [layout, setLayout] = useState<ContentCommentRailLayout[]>([]);
  const root = comments?.editorRoot;
  const key = comments?.matchesKey;
  const layoutKey = layout.map((item) => item.id).join("|");
  const measure = useEffectEvent(() => {
    const element = viewport.current;
    if (!element || !root) {
      setFits(false);
      return;
    }
    const bounds = element.getBoundingClientRect();
    const editorBounds = root.getBoundingClientRect();
    const available = bounds.right - element.clientLeft - editorBounds.right;
    setFits(available >= CONTENT_COMMENT_RAIL_WIDTH);
    setLeft(
      editorBounds.right -
        bounds.left -
        element.clientLeft +
        element.scrollLeft +
        CONTENT_COMMENT_RAIL_OFFSET
    );
    const nodes = collectCommentTextNodes(root);
    const positioned = (comments?.threads ?? [])
      .flatMap((thread) => {
        const rect = thread.match
          ? createCommentRange(
              root,
              thread.match,
              nodes
            )?.getBoundingClientRect()
          : null;
        return rect
          ? [
              {
                id: thread.comment.id,
                top:
                  rect.top - bounds.top - element.clientTop + element.scrollTop,
              },
            ]
          : [];
      })
      .sort((a, b) => a.top - b.top);
    let bottom = 0;
    const next = positioned.map((item) => {
      const top = Math.max(0, item.top, bottom);
      const card = rail.current?.querySelector<HTMLElement>(
        `[data-rail-thread="${CSS.escape(item.id)}"]`
      );
      bottom =
        top +
        (card?.offsetHeight ?? CONTENT_COMMENT_CARD_FALLBACK_HEIGHT) +
        CONTENT_COMMENT_CARD_GAP;
      return { id: item.id, top };
    });
    setLayout((current) =>
      current.length === next.length &&
      current.every(
        (item, index) =>
          item.id === next[index]?.id && item.top === next[index]?.top
      )
        ? current
        : next
    );
  });

  useEffect(() => {
    const element = viewport.current;
    if (!element || !root) {
      return;
    }
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    schedule();
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    observer.observe(root);
    for (const card of rail.current?.children ?? []) {
      observer.observe(card);
    }
    window.addEventListener("resize", schedule);
    element.addEventListener("transitionend", schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      element.removeEventListener("transitionend", schedule);
    };
  }, [viewport, rail, root, key, fits, layoutKey]);

  return { fits, left, layout };
}

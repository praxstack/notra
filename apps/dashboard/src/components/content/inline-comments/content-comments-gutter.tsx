"use client";

import { cn } from "@notra/ui/lib/utils";

import { useContentComments } from "@/components/content/inline-comments/content-comments-provider";
import type { ContentCommentsGutterProps } from "@/types/content/inline-comments";

/** Moves the document left to make room for the comment rail once a thread is anchored. */
export function ContentCommentsGutter({
  children,
}: ContentCommentsGutterProps) {
  const comments = useContentComments();
  const hasAnchoredThreads = Boolean(
    comments?.enabled && comments.threads.some((thread) => thread.match)
  );
  return (
    <div
      className={cn(
        "duration-normal ease-emphasized transition-[padding] motion-reduce:transition-none",
        hasAnchoredThreads && "@6xl/editor:pr-88"
      )}
    >
      {children}
    </div>
  );
}

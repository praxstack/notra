"use client";

import { ArrowUp02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Composer } from "@notra/ui/components/ui/composer";
import { cn } from "@notra/ui/lib/utils";
import { useId } from "react";

import type { ContentCommentFieldProps } from "@/types/content/inline-comments";

/** Chat-input styled composer shared by new comments and thread replies. */
export function ContentCommentField({
  value,
  onChange,
  onSubmit,
  canSubmit,
  busy,
  readOnly,
  label,
  placeholder,
  sendLabel,
  error,
  nudge,
  textarea,
  onFocus,
  className,
  compact = false,
}: ContentCommentFieldProps) {
  const errorId = useId();
  const send = (
    <Composer.Send
      busy={busy}
      disabled={!canSubmit}
      label={sendLabel}
      onClick={onSubmit}
      tooltip={sendLabel}
    >
      <HugeiconsIcon className="size-4" icon={ArrowUp02Icon} />
    </Composer.Send>
  );
  return (
    <form
      className={cn("min-w-0", className)}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <Composer.Frame flat={compact} nudge={nudge}>
        <div className={cn(compact && "flex items-end gap-1 p-1")}>
          <Composer.Input
            aria-describedby={error ? errorId : undefined}
            aria-label={label}
            className={cn(
              "field-sizing-content max-h-40 w-full",
              compact ? "min-h-8 flex-1 px-2 py-1" : "min-h-10"
            )}
            maxLength={10000}
            onChange={(event) => onChange(event.target.value)}
            onFocus={onFocus}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                onSubmit();
              }
            }}
            placeholder={placeholder}
            readOnly={readOnly}
            ref={textarea}
            rows={1}
            value={value}
          />
          {compact ? send : null}
        </div>
        {compact ? null : (
          <Composer.Toolbar className="justify-end pt-0 pb-1.5">
            {send}
          </Composer.Toolbar>
        )}
        {error ? (
          <p
            className="text-destructive border-border/70 border-t px-3 py-2 text-xs text-pretty"
            id={errorId}
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </Composer.Frame>
    </form>
  );
}

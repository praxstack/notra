"use client";

import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  CheckmarkSquare01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";
import { Button } from "@notra/ui/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@notra/ui/components/ui/collapsible";
import Link from "next/link";
import {
  getContentTypeLabel,
  type ContentType,
} from "@/components/content/content-card";
import { OutputTypeIcon } from "@/utils/output-types";

interface ContentPreviewCardProps {
  title: string;
  markdown: string;
  contentType: ContentType;
  state: "pending" | "saved" | "discarded";
  postId?: string;
  organizationSlug: string;
  onApprove?: () => void;
  onDeny?: () => void;
}

export function ContentPreviewCard({
  title,
  markdown,
  contentType,
  state,
  postId,
  organizationSlug,
  onApprove,
  onDeny,
}: ContentPreviewCardProps) {
  if (state === "discarded") {
    return (
      <div className="rounded-lg border border-border border-dashed px-4 py-3 text-muted-foreground text-sm">
        Discarded: {title}
      </div>
    );
  }

  const defaultOpen = state === "pending";

  return (
    <Collapsible defaultOpen={defaultOpen}>
      <div className="rounded-lg border border-border bg-muted/80">
        <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-2">
          <HugeiconsIcon
            className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:hidden"
            icon={ArrowRight01Icon}
          />
          <HugeiconsIcon
            className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=closed]:hidden"
            icon={ArrowDown01Icon}
          />
          <span className="min-w-0 truncate font-medium text-sm">{title}</span>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            {state === "saved" && (
              <Badge className="text-[0.625rem]" variant="outline">
                draft
              </Badge>
            )}
            <Badge
              className="flex items-center gap-1 text-[0.625rem] capitalize"
              variant="secondary"
            >
              <OutputTypeIcon className="size-3" outputType={contentType} />
              {getContentTypeLabel(contentType)}
            </Badge>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="mx-2 mb-2 max-h-48 overflow-y-auto rounded-lg border border-border/80 bg-background px-4 py-3">
            <div className="whitespace-pre-wrap text-muted-foreground text-sm leading-relaxed">
              {markdown}
            </div>
          </div>
        </CollapsibleContent>

        <div className="flex items-center justify-end gap-2 px-3 pb-2">
          {state === "pending" && (
            <>
              <Button onClick={onDeny} size="sm" variant="ghost">
                <HugeiconsIcon className="size-4" icon={Cancel01Icon} />
                Discard
              </Button>
              <Button onClick={onApprove} size="sm">
                <HugeiconsIcon
                  className="size-4"
                  icon={CheckmarkSquare01Icon}
                />
                Save as draft
              </Button>
            </>
          )}
          {state === "saved" && postId && (
            <Button
              nativeButton={false}
              render={<Link href={`/${organizationSlug}/content/${postId}`} />}
              size="sm"
              variant="outline"
            >
              <HugeiconsIcon className="size-4" icon={ArrowRight01Icon} />
              Open post
            </Button>
          )}
        </div>
      </div>
    </Collapsible>
  );
}

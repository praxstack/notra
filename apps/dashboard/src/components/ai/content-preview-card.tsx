"use client";

import {
  ArrowRight01Icon,
  Cancel01Icon,
  CheckmarkSquare01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { LinkedInPostPreview } from "@notra/ui/components/ai-elements/linkedin-post-preview";
import { TwitterPostPreview } from "@notra/ui/components/ai-elements/twitter-post-preview";
import { Badge } from "@notra/ui/components/ui/badge";
import { Button } from "@notra/ui/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@notra/ui/components/ui/collapsible";
import Link from "next/link";
import { useCallback, useState } from "react";
import {
  type ContentType,
  getContentTypeLabel,
} from "@/components/content/content-card";
import { OutputTypeIcon } from "@/utils/output-types";

interface ContentPreviewCardAuthor {
  name: string;
  avatar?: string;
}

interface ContentPreviewCardProps {
  title: string;
  markdown: string;
  contentType: ContentType;
  state: "pending" | "saved" | "discarded";
  postId?: string;
  organizationSlug: string;
  author?: ContentPreviewCardAuthor;
  onApprove?: () => void;
  onDeny?: () => void;
}

function SocialMediaPreview({
  contentType,
  markdown,
  author,
}: {
  contentType: ContentType;
  markdown: string;
  author?: ContentPreviewCardAuthor;
}) {
  if (contentType === "linkedin_post") {
    return (
      <LinkedInPostPreview
        author={{
          name: author?.name ?? "Your Name",
          avatar: author?.avatar,
        }}
        className="w-full"
        content={markdown}
        timestamp="Just now"
      />
    );
  }

  if (contentType === "twitter_post") {
    return (
      <TwitterPostPreview
        author={{
          name: author?.name ?? "Your Name",
          avatar: author?.avatar,
          handle: (author?.name ?? "yourname")
            .toLowerCase()
            .replace(/\s+/g, ""),
        }}
        className="w-full"
        content={markdown}
        timestamp="Just now"
      />
    );
  }

  return null;
}

function GenericPreview({ markdown }: { markdown: string }) {
  return (
    <div className="max-h-48 overflow-y-auto rounded-lg border border-border/80 bg-background px-4 py-3">
      <div className="whitespace-pre-wrap text-muted-foreground text-sm leading-relaxed">
        {markdown}
      </div>
    </div>
  );
}

export function ContentPreviewCard({
  title,
  markdown,
  contentType,
  state: serverState,
  postId,
  organizationSlug,
  author,
  onApprove,
  onDeny,
}: ContentPreviewCardProps) {
  const [optimisticState, setOptimisticState] = useState<
    "pending" | "saved" | "discarded" | null
  >(null);

  const state = optimisticState ?? serverState;

  const handleApprove = useCallback(() => {
    setOptimisticState("saved");
    onApprove?.();
  }, [onApprove]);

  const handleDeny = useCallback(() => {
    setOptimisticState("discarded");
    onDeny?.();
  }, [onDeny]);

  const isSocialMedia =
    contentType === "linkedin_post" || contentType === "twitter_post";
  const defaultOpen = state === "pending";

  return (
    <Collapsible defaultOpen={defaultOpen}>
      <div className="ml-px max-w-sm">
        <div className="rounded-lg border border-border bg-muted/80">
          <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-2 [&[data-panel-open]>svg]:rotate-90">
            <HugeiconsIcon
              className="size-4 shrink-0 text-muted-foreground transition-transform"
              icon={ArrowRight01Icon}
            />
            <span className="min-w-0 truncate font-medium text-sm">
              {title}
            </span>
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
            <div className="mx-2 mb-2 max-w-sm">
              {isSocialMedia ? (
                <SocialMediaPreview
                  author={author}
                  contentType={contentType}
                  markdown={markdown}
                />
              ) : (
                <GenericPreview markdown={markdown} />
              )}
            </div>
          </CollapsibleContent>

          <div className="flex items-center justify-end gap-2 px-3 pb-2">
            {state === "pending" && (
              <>
                <Button onClick={handleDeny} size="sm" variant="ghost">
                  <HugeiconsIcon className="size-4" icon={Cancel01Icon} />
                  Discard
                </Button>
                <Button onClick={handleApprove} size="sm">
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
                render={
                  <Link href={`/${organizationSlug}/content/${postId}`} />
                }
                size="sm"
                variant="outline"
              >
                <HugeiconsIcon className="size-4" icon={ArrowRight01Icon} />
                Open post
              </Button>
            )}
          </div>
        </div>
      </div>
    </Collapsible>
  );
}

"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@notra/ui/components/ui/collapsible";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";

const TOOL_STATUS_LABELS: Record<string, string> = {
  updatePost: "Updating post...",
  viewPost: "Viewing post...",
  getAvailablePosts: "Loading posts...",
  getPostById: "Loading post...",
  listBrandIdentities: "Loading brand identities...",
  getBrandIdentity: "Loading brand identity...",
  getAvailableIntegrations: "Checking integrations...",
  getAvailableBrandReferences: "Loading brand references...",
  getPullRequests: "Fetching pull requests...",
  getReleaseByTag: "Fetching release...",
  getCommitsByTimeframe: "Fetching commits...",
  getLinearIssues: "Fetching Linear issues...",
  getLinearProjects: "Fetching Linear projects...",
  getLinearCycles: "Fetching Linear cycles...",
  listAvailableSkills: "Checking skills...",
  getSkillByName: "Loading skill...",
};

interface ChatToolBlockProps {
  toolName: string;
  state: string;
  input?: unknown;
  output?: unknown;
}

export function ChatToolBlock({
  toolName,
  state,
  input,
  output,
}: ChatToolBlockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isStreaming =
    state === "input-streaming" || state === "input-available";
  const baseLabel = TOOL_STATUS_LABELS[toolName] ?? `Running ${toolName}...`;
  const label = isStreaming
    ? baseLabel
    : `${baseLabel.replace("...", "")} completed`;
  const hasDetails =
    (input !== undefined && input !== null) ||
    (output !== undefined && output !== null);

  return (
    <Collapsible onOpenChange={setIsOpen} open={isOpen}>
      <CollapsibleTrigger
        className="flex items-center gap-1.5 text-muted-foreground text-xs transition-colors hover:text-foreground disabled:cursor-default disabled:hover:text-muted-foreground"
        disabled={!hasDetails}
      >
        {isStreaming ? <Loader2Icon className="size-3 animate-spin" /> : null}
        <span>{label}</span>
        {hasDetails ? (
          <HugeiconsIcon
            className={`size-3 transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
            icon={ArrowDown01Icon}
          />
        ) : null}
      </CollapsibleTrigger>
      <CollapsibleContent className="data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 mt-2 space-y-2 data-[state=closed]:animate-out data-[state=open]:animate-in">
        {input !== undefined && input !== null ? (
          <div className="space-y-1">
            <div className="font-medium text-[0.65rem] text-muted-foreground uppercase tracking-wide">
              Input
            </div>
            <pre className="max-h-64 overflow-auto rounded-md bg-muted p-2 text-[0.7rem] text-muted-foreground">
              <code>{JSON.stringify(input, null, 2)}</code>
            </pre>
          </div>
        ) : null}
        {output !== undefined && output !== null ? (
          <div className="space-y-1">
            <div className="font-medium text-[0.65rem] text-muted-foreground uppercase tracking-wide">
              Output
            </div>
            <pre className="max-h-64 overflow-auto rounded-md bg-muted p-2 text-[0.7rem] text-muted-foreground">
              <code>{JSON.stringify(output, null, 2)}</code>
            </pre>
          </div>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}

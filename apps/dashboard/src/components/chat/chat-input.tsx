"use client";

import {
  AiBrain01Icon,
  AtIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@notra/ui/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { ClaudeAiIcon } from "@notra/ui/components/ui/svgs/claudeAiIcon";
import { Github } from "@notra/ui/components/ui/svgs/github";
import { Linear } from "@notra/ui/components/ui/svgs/linear";
import { Openai } from "@notra/ui/components/ui/svgs/openai";
import { OpenaiDark } from "@notra/ui/components/ui/svgs/openaiDark";

import { Textarea } from "@notra/ui/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { useCustomer } from "autumn-js/react";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";

import { FEATURES } from "@/constants/features";
import { INPUT_SOURCES } from "@/lib/integrations/catalog";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { ContextItem } from "@/types/chat";
import type { GitHubRepository } from "@/types/integrations";

const AVAILABLE_MODELS = [
  {
    id: "anthropic/claude-opus-4-6",
    label: "Opus 4.6",
    description: "Most capable",
    pricing: "$5 input / $25 output per 1M",
    provider: "anthropic",
  },
  {
    id: "anthropic/claude-sonnet-4-6",
    label: "Sonnet 4.6",
    description: "Balanced speed & quality",
    pricing: "$3 input / $15 output per 1M",
    provider: "anthropic",
  },
  {
    id: "anthropic/claude-haiku-4-5",
    label: "Haiku 4.5",
    description: "Fast & lightweight",
    pricing: "$1 input / $5 output per 1M",
    provider: "anthropic",
  },
  {
    id: "openai/gpt-5.4",
    label: "GPT-5.4",
    description: "OpenAI flagship",
    pricing: "$2.50 input / $15 output per 1M",
    provider: "openai",
  },
] as const;

type ModelProvider = (typeof AVAILABLE_MODELS)[number]["provider"];

function ModelIcon({
  provider,
  className,
}: {
  provider: ModelProvider;
  className?: string;
}) {
  if (provider === "openai") {
    return (
      <>
        <Openai className={`${className ?? ""} block dark:hidden`} />
        <OpenaiDark className={`${className ?? ""} hidden dark:block`} />
      </>
    );
  }
  return <ClaudeAiIcon className={className} />;
}

const THINKING_LEVELS = ["off", "low", "medium", "high"] as const;
export type ThinkingLevel = (typeof THINKING_LEVELS)[number];

interface ChatInputAdvancedProps {
  onSend?: (value: string) => void;
  isLoading?: boolean;
  organizationSlug?: string;
  organizationId?: string;
  context?: ContextItem[];
  onAddContext?: (item: ContextItem) => void;
  onRemoveContext?: (item: ContextItem) => void;
  error?: string | null;
  onClearError?: () => void;
  model?: string;
  onModelChange?: (model: string) => void;
  thinkingLevel?: ThinkingLevel;
  onThinkingLevelChange?: (level: ThinkingLevel) => void;
}

const THINKING_LABELS: Record<ThinkingLevel, string> = {
  off: "Think",
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function ChatInputAdvanced({
  onSend,
  isLoading = false,
  organizationSlug,
  organizationId,
  context = [],
  onAddContext,
  onRemoveContext,
  error: externalError,
  onClearError,
  model = "anthropic/claude-sonnet-4-6",
  onModelChange,
  thinkingLevel = "medium",
  onThinkingLevelChange,
}: ChatInputAdvancedProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState("");
  const [internalError, setInternalError] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const mentionStartRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const mentionListRef = useRef<HTMLDivElement | null>(null);
  const { check, data: customer } = useCustomer();

  const checkResult = useMemo(() => {
    if (!customer) {
      return null;
    }
    return check({
      featureId: FEATURES.AI_CREDITS,
      requiredBalance: 1,
    });
  }, [check, customer]);

  const remainingChatCredits =
    typeof checkResult?.balance?.remaining === "number"
      ? checkResult.balance.remaining
      : null;
  const shouldShowLowCredits =
    remainingChatCredits !== null &&
    remainingChatCredits > 0 &&
    remainingChatCredits <= 10;
  const isUsageBlocked = checkResult ? checkResult.allowed === false : false;
  const limitMessage = "No chat credits left.";
  const usageLimitError =
    externalError ?? internalError ?? (isUsageBlocked ? limitMessage : null);

  const clearError = useCallback(() => {
    setInternalError(null);
    onClearError?.();
  }, [onClearError]);

  const { data: integrationsData } = useQuery(
    dashboardOrpc.integrations.list.queryOptions({
      input: { organizationId: organizationId ?? "" },
      enabled: !!organizationId,
    })
  );

  const enabledRepos = useMemo(() => {
    const result: Array<GitHubRepository & { integrationId: string }> = [];
    for (const integration of integrationsData?.integrations ?? []) {
      for (const repo of integration.repositories) {
        if (repo.enabled) {
          result.push({ ...repo, integrationId: integration.id });
        }
      }
    }
    return result;
  }, [integrationsData?.integrations]);

  const enabledLinearIntegrations = useMemo(() => {
    const result: Array<{
      id: string;
      displayName: string;
      integrationId: string;
      teamName?: string | null;
    }> = [];
    for (const integration of integrationsData?.integrations ?? []) {
      if (integration.type === "linear" && integration.enabled) {
        result.push({
          id: integration.id,
          displayName: integration.displayName,
          integrationId: integration.id,
          teamName:
            "linearTeamName" in integration
              ? (integration.linearTeamName as string | null)
              : null,
        });
      }
    }
    return result;
  }, [integrationsData?.integrations]);

  type MentionItem =
    | { kind: "github"; data: GitHubRepository & { integrationId: string } }
    | {
        kind: "linear";
        data: {
          id: string;
          displayName: string;
          integrationId: string;
          teamName?: string | null;
        };
      };

  const isRepoInContext = useCallback(
    (repo: GitHubRepository & { integrationId: string }) =>
      context.some(
        (c) =>
          c.type === "github-repo" &&
          c.owner === repo.owner &&
          c.repo === repo.repo
      ),
    [context]
  );

  const isLinearInContext = useCallback(
    (integration: { integrationId: string }) =>
      context.some(
        (c) =>
          c.type === "linear-team" &&
          c.integrationId === integration.integrationId
      ),
    [context]
  );

  const filteredMentionItems = useMemo(() => {
    if (mentionQuery === null) {
      return [];
    }
    const q = mentionQuery.toLowerCase();
    const items: MentionItem[] = [];
    for (const repo of enabledRepos) {
      if (`${repo.owner}/${repo.repo}`.toLowerCase().includes(q)) {
        items.push({ kind: "github", data: repo });
      }
    }
    for (const integration of enabledLinearIntegrations) {
      if (integration.displayName.toLowerCase().includes(q)) {
        items.push({ kind: "linear", data: integration });
      }
    }
    return items;
  }, [mentionQuery, enabledRepos, enabledLinearIntegrations]);

  const handleTextChange = useCallback(
    (newValue: string, cursorPos?: number) => {
      setValue(newValue);

      const pos =
        cursorPos ?? textareaRef.current?.selectionStart ?? newValue.length;
      const textBeforeCursor = newValue.slice(0, pos);
      const atIndex = textBeforeCursor.lastIndexOf("@");

      if (atIndex !== -1) {
        const charBefore = atIndex > 0 ? textBeforeCursor[atIndex - 1] : " ";
        if (charBefore === " " || charBefore === "\n" || atIndex === 0) {
          const query = textBeforeCursor.slice(atIndex + 1);
          if (!query.includes(" ") && !query.includes("\n")) {
            mentionStartRef.current = atIndex;
            setMentionQuery(query);
            setMentionIndex(0);
            return;
          }
        }
      }

      mentionStartRef.current = null;
      setMentionQuery(null);
    },
    []
  );

  const insertMention = useCallback(
    (item: MentionItem) => {
      const start = mentionStartRef.current;
      if (start === null) {
        return;
      }

      const before = value.slice(0, start);
      const textarea = textareaRef.current;
      const cursorPos = textarea?.selectionStart ?? value.length;
      const after = value.slice(cursorPos);

      setValue(before + after);
      setMentionQuery(null);
      mentionStartRef.current = null;

      if (item.kind === "github" && !isRepoInContext(item.data)) {
        onAddContext?.({
          type: "github-repo",
          owner: item.data.owner,
          repo: item.data.repo,
          integrationId: item.data.integrationId,
        });
      } else if (item.kind === "linear" && !isLinearInContext(item.data)) {
        onAddContext?.({
          type: "linear-team",
          integrationId: item.data.integrationId,
          teamName: item.data.teamName ?? undefined,
        });
      }

      requestAnimationFrame(() => {
        if (textarea) {
          textarea.selectionStart = before.length;
          textarea.selectionEnd = before.length;
          textarea.focus();
        }
      });
    },
    [value, isRepoInContext, isLinearInContext, onAddContext]
  );

  const resizeTextarea = useCallback(() => {
    const element = textareaRef.current;
    if (!element) {
      return;
    }
    element.style.height = "0";
    const maxHeightRem = 12.5;
    const maxHeightPx =
      maxHeightRem *
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
    element.style.height = `${Math.min(element.scrollHeight / Number.parseFloat(getComputedStyle(document.documentElement).fontSize), maxHeightRem)}rem`;
    element.style.overflowY =
      element.scrollHeight > maxHeightPx ? "auto" : "hidden";
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) {
      return;
    }

    clearError();

    if (isUsageBlocked) {
      setInternalError(limitMessage);
      return;
    }

    if (customer) {
      const result = check({
        featureId: FEATURES.AI_CREDITS,
        requiredBalance: 1,
      });
      if (result?.allowed === false) {
        setInternalError(limitMessage);
        return;
      }
    }

    onSend?.(trimmed);
    setValue("");
    requestAnimationFrame(resizeTextarea);
  }, [
    onSend,
    resizeTextarea,
    value,
    isLoading,
    check,
    customer,
    isUsageBlocked,
    clearError,
  ]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (mentionQuery !== null && filteredMentionItems.length > 0) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setMentionIndex((prev) =>
            prev < filteredMentionItems.length - 1 ? prev + 1 : 0
          );
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setMentionIndex((prev) =>
            prev > 0 ? prev - 1 : filteredMentionItems.length - 1
          );
          return;
        }
        if (event.key === "Enter") {
          event.preventDefault();
          const selected = filteredMentionItems[mentionIndex];
          if (selected) {
            insertMention(selected);
          }
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          setMentionQuery(null);
          mentionStartRef.current = null;
          return;
        }
      }

      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [
      mentionQuery,
      filteredMentionItems,
      mentionIndex,
      insertMention,
      handleSend,
    ]
  );

  const currentModel =
    AVAILABLE_MODELS.find((m) => m.id === model) ?? AVAILABLE_MODELS[0];

  return (
    <Card
      className="w-full gap-0 overflow-visible rounded-[14px] border-0 bg-background py-0 shadow-none transition-shadow duration-200 ease-out-expo"
      data-focused={isFocused ? "true" : "false"}
    >
      <CardHeader className="sr-only">
        <span>Chat input</span>
      </CardHeader>
      <CardContent className="p-0">
        <div
          className="rounded-[14px] border border-border bg-background shadow-sm"
          tabIndex={-1}
        >
          <div className="p-0.5">
            {usageLimitError && (
              <div className="mx-2 mt-2 mb-1 flex w-fit max-w-full flex-wrap items-center gap-1 rounded-md bg-destructive/10 px-2 py-1 text-destructive text-xs">
                <span>{usageLimitError}</span>
                {organizationSlug && (
                  <Link
                    className="font-medium underline underline-offset-2"
                    href={`/${organizationSlug}/settings/billing`}
                  >
                    Upgrade
                  </Link>
                )}
              </div>
            )}
            {context.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 px-3 pt-2.5 pb-0.5">
                {context.map((item) => {
                  const label =
                    item.type === "github-repo"
                      ? `${item.owner}/${item.repo}`
                      : (item.teamName ?? "Linear");
                  return (
                    <div
                      className="flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1 text-foreground text-xs"
                      key={`${item.type}-${item.integrationId}`}
                    >
                      {item.type === "github-repo" ? (
                        <Github className="size-3.5 shrink-0" />
                      ) : (
                        <Linear className="size-3.5 shrink-0" />
                      )}
                      <span className="font-medium">{label}</span>
                      <button
                        aria-label={`Remove ${label} from context`}
                        className="ml-0.5 cursor-pointer rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        onClick={() => onRemoveContext?.(item)}
                        type="button"
                      >
                        <HugeiconsIcon className="size-3" icon={Cancel01Icon} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="relative flex flex-col bg-background">
              <div className="flex w-full items-center">
                <div className="relative flex flex-1 cursor-text transition-colors [--lh:1lh]">
                  <Textarea
                    aria-label="Send a message"
                    className="max-h-50 min-h-12 w-full resize-none whitespace-pre-wrap rounded-none border-0 bg-transparent py-2 pr-2 pl-3.5 text-foreground text-sm leading-6 caret-foreground shadow-none outline-none ring-0 focus-visible:border-transparent focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isLoading || isUsageBlocked}
                    onBlur={() => {
                      setIsFocused(false);
                      setTimeout(() => {
                        if (
                          !mentionListRef.current?.contains(
                            document.activeElement
                          )
                        ) {
                          setMentionQuery(null);
                          mentionStartRef.current = null;
                        }
                      }, 150);
                    }}
                    onChange={(event) =>
                      handleTextChange(
                        event.target.value,
                        event.target.selectionStart
                      )
                    }
                    onFocus={() => setIsFocused(true)}
                    onInput={resizeTextarea}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      isLoading
                        ? "AI is working..."
                        : "Send a message... (type @ to add context)"
                    }
                    ref={textareaRef}
                    rows={1}
                    value={value}
                  />
                </div>
              </div>
              {mentionQuery !== null && (
                <div
                  className="absolute bottom-full left-1 z-50 mb-1 w-56"
                  ref={mentionListRef}
                >
                  <div className="max-h-64 overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md">
                    <div className="px-2 py-1.5 font-semibold text-xs">
                      Integrations
                    </div>
                    {filteredMentionItems.length > 0 ? (
                      <>
                        {filteredMentionItems.map((item, idx) => {
                          const key =
                            item.kind === "github"
                              ? item.data.id
                              : item.data.integrationId;
                          const inContext =
                            item.kind === "github"
                              ? isRepoInContext(item.data)
                              : isLinearInContext(item.data);
                          const label =
                            item.kind === "github"
                              ? `${item.data.owner}/${item.data.repo}`
                              : item.data.displayName;
                          return (
                            <button
                              className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors ${
                                idx === mentionIndex
                                  ? "bg-accent text-accent-foreground"
                                  : "text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                              }`}
                              key={key}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                insertMention(item);
                              }}
                              type="button"
                            >
                              {item.kind === "github" ? (
                                <Github className="size-4" />
                              ) : (
                                <Linear className="size-4" />
                              )}
                              <span className="truncate text-sm">{label}</span>
                              {inContext && (
                                <span className="ml-auto text-emerald-600 text-xs dark:text-emerald-400">
                                  Added
                                </span>
                              )}
                            </button>
                          );
                        })}
                        {organizationSlug && (
                          <>
                            <div className="-mx-1 my-1 h-px bg-border" />
                            <Link
                              className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                              href={`/${organizationSlug}/integrations`}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              Manage integrations
                            </Link>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1 px-3 py-4 text-center">
                        <span className="text-muted-foreground text-xs">
                          {enabledRepos.length === 0 &&
                          enabledLinearIntegrations.length === 0
                            ? "No integrations connected"
                            : "No matches found"}
                        </span>
                        {enabledRepos.length === 0 &&
                          enabledLinearIntegrations.length === 0 &&
                          organizationSlug && (
                            <Link
                              className="text-primary text-xs hover:underline"
                              href={`/${organizationSlug}/integrations`}
                            >
                              Connect integrations
                            </Link>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {shouldShowLowCredits && (
              <div className="px-3 pb-1 text-muted-foreground text-xs">
                {remainingChatCredits} chat messages left
              </div>
            )}
            <CardFooter className="flex items-center gap-1.5 overflow-hidden p-2">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      className="bg-muted hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isLoading}
                      size="sm"
                      variant="outline"
                    />
                  }
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <HugeiconsIcon className="size-3.5" icon={AiBrain01Icon} />
                    {THINKING_LABELS[thinkingLevel]}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Thinking effort</DropdownMenuLabel>
                  </DropdownMenuGroup>
                  {THINKING_LEVELS.map((level) => (
                    <DropdownMenuItem
                      key={level}
                      onClick={() => onThinkingLevelChange?.(level)}
                    >
                      <span className="text-sm capitalize">
                        {level === "off" ? "Off" : THINKING_LABELS[level]}
                      </span>
                      {thinkingLevel === level && (
                        <span className="ml-auto text-primary text-xs">✓</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      className="bg-muted hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isLoading}
                      size="sm"
                      variant="outline"
                    />
                  }
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <ModelIcon
                      className="size-3.5"
                      provider={currentModel.provider}
                    />
                    {currentModel.label}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Model</DropdownMenuLabel>
                  </DropdownMenuGroup>
                  {AVAILABLE_MODELS.map((m) => (
                    <DropdownMenuItem
                      key={m.id}
                      onClick={() => onModelChange?.(m.id)}
                    >
                      <ModelIcon
                        className="size-4 shrink-0"
                        provider={m.provider}
                      />
                      <div className="flex min-w-0 flex-col">
                        <span className="text-sm">{m.label}</span>
                        <span className="text-muted-foreground text-xs">
                          {m.description}
                        </span>
                        <span className="text-[0.625rem] text-muted-foreground/70">
                          {m.pricing}
                        </span>
                      </div>
                      {model === m.id && (
                        <span className="ml-auto shrink-0 text-primary text-xs">
                          ✓
                        </span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      className="flex items-center gap-1.5 rounded-lg border border-border border-dashed px-2.5 py-1.5 font-medium text-muted-foreground text-xs transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isLoading}
                      type="button"
                    />
                  }
                >
                  <HugeiconsIcon className="size-3.5" icon={AtIcon} />
                  Context
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Integrations</DropdownMenuLabel>
                  </DropdownMenuGroup>
                  {INPUT_SOURCES.map((integration) => {
                    const isGitHub = integration.id === "github";
                    const isLinear = integration.id === "linear";
                    const isAvailable = integration.available;

                    if (isGitHub && isAvailable && enabledRepos.length > 0) {
                      return (
                        <DropdownMenuSub key={integration.id}>
                          <DropdownMenuSubTrigger>
                            <span className="size-4 shrink-0 text-foreground [&_svg]:size-4">
                              {integration.icon}
                            </span>
                            <span className="text-foreground">
                              {integration.name}
                            </span>
                            <span className="ml-auto text-emerald-600 text-xs dark:text-emerald-400">
                              {enabledRepos.length}
                            </span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>
                                Select Repository
                              </DropdownMenuLabel>
                            </DropdownMenuGroup>
                            {enabledRepos.map((repo) => {
                              const inContext = isRepoInContext(repo);
                              return (
                                <DropdownMenuItem
                                  key={repo.id}
                                  onClick={() => {
                                    if (inContext) {
                                      onRemoveContext?.({
                                        type: "github-repo",
                                        owner: repo.owner,
                                        repo: repo.repo,
                                        integrationId: repo.integrationId,
                                      });
                                    } else {
                                      onAddContext?.({
                                        type: "github-repo",
                                        owner: repo.owner,
                                        repo: repo.repo,
                                        integrationId: repo.integrationId,
                                      });
                                    }
                                  }}
                                >
                                  <Github className="size-4" />
                                  <span className="truncate">
                                    {repo.owner}/{repo.repo}
                                  </span>
                                  {inContext && (
                                    <span className="ml-auto text-emerald-600 text-xs dark:text-emerald-400">
                                      Added
                                    </span>
                                  )}
                                </DropdownMenuItem>
                              );
                            })}
                            {organizationSlug && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  render={
                                    <Link
                                      href={`/${organizationSlug}/integrations/github`}
                                    />
                                  }
                                >
                                  Manage repositories
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      );
                    }

                    if (
                      isLinear &&
                      isAvailable &&
                      enabledLinearIntegrations.length > 0
                    ) {
                      return (
                        <DropdownMenuSub key={integration.id}>
                          <DropdownMenuSubTrigger>
                            <span className="size-4 shrink-0 text-foreground [&_svg]:size-4">
                              {integration.icon}
                            </span>
                            <span className="text-foreground">
                              {integration.name}
                            </span>
                            <span className="ml-auto text-emerald-600 text-xs dark:text-emerald-400">
                              {enabledLinearIntegrations.length}
                            </span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>
                                Select Integration
                              </DropdownMenuLabel>
                            </DropdownMenuGroup>
                            {enabledLinearIntegrations.map((li) => {
                              const inContext = isLinearInContext(li);
                              return (
                                <DropdownMenuItem
                                  key={li.id}
                                  onClick={() => {
                                    if (inContext) {
                                      onRemoveContext?.({
                                        type: "linear-team",
                                        integrationId: li.integrationId,
                                        teamName: li.teamName ?? undefined,
                                      });
                                    } else {
                                      onAddContext?.({
                                        type: "linear-team",
                                        integrationId: li.integrationId,
                                        teamName: li.teamName ?? undefined,
                                      });
                                    }
                                  }}
                                >
                                  <Linear className="size-4" />
                                  <span className="truncate">
                                    {li.displayName}
                                  </span>
                                  {inContext && (
                                    <span className="ml-auto text-emerald-600 text-xs dark:text-emerald-400">
                                      Added
                                    </span>
                                  )}
                                </DropdownMenuItem>
                              );
                            })}
                            {organizationSlug && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  render={
                                    <Link
                                      href={`/${organizationSlug}/integrations/linear`}
                                    />
                                  }
                                >
                                  Manage Linear
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      );
                    }

                    if (
                      (isGitHub || isLinear) &&
                      isAvailable &&
                      organizationSlug
                    ) {
                      return (
                        <DropdownMenuItem
                          key={integration.id}
                          render={
                            <Link
                              href={`/${organizationSlug}/integrations/${integration.href}`}
                            />
                          }
                        >
                          <span className="size-4 shrink-0 text-foreground [&_svg]:size-4">
                            {integration.icon}
                          </span>
                          <span className="text-foreground">
                            {integration.name}
                          </span>
                          <span className="ml-auto text-muted-foreground text-xs">
                            Setup
                          </span>
                        </DropdownMenuItem>
                      );
                    }

                    return (
                      <DropdownMenuItem
                        className="opacity-60"
                        disabled
                        key={integration.id}
                      >
                        <span className="size-4 shrink-0 text-foreground [&_svg]:size-4">
                          {integration.icon}
                        </span>
                        <span className="text-foreground">
                          {integration.name}
                        </span>
                        <span className="ml-auto text-muted-foreground text-xs">
                          Soon
                        </span>
                      </DropdownMenuItem>
                    );
                  })}
                  {organizationSlug && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        render={
                          <Link href={`/${organizationSlug}/integrations`} />
                        }
                      >
                        Manage integrations
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      className="group/button ml-auto h-7 shrink-0 rounded-lg bg-muted px-1.5 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isLoading || isUsageBlocked}
                      onClick={handleSend}
                      size="sm"
                      tabIndex={0}
                      type="button"
                      variant="outline"
                    />
                  }
                >
                  <div className="flex items-center gap-1 text-foreground text-sm">
                    {isLoading ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <>
                        <div className="px-0.5 text-sm leading-0">Send</div>
                        <div className="hidden h-4 items-center rounded border border-border bg-background px-1 text-[10px] text-muted-foreground shadow-xs sm:inline-flex">
                          ↵
                        </div>
                      </>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {isLoading
                    ? "AI is thinking..."
                    : "Enter to send. Shift+Enter for a new line."}
                </TooltipContent>
              </Tooltip>
            </CardFooter>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

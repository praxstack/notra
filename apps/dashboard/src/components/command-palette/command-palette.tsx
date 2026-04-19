"use client";

import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  Loading03Icon,
  Message01Icon,
  SearchIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@notra/ui/components/ui/dialog";
import { cn } from "@notra/ui/lib/utils";
import { Command as CommandPrimitive } from "cmdk";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { useCommandPalette } from "./command-palette-context";
import {
  COMMAND_ROUTES,
  COMMAND_SECTIONS,
  type CommandSection,
} from "./registry";

type AiResult =
  | { action: "navigate"; path: string; reason: string }
  | { action: "chat"; path: null; reason: string };

const APPLE_PLATFORM_PATTERN = /Mac|iPhone|iPad|iPod/i;
const BRAILLE_FRAMES = [
  "⠋",
  "⠙",
  "⠹",
  "⠸",
  "⠼",
  "⠴",
  "⠦",
  "⠧",
  "⠇",
  "⠏",
] as const;
const BRAILLE_INTERVAL_MS = 80;

function BrailleSpinner({ className }: { className?: string }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setFrame((prev) => (prev + 1) % BRAILLE_FRAMES.length);
    }, BRAILLE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span
      aria-hidden="true"
      className={cn("inline-block font-mono tabular-nums", className)}
    >
      {BRAILLE_FRAMES[frame]}
    </span>
  );
}

function Kbd({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <kbd
      className={cn(
        "pointer-events-none inline-flex h-5 min-w-5 select-none items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground",
        className
      )}
    >
      {children}
    </kbd>
  );
}

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const { activeOrganization } = useOrganizationsContext();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isApplePlatform, setIsApplePlatform] = useState(true);
  const [aiState, setAiState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "ready"; result: AiResult }
    | { status: "error" }
  >({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  const slug = activeOrganization?.slug ?? "";

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (!next) {
        abortRef.current?.abort();
        abortRef.current = null;
        setQuery("");
        setAiState({ status: "idle" });
      }
    },
    [setOpen]
  );

  useHotkeys(
    "mod+k",
    (event) => {
      if (
        !open &&
        typeof document !== "undefined" &&
        document.querySelector('[role="dialog"][data-state="open"]')
      ) {
        return;
      }
      event.preventDefault();
      handleOpenChange(!open);
    },
    { enableOnFormTags: true, enableOnContentEditable: true }
  );

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const platform = navigator.platform || navigator.userAgent;
    setIsApplePlatform(APPLE_PLATFORM_PATTERN.test(platform));
  }, []);

  const groupedRoutes = useMemo(() => {
    const groups: Record<CommandSection, typeof COMMAND_ROUTES> = {
      Navigation: [],
      Workspace: [],
      Automation: [],
      Manage: [],
      Settings: [],
    };
    for (const route of COMMAND_ROUTES) {
      groups[route.section].push(route);
    }
    return groups;
  }, []);

  const navigate = useCallback(
    (path: string) => {
      handleOpenChange(false);
      router.push(path);
    },
    [router, handleOpenChange]
  );

  const openChatWithQuery = useCallback(
    (text: string) => {
      if (!slug) {
        return;
      }
      const qs = text ? `?q=${encodeURIComponent(text)}` : "";
      navigate(`/${slug}/chat${qs}`);
    },
    [navigate, slug]
  );

  const runAiSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!(trimmed && slug)) {
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setAiState({ status: "loading" });
    try {
      const response = await fetch("/api/command-palette/navigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, slug }),
        signal: controller.signal,
      });
      if (controller.signal.aborted) {
        return;
      }
      if (!response.ok) {
        setAiState({ status: "error" });
        return;
      }
      const result = (await response.json()) as AiResult;
      if (controller.signal.aborted) {
        return;
      }
      setAiState({ status: "ready", result });
      if (result.action === "navigate" && result.path) {
        navigate(result.path);
      } else if (result.action === "chat") {
        openChatWithQuery(trimmed);
      } else {
        setAiState({ status: "error" });
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return;
      }
      setAiState({ status: "error" });
    }
  }, [query, slug, navigate, openChatWithQuery]);

  if (!slug) {
    return null;
  }

  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;
  const isLoading = aiState.status === "loading";
  const aiModifierLabel = isApplePlatform ? "⌘" : "Ctrl";

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent
        className="top-[18%] w-[calc(100%-2rem)] max-w-[640px]! translate-y-0 gap-0 overflow-hidden rounded-xl! border border-border/60 p-0! shadow-2xl sm:max-w-[640px]!"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Command Palette</DialogTitle>
          <DialogDescription>
            Search pages, jump to tools, or ask AI.
          </DialogDescription>
        </DialogHeader>
        <CommandPrimitive
          className="flex size-full flex-col bg-popover text-popover-foreground"
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              (event.metaKey || event.ctrlKey) &&
              hasQuery
            ) {
              event.preventDefault();
              runAiSearch().catch(() => undefined);
            }
          }}
          shouldFilter={aiState.status === "idle"}
        >
          <div className="flex h-12 items-center gap-2.5 border-border/60 border-b px-4">
            {isLoading ? (
              <BrailleSpinner className="size-4 shrink-0 text-center text-[15px] text-foreground leading-none" />
            ) : (
              <HugeiconsIcon
                className="size-4 shrink-0 text-muted-foreground"
                icon={SearchIcon}
                strokeWidth={2}
              />
            )}
            <CommandPrimitive.Input
              className={cn(
                "flex-1 bg-transparent text-foreground text-sm outline-none",
                "placeholder:text-muted-foreground/70",
                isLoading && "text-muted-foreground"
              )}
              onValueChange={(value) => {
                setQuery(value);
                if (aiState.status !== "idle") {
                  setAiState({ status: "idle" });
                }
              }}
              placeholder="Search pages, actions, or ask AI…"
              value={query}
            />
            {hasQuery ? (
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Kbd>{aiModifierLabel}</Kbd>
                <Kbd>↵</Kbd>
                <span>for AI</span>
              </div>
            ) : null}
          </div>

          <div className="overflow-hidden">
            {isLoading ? (
              <div className="flex h-[14rem] flex-col items-center justify-center gap-3 px-6 text-center">
                <div className="flex items-center gap-2 text-foreground text-sm">
                  <BrailleSpinner className="text-[18px] leading-none" />
                  <span className="font-medium">Thinking…</span>
                </div>
                <p className="max-w-xs text-muted-foreground text-xs">
                  Figuring out where to take you for &ldquo;{trimmedQuery}
                  &rdquo;.
                </p>
              </div>
            ) : null}
            <CommandPrimitive.List
              className={cn(
                "max-h-[24rem] scroll-py-2 overflow-y-auto overscroll-contain p-1.5",
                isLoading && "hidden"
              )}
            >
              <CommandPrimitive.Empty className="px-3 py-10">
                <div className="mx-auto flex max-w-sm flex-col items-center gap-4 text-center">
                  <div className="flex size-10 items-center justify-center rounded-full border border-border border-dashed bg-muted/40">
                    <HugeiconsIcon
                      className="size-4 text-muted-foreground"
                      icon={SparklesIcon}
                      strokeWidth={2}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground text-sm">
                      No matches for &ldquo;{trimmedQuery}&rdquo;
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Let AI navigate for you or open a chat with your question.
                    </p>
                  </div>
                  <div className="flex w-full flex-col gap-1.5">
                    <button
                      className="group flex items-center gap-3 rounded-lg border border-border/80 bg-background px-3 py-2.5 text-left text-sm transition-all duration-150 hover:border-border hover:bg-muted/60 disabled:opacity-60"
                      disabled={isLoading}
                      onClick={runAiSearch}
                      type="button"
                    >
                      <HugeiconsIcon
                        className={cn(
                          "size-4 text-muted-foreground transition-colors group-hover:text-foreground",
                          isLoading && "animate-spin motion-reduce:animate-none"
                        )}
                        icon={isLoading ? Loading03Icon : SparklesIcon}
                        strokeWidth={2}
                      />
                      <span className="flex-1 font-medium">
                        {isLoading ? "Thinking…" : "Navigate with AI"}
                      </span>
                      <div className="flex items-center gap-1">
                        <Kbd>{aiModifierLabel}</Kbd>
                        <Kbd>↵</Kbd>
                      </div>
                    </button>
                    <button
                      className="group flex items-center gap-3 rounded-lg border border-border/80 bg-background px-3 py-2.5 text-left text-sm transition-all duration-150 hover:border-border hover:bg-muted/60"
                      onClick={() => openChatWithQuery(trimmedQuery)}
                      type="button"
                    >
                      <HugeiconsIcon
                        className="size-4 text-muted-foreground transition-colors group-hover:text-foreground"
                        icon={Message01Icon}
                        strokeWidth={2}
                      />
                      <span className="flex-1 font-medium">Ask AI chat</span>
                      <HugeiconsIcon
                        className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                        icon={ArrowRight01Icon}
                        strokeWidth={2}
                      />
                    </button>
                  </div>
                  {aiState.status === "error" ? (
                    <p className="text-destructive text-xs">
                      AI search failed. Try the chat fallback.
                    </p>
                  ) : null}
                </div>
              </CommandPrimitive.Empty>

              {COMMAND_SECTIONS.map((section) => {
                const items = groupedRoutes[section];
                if (items.length === 0) {
                  return null;
                }
                return (
                  <CommandPrimitive.Group
                    className="px-1 pb-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
                    heading={section}
                    key={section}
                  >
                    {items.map((item) => (
                      <CommandPrimitive.Item
                        className={cn(
                          "group/item relative flex cursor-default select-none items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] outline-none transition-colors",
                          "data-[selected=true]:bg-muted data-[selected=true]:text-foreground",
                          "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50"
                        )}
                        key={item.id}
                        keywords={item.keywords}
                        onSelect={() => navigate(item.path(slug))}
                        value={item.label}
                      >
                        <HugeiconsIcon
                          className="size-4 shrink-0 text-muted-foreground transition-colors group-data-[selected=true]/item:text-foreground"
                          icon={item.icon}
                          strokeWidth={2}
                        />
                        <span className="flex-1 truncate">{item.label}</span>
                        <HugeiconsIcon
                          className="size-3 text-muted-foreground opacity-0 transition-opacity group-data-[selected=true]/item:opacity-60"
                          icon={ArrowRight01Icon}
                          strokeWidth={2}
                        />
                      </CommandPrimitive.Item>
                    ))}
                  </CommandPrimitive.Group>
                );
              })}

              {hasQuery ? (
                <CommandPrimitive.Group
                  className="px-1 pb-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
                  heading="AI"
                >
                  <CommandPrimitive.Item
                    className="group/item relative flex cursor-default select-none items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] outline-none transition-colors data-[selected=true]:bg-muted data-[selected=true]:text-foreground"
                    keywords={["ai", "ask", "natural language"]}
                    onSelect={runAiSearch}
                    value={`__ai_navigate_${query}`}
                  >
                    <HugeiconsIcon
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-colors group-data-[selected=true]/item:text-foreground",
                        isLoading && "animate-spin motion-reduce:animate-none"
                      )}
                      icon={isLoading ? Loading03Icon : SparklesIcon}
                      strokeWidth={2}
                    />
                    <span className="flex-1 truncate">
                      {isLoading
                        ? "Thinking…"
                        : `Navigate with AI: "${trimmedQuery}"`}
                    </span>
                    <div className="flex items-center gap-1">
                      <Kbd>{aiModifierLabel}</Kbd>
                      <Kbd>↵</Kbd>
                    </div>
                  </CommandPrimitive.Item>
                  <CommandPrimitive.Item
                    className="group/item relative flex cursor-default select-none items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] outline-none transition-colors data-[selected=true]:bg-muted data-[selected=true]:text-foreground"
                    keywords={["chat", "conversation", "message"]}
                    onSelect={() => openChatWithQuery(trimmedQuery)}
                    value={`__ai_chat_${query}`}
                  >
                    <HugeiconsIcon
                      className="size-4 shrink-0 text-muted-foreground transition-colors group-data-[selected=true]/item:text-foreground"
                      icon={Message01Icon}
                      strokeWidth={2}
                    />
                    <span className="flex-1 truncate">
                      Ask AI chat about this
                    </span>
                    <HugeiconsIcon
                      className="size-3 text-muted-foreground opacity-0 transition-opacity group-data-[selected=true]/item:opacity-60"
                      icon={ArrowRight01Icon}
                      strokeWidth={2}
                    />
                  </CommandPrimitive.Item>
                </CommandPrimitive.Group>
              ) : null}
            </CommandPrimitive.List>
          </div>

          <div className="flex h-9 shrink-0 items-center justify-between gap-3 border-border/60 border-t bg-muted/30 px-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Kbd>
                  <HugeiconsIcon
                    className="size-2.5"
                    icon={ArrowUp01Icon}
                    strokeWidth={2}
                  />
                </Kbd>
                <Kbd>
                  <HugeiconsIcon
                    className="size-2.5"
                    icon={ArrowDown01Icon}
                    strokeWidth={2}
                  />
                </Kbd>
                <span className="ml-0.5">Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <Kbd>↵</Kbd>
                <span className="ml-0.5">Select</span>
              </div>
              <div className="hidden items-center gap-1 sm:flex">
                <Kbd className="px-1 text-[9.5px]">esc</Kbd>
                <span className="ml-0.5">Close</span>
              </div>
            </div>
          </div>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  );
}

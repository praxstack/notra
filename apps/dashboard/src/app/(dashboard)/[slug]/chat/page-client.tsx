"use client";

import { useChat } from "@ai-sdk/react";
import { X } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ContentType } from "@notra/ai/schemas/content";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@notra/ui/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@notra/ui/components/ai-elements/reasoning";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import { useCustomer } from "autumn-js/react";
import { Loader2Icon } from "lucide-react";
import { nanoid } from "nanoid";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrailleLoader } from "@/components/braille-loader";
import {
  ChatInputAdvanced,
  type ThinkingLevel,
} from "@/components/chat/chat-input";
import { renderTextWithIntegrationReferences } from "@/components/chat/integration-reference";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { authClient } from "@/lib/auth/client";
import type { ContextItem } from "@/types/chat";
import {
  CHAT_PREFERENCES_STORAGE_KEY,
  DEFAULT_CHAT_PREFERENCES,
  parseStoredChatModel,
  parseStoredThinkingLevel,
  readStoredChatPreferences,
  writeStoredChatPreferences,
} from "@/utils/chat-preferences";
import { formatLongDate, getGreeting } from "@/utils/dashboard-greeting";

const ContentPreviewCard = dynamic(
  () =>
    import("@/components/ai/content-preview-card").then(
      (mod) => mod.ContentPreviewCard
    ),
  { ssr: false }
);

interface PageClientProps {
  organizationSlug: string;
  chatId?: string;
}

const TOOL_STATUS_LABELS: Record<string, string> = {
  update_post: "Updating post...",
  view_post: "Viewing post...",
  getPullRequests: "Fetching pull requests...",
  getReleaseByTag: "Fetching release...",
  getCommitsByTimeframe: "Fetching commits...",
  getLinearIssues: "Fetching Linear issues...",
  getLinearProjects: "Fetching Linear projects...",
  getLinearCycles: "Fetching Linear cycles...",
  listAvailableSkills: "Checking skills...",
  getSkillByName: "Loading skill...",
};

const CREATE_TOOL_PREFIX = "tool-create_";

function isCreateTool(type: string): boolean {
  return type.startsWith(CREATE_TOOL_PREFIX);
}

export default function PageClient({
  organizationSlug,
  chatId: initialChatId,
}: PageClientProps) {
  const { getOrganization, activeOrganization } = useOrganizationsContext();
  const orgFromList = getOrganization(organizationSlug);
  const organization =
    activeOrganization?.slug === organizationSlug
      ? activeOrganization
      : orgFromList;
  const organizationId = organization?.id ?? "";
  const { data: session } = authClient.useSession();
  const { refetch: refetchCustomer } = useCustomer();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [pendingMessageId, setPendingMessageId] = useState<string | null>(null);

  const stableChatId = useMemo(
    () => initialChatId || nanoid(16),
    [initialChatId]
  );

  const [context, setContext] = useState<ContextItem[]>([]);
  const [hasCustomizedContext, setHasCustomizedContext] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(
    DEFAULT_CHAT_PREFERENCES.model
  );
  const [thinkingLevel, setThinkingLevel] = useState<ThinkingLevel>(
    DEFAULT_CHAT_PREFERENCES.thinkingLevel
  );
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const contextRef = useRef(context);
  const hasCustomizedContextRef = useRef(hasCustomizedContext);
  const organizationIdRef = useRef(organizationId);
  const selectedModelRef = useRef(selectedModel);
  const thinkingLevelRef = useRef(thinkingLevel);
  contextRef.current = context;
  hasCustomizedContextRef.current = hasCustomizedContext;
  selectedModelRef.current = selectedModel;
  thinkingLevelRef.current = thinkingLevel;
  organizationIdRef.current = organizationId;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/organizations/${organizationId}/chat`,
        prepareSendMessagesRequest: ({ id, messages }) => ({
          body: {
            chatId: id,
            messages,
            context: hasCustomizedContextRef.current
              ? contextRef.current
              : undefined,
            model: selectedModelRef.current,
            enableThinking: thinkingLevelRef.current !== "off",
            thinkingLevel: thinkingLevelRef.current,
          },
        }),
        prepareReconnectToStreamRequest: ({ id }) => ({
          api: `/api/organizations/${organizationIdRef.current}/chat/${id}/stream`,
          headers: { "x-chat-reconnect": "true" },
        }),
        fetch: async (input, init) => {
          const headers = new Headers(init?.headers);

          if (headers.get("x-chat-reconnect") === "true") {
            return fetch(input, init);
          }

          const body = JSON.parse(String(init?.body)) as {
            chatId: string;
            messages: Array<{ id?: string }>;
          };
          const latestMessageId = body.messages.at(-1)?.id;

          if (latestMessageId) {
            setPendingMessageId(latestMessageId);
          }

          const triggerResponse = await fetch(input, init);
          if (!triggerResponse.ok) {
            return triggerResponse;
          }

          const contentType = triggerResponse.headers.get("content-type") ?? "";
          if (contentType.includes("text/event-stream")) {
            return triggerResponse;
          }

          return fetch(
            `/api/organizations/${organizationIdRef.current}/chat/${body.chatId}/stream`,
            {
              method: "GET",
              headers: init?.headers,
              credentials: init?.credentials,
              signal: init?.signal,
            }
          );
        },
      }),
    [organizationId]
  );

  const handleChatError = useCallback((err: Error) => {
    const errorMessage = err.message || String(err);

    try {
      const errorData = JSON.parse(errorMessage);
      if (typeof errorData.error === "string" && errorData.error.length > 0) {
        setChatError(errorData.error);
      }
      if (errorData.code === "USAGE_LIMIT_REACHED") {
        setChatError(
          "You've used all your chat messages this month. Upgrade for more."
        );
        return;
      }
    } catch {
      // Ignore non-JSON error payloads.
    }

    if (
      errorMessage.includes("USAGE_LIMIT_REACHED") ||
      errorMessage.includes("Usage limit reached")
    ) {
      setChatError(
        "You've used all your chat messages this month. Upgrade for more."
      );
      return;
    }
    console.error("Standalone chat error:", err);
    setPendingMessageId(null);
  }, []);

  const [wasStoppedByUser, setWasStoppedByUser] = useState(false);

  const handleFinish = useCallback(() => {
    setPendingMessageId(null);
    refetchCustomer();
    queryClient.invalidateQueries({
      queryKey: ["chat-sessions", organizationId],
    });
  }, [organizationId, queryClient, refetchCustomer]);

  const {
    messages,
    setMessages,
    sendMessage,
    addToolApprovalResponse,
    status,
    stop,
  } = useChat({
    id: stableChatId,
    resume: Boolean(initialChatId && pendingMessageId),
    experimental_throttle: 50,
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    onFinish: handleFinish,
    onError: handleChatError,
  });

  const [isStopping, setIsStopping] = useState(false);

  const handleModelChange = useCallback((model: string) => {
    const nextModel = parseStoredChatModel(model);
    if (!nextModel) {
      return;
    }

    setSelectedModel(nextModel);
  }, []);

  const handleThinkingLevelChange = useCallback((level: ThinkingLevel) => {
    const nextThinkingLevel = parseStoredThinkingLevel(level);
    if (!nextThinkingLevel) {
      return;
    }

    setThinkingLevel(nextThinkingLevel);
  }, []);

  useEffect(() => {
    function syncChatPreferencesFromStorage() {
      const storedPreferences = readStoredChatPreferences();
      if (!storedPreferences) {
        return;
      }

      setSelectedModel(storedPreferences.model);
      setThinkingLevel(storedPreferences.thinkingLevel);
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== CHAT_PREFERENCES_STORAGE_KEY) {
        return;
      }

      syncChatPreferencesFromStorage();
    }

    syncChatPreferencesFromStorage();
    window.addEventListener("focus", syncChatPreferencesFromStorage);
    window.addEventListener("storage", handleStorage);
    document.addEventListener(
      "visibilitychange",
      syncChatPreferencesFromStorage
    );

    return () => {
      window.removeEventListener("focus", syncChatPreferencesFromStorage);
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener(
        "visibilitychange",
        syncChatPreferencesFromStorage
      );
    };
  }, []);

  useEffect(() => {
    writeStoredChatPreferences({
      model: selectedModel,
      thinkingLevel,
    });
  }, [selectedModel, thinkingLevel]);

  const handleStop = useCallback(async () => {
    setIsStopping(true);
    setWasStoppedByUser(true);
    try {
      if (organizationId && stableChatId) {
        await fetch(
          `/api/organizations/${organizationId}/chat/${encodeURIComponent(stableChatId)}/stop`,
          { method: "POST" }
        );
      }
    } catch (stopError) {
      console.error("[Chat] Failed to notify server to stop:", stopError);
    } finally {
      stop();
    }
  }, [organizationId, stableChatId, stop]);

  const chatHistoryQuery = useQuery({
    queryKey: ["chat-history", organizationId, initialChatId],
    queryFn: async () => {
      if (!initialChatId) {
        return null;
      }
      const res = await fetch(
        `/api/organizations/${organizationId}/chat/${encodeURIComponent(initialChatId)}`
      );
      if (!res.ok) {
        return null;
      }
      const data = await res.json();
      return {
        messages: data?.messages ?? null,
        lastResponseStopped: Boolean(data?.lastResponseStopped),
      };
    },
    enabled: Boolean(initialChatId) && Boolean(organizationId),
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!chatHistoryQuery.data) {
      return;
    }
    if (chatHistoryQuery.data.messages?.length) {
      setMessages(chatHistoryQuery.data.messages);
    }
    setWasStoppedByUser(Boolean(chatHistoryQuery.data.lastResponseStopped));
  }, [chatHistoryQuery.data, setMessages]);

  useEffect(() => {
    setPendingMessageId(null);
    setChatError(null);

    if (initialChatId) {
      return;
    }

    setWasStoppedByUser(false);
    setMessages([]);
    setContext([]);
    setHasCustomizedContext(false);
  }, [initialChatId, setMessages]);

  const isLoadingHistory = chatHistoryQuery.isLoading && messages.length === 0;
  const isLoading = status === "streaming" || status === "submitted";
  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (!isLoading) {
      setIsStopping(false);
    }
  }, [isLoading]);

  const handleAddContext = useCallback((item: ContextItem) => {
    setHasCustomizedContext(true);
    setContext((prev) => {
      const exists = prev.some((c) => {
        if (c.type !== item.type) {
          return false;
        }
        if (c.type === "github-repo" && item.type === "github-repo") {
          return c.owner === item.owner && c.repo === item.repo;
        }
        return c.integrationId === item.integrationId;
      });
      if (exists) {
        return prev;
      }
      return [...prev, item];
    });
  }, []);

  const handleRemoveContext = useCallback((item: ContextItem) => {
    setHasCustomizedContext(true);
    setContext((prev) =>
      prev.filter((c) => {
        if (c.type !== item.type) {
          return true;
        }
        if (c.type === "github-repo" && item.type === "github-repo") {
          return !(c.owner === item.owner && c.repo === item.repo);
        }
        return c.integrationId !== item.integrationId;
      })
    );
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      const isFirstMessage = !initialChatId;
      setWasStoppedByUser(false);
      await sendMessage({ text });
      if (isFirstMessage) {
        router.replace(`/${organizationSlug}/chat/${stableChatId}`);
        queryClient.invalidateQueries({
          queryKey: ["chat-sessions", organizationId],
        });
      }
    },
    [
      initialChatId,
      organizationId,
      organizationSlug,
      queryClient,
      router,
      sendMessage,
      stableChatId,
    ]
  );

  const messageCount = messages.length;
  const lastPartCount = messages.at(-1)?.parts?.length ?? 0;
  const hasScrolledRef = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages and new parts
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    if (hasScrolledRef.current) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    } else {
      hasScrolledRef.current = true;
      container.scrollTop = container.scrollHeight;
    }
  }, [messageCount, lastPartCount]);

  const handleClearError = useCallback(() => setChatError(null), []);

  const contentAuthor = useMemo(
    () => ({
      name: organization?.name ?? "Your Name",
      avatar: organization?.logo ?? undefined,
    }),
    [organization?.name, organization?.logo]
  );

  function renderPart(
    part: { type: string; [key: string]: unknown },
    messageId: string,
    index: number
  ) {
    if (part.type === "text") {
      const text = part.text as string;
      if (!text.trim()) {
        return null;
      }

      const hasInlineReference =
        text.includes("integration/github/") ||
        text.includes("integration/linear/");

      if (hasInlineReference) {
        return (
          <div
            className="wrap-break-word size-full whitespace-pre-wrap"
            key={`${messageId}-text-${index}`}
          >
            {renderTextWithIntegrationReferences(text)}
          </div>
        );
      }

      return (
        <MessageResponse key={`${messageId}-text-${index}`}>
          {text}
        </MessageResponse>
      );
    }

    if (part.type === "reasoning") {
      const text = part.text as string;
      if (!text) {
        return null;
      }
      return (
        <Reasoning
          isStreaming={isLoading}
          key={`${messageId}-reasoning-${index}`}
        >
          <ReasoningTrigger />
          <ReasoningContent>{text}</ReasoningContent>
        </Reasoning>
      );
    }

    if (part.type.startsWith("tool-")) {
      const toolPart = part as {
        type: string;
        state: string;
        toolCallId: string;
        input?: { title?: string; markdown?: string };
        output?: { postId?: string; status?: string };
        approval?: { id: string };
      };
      const toolName = toolPart.type.replace("tool-", "");

      if (isCreateTool(toolPart.type)) {
        const contentType = toolName.replace("create_", "") as ContentType;
        const title = toolPart.input?.title ?? "Untitled";
        const markdown = toolPart.input?.markdown ?? "";

        if (toolPart.state === "approval-requested" && toolPart.approval) {
          const approvalId = toolPart.approval.id;
          return (
            <ContentPreviewCard
              author={contentAuthor}
              contentType={contentType}
              key={toolPart.toolCallId}
              markdown={markdown}
              onApprove={() =>
                addToolApprovalResponse({
                  id: approvalId,
                  approved: true,
                })
              }
              onDeny={() =>
                addToolApprovalResponse({
                  id: approvalId,
                  approved: false,
                })
              }
              organizationSlug={organizationSlug}
              state="pending"
              title={title}
            />
          );
        }

        if (toolPart.state === "output-available" && toolPart.output?.postId) {
          return (
            <ContentPreviewCard
              author={contentAuthor}
              contentType={contentType}
              key={toolPart.toolCallId}
              markdown={markdown}
              organizationSlug={organizationSlug}
              postId={toolPart.output.postId}
              state="saved"
              title={title}
            />
          );
        }

        if (toolPart.state === "output-denied") {
          return (
            <ContentPreviewCard
              author={contentAuthor}
              contentType={contentType}
              key={toolPart.toolCallId}
              markdown={markdown}
              organizationSlug={organizationSlug}
              state="discarded"
              title={title}
            />
          );
        }

        if (
          toolPart.state === "input-streaming" ||
          toolPart.state === "input-available"
        ) {
          return (
            <div
              className="flex items-center gap-2 text-muted-foreground text-xs"
              key={toolPart.toolCallId}
            >
              <div className="flex items-center gap-2">
                <BrailleLoader className="text-sm" variant="shimmer" />
                <span className="animate-pulse text-muted-foreground text-sm">
                  Thinking
                </span>
              </div>
            </div>
          );
        }

        return null;
      }

      if (
        toolPart.state === "input-streaming" ||
        toolPart.state === "input-available"
      ) {
        return (
          <div
            className="flex items-center gap-1.5 text-muted-foreground text-xs"
            key={toolPart.toolCallId}
          >
            <Loader2Icon className="size-3 animate-spin" />
            <span>
              {TOOL_STATUS_LABELS[toolName] ?? `Running ${toolName}...`}
            </span>
          </div>
        );
      }

      if (toolPart.state === "output-available") {
        const output = toolPart.output;
        if (output && typeof output === "object") {
          const label =
            TOOL_STATUS_LABELS[toolName]?.replace("...", "") ?? toolName;
          return (
            <div
              className="text-muted-foreground text-xs"
              key={toolPart.toolCallId}
            >
              {label} completed
            </div>
          );
        }
      }

      return null;
    }

    return null;
  }

  if (isLoadingHistory) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="relative flex min-h-full flex-col">
            <div className="flex flex-1 flex-col px-4 pt-6 pb-28">
              <div className="mx-auto mt-auto flex w-full max-w-2xl flex-col gap-6">
                <div className="flex justify-end">
                  <Skeleton className="h-10 w-48 rounded-2xl" />
                </div>
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
                <div className="flex justify-end">
                  <Skeleton className="h-10 w-64 rounded-2xl" />
                </div>
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-3/6" />
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 z-10 px-4 pt-2 pb-4">
              <div className="pointer-events-none absolute inset-x-0 bottom-full h-8 bg-linear-to-t from-background to-transparent" />
              <div className="mx-auto w-full max-w-2xl">
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasMessages) {
    const now = new Date();
    const greeting = getGreeting(now);
    const userName = session?.user?.name?.split(" ")[0];
    const dateStr = formatLongDate(now);

    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="flex w-full max-w-2xl flex-col items-center gap-4">
          <div className="text-center">
            <p className="text-muted-foreground text-xs">{dateStr}</p>
            <h1 className="font-semibold text-2xl tracking-tight">
              {greeting}
              {userName ? `, ${userName}` : ""}
            </h1>
          </div>
          <div className="w-full">
            <ChatInputAdvanced
              context={context}
              error={chatError}
              isLoading={isLoading}
              isStopping={isStopping}
              model={selectedModel}
              onAddContext={handleAddContext}
              onClearError={handleClearError}
              onModelChange={handleModelChange}
              onRemoveContext={handleRemoveContext}
              onSend={handleSend}
              onStop={handleStop}
              onThinkingLevelChange={handleThinkingLevelChange}
              organizationId={organizationId}
              organizationSlug={organizationSlug}
              thinkingLevel={thinkingLevel}
            />
          </div>
        </div>
      </div>
    );
  }

  const lastMessage = messages.at(-1);
  const showThinkingIndicator =
    isLoading &&
    lastMessage != null &&
    (lastMessage.role === "user" ||
      (lastMessage.role === "assistant" &&
        !lastMessage.parts.some(
          (p) =>
            (p.type === "text" && p.text.trim()) ||
            p.type === "reasoning" ||
            p.type.startsWith("tool-")
        )));

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
        <div className="relative flex min-h-full flex-col">
          <div className="flex flex-1 flex-col px-4 pt-6 pb-28">
            <div className="mx-auto mt-auto flex w-full max-w-2xl flex-col gap-4">
              {messages.map((message) => (
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    {message.parts.map((part, index) =>
                      renderPart(part, message.id, index)
                    )}
                  </MessageContent>
                </Message>
              ))}
              {wasStoppedByUser && !isLoading && (
                <div className="flex w-fit items-center gap-1.5 rounded-md bg-destructive/10 px-2 py-1 text-destructive text-xs">
                  <HugeiconsIcon className="size-3.5" icon={X} />
                  <span>Response stopped by user</span>
                </div>
              )}
              {showThinkingIndicator && (
                <Message from="assistant">
                  <MessageContent>
                    <div className="flex items-center gap-2">
                      <BrailleLoader className="text-sm" variant="shimmer" />
                      <span className="animate-pulse text-muted-foreground text-sm">
                        {isStopping ? "Stopping" : "Thinking"}
                      </span>
                    </div>
                  </MessageContent>
                </Message>
              )}
            </div>
          </div>
          <div className="sticky bottom-0 z-10 bg-background px-4 pb-4">
            <div className="-inset-x-4 pointer-events-none absolute bottom-full h-12 bg-linear-to-t from-background to-transparent" />
            <div className="mx-auto w-full max-w-2xl">
              <ChatInputAdvanced
                context={context}
                error={chatError}
                isLoading={isLoading}
                isStopping={isStopping}
                model={selectedModel}
                onAddContext={handleAddContext}
                onClearError={handleClearError}
                onModelChange={handleModelChange}
                onRemoveContext={handleRemoveContext}
                onSend={handleSend}
                onStop={handleStop}
                onThinkingLevelChange={handleThinkingLevelChange}
                organizationId={organizationId}
                organizationSlug={organizationSlug}
                thinkingLevel={thinkingLevel}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

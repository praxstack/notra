"use client";

import { useChat } from "@ai-sdk/react";
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
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import { useCustomer } from "autumn-js/react";
import { Loader2Icon } from "lucide-react";
import { nanoid } from "nanoid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ContentPreviewCard } from "@/components/ai/content-preview-card";
import { BrailleLoader } from "@/components/braille-loader";
import ChatInput from "@/components/chat-input";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { authClient } from "@/lib/auth/client";
import type { ContextItem } from "@/types/chat";
import { formatLongDate, getGreeting } from "@/utils/dashboard-greeting";

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
  const [pendingMessageId, setPendingMessageId] = useState<string | null>(null);

  const stableChatId = useMemo(
    () => initialChatId || nanoid(16),
    [initialChatId]
  );

  const [context, setContext] = useState<ContextItem[]>([]);
  const [hasCustomizedContext, setHasCustomizedContext] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const contextRef = useRef(context);
  const hasCustomizedContextRef = useRef(hasCustomizedContext);
  contextRef.current = context;
  hasCustomizedContextRef.current = hasCustomizedContext;

  const {
    messages,
    setMessages,
    sendMessage,
    addToolApprovalResponse,
    status,
  } = useChat({
    id: stableChatId,
    resume: Boolean(initialChatId && pendingMessageId),
    experimental_throttle: 50,
    transport: new DefaultChatTransport({
      api: `/api/organizations/${organizationId}/chat`,
      prepareSendMessagesRequest: ({ id, messages }) => ({
        body: {
          chatId: id,
          messages,
          context: hasCustomizedContextRef.current
            ? contextRef.current
            : undefined,
        },
      }),
      prepareReconnectToStreamRequest: ({ id }) => ({
        api: `/api/organizations/${organizationId}/chat/${id}/stream`,
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
          `/api/organizations/${organizationId}/chat/${body.chatId}/stream`,
          {
            method: "GET",
            headers: init?.headers,
            credentials: init?.credentials,
          }
        );
      },
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    onFinish: () => {
      setPendingMessageId(null);
      refetchCustomer();
    },
    onError: (err) => {
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
    },
  });

  useEffect(() => {
    if (!initialChatId || !organizationId) {
      return;
    }
    fetch(
      `/api/organizations/${organizationId}/chat/${encodeURIComponent(initialChatId)}`
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.messages?.length) {
          setMessages(data.messages);
        }
      })
      .catch(() => undefined);
  }, [initialChatId, organizationId, setMessages]);

  const isLoading = status === "streaming" || status === "submitted";
  const hasMessages = messages.length > 0;

  const handleAddContext = useCallback((item: ContextItem) => {
    setHasCustomizedContext(true);
    setContext((prev) => {
      if (
        prev.some(
          (c) =>
            c.type === item.type &&
            c.owner === item.owner &&
            c.repo === item.repo
        )
      ) {
        return prev;
      }
      return [...prev, item];
    });
  }, []);

  const handleRemoveContext = useCallback((item: ContextItem) => {
    setHasCustomizedContext(true);
    setContext((prev) =>
      prev.filter(
        (c) =>
          !(
            c.type === item.type &&
            c.owner === item.owner &&
            c.repo === item.repo
          )
      )
    );
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      if (!initialChatId) {
        window.history.replaceState(
          null,
          "",
          `/${organizationSlug}/chat/${stableChatId}`
        );
      }
      await sendMessage({ text });
    },
    [initialChatId, organizationSlug, sendMessage, stableChatId]
  );

  const messageCount = messages.length;
  const lastMessage = messages.at(-1);
  const lastPartCount = lastMessage?.parts?.length ?? 0;
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages and new parts
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messageCount, lastPartCount]);

  const now = new Date();
  const greeting = getGreeting(now);
  const userName = session?.user?.name?.split(" ")[0];
  const dateStr = formatLongDate(now);

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

  if (!hasMessages) {
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
            <ChatInput
              context={context}
              error={chatError}
              isLoading={isLoading}
              onAddContext={handleAddContext}
              onClearError={() => setChatError(null)}
              onRemoveContext={handleRemoveContext}
              onSend={handleSend}
              organizationId={organizationId}
              organizationSlug={organizationSlug}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div
        className="flex-1 overflow-y-auto px-4 pt-6 pb-4"
        ref={scrollContainerRef}
      >
        <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-end gap-4">
          {messages.map((message) => (
            <Message from={message.role} key={message.id}>
              <MessageContent>
                {message.parts.map((part, index) =>
                  renderPart(part, message.id, index)
                )}
              </MessageContent>
            </Message>
          ))}
          {isLoading &&
            (() => {
              const last = messages.at(-1);
              if (!last) {
                return false;
              }
              if (last.role === "user") {
                return true;
              }
              if (last.role === "assistant") {
                const hasVisibleContent = last.parts.some(
                  (p) =>
                    (p.type === "text" && p.text.trim()) ||
                    p.type === "reasoning" ||
                    p.type.startsWith("tool-")
                );
                return !hasVisibleContent;
              }
              return false;
            })() && (
              <Message from="assistant">
                <MessageContent>
                  <div className="flex items-center gap-2">
                    <BrailleLoader className="text-sm" variant="shimmer" />
                    <span className="animate-pulse text-muted-foreground text-sm">
                      Thinking
                    </span>
                  </div>
                </MessageContent>
              </Message>
            )}
        </div>
      </div>
      <div className="border-border border-t px-4 py-3">
        <div className="mx-auto w-full max-w-2xl">
          <ChatInput
            context={context}
            error={chatError}
            isLoading={false}
            onAddContext={handleAddContext}
            onClearError={() => setChatError(null)}
            onRemoveContext={handleRemoveContext}
            onSend={handleSend}
            organizationId={organizationId}
            organizationSlug={organizationSlug}
          />
        </div>
      </div>
    </div>
  );
}

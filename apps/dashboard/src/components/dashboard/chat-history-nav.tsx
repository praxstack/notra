"use client";

import {
  Add01Icon,
  Delete02Icon,
  PencilEdit02Icon,
  PinIcon,
  PinOffIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
} from "@notra/ui/components/shared/responsive-alert-dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@notra/ui/components/ui/context-menu";
import { Input } from "@notra/ui/components/ui/input";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@notra/ui/components/ui/sidebar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAiChatExperiment } from "@/components/providers/databuddy-flags-provider";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { CHAT_TITLE_MAX_LENGTH } from "@/constants/chat";
import { cn } from "@/lib/utils";
import {
  chatSessionResponseSchema,
  chatSessionsListResponseSchema,
} from "@/schemas/chat";
import type { ChatSessionSummary } from "@/types/chat";
import { normalizeChatTitle, sortChatSessions } from "@/utils/chat";

export function ChatHistoryNav() {
  const { activeOrganization } = useOrganizationsContext();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const aiChatExperiment = useAiChatExperiment();
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [pinningChatId, setPinningChatId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] =
    useState<ChatSessionSummary | null>(null);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement | null>(null);
  const renameInFlightRef = useRef<string | null>(null);
  const pendingNavigationRef = useRef<number | null>(null);

  const slug = activeOrganization?.slug;
  const organizationId = activeOrganization?.id;
  const chatSessionsQueryKey = useMemo(
    () => ["chat-sessions", organizationId] as const,
    [organizationId]
  );

  const { data: sessions = [] } = useQuery({
    queryKey: chatSessionsQueryKey,
    queryFn: async () => {
      const response = await fetch(
        `/api/organizations/${organizationId}/chat/sessions`
      );
      if (!response.ok) {
        return [];
      }
      const parsed = chatSessionsListResponseSchema.safeParse(
        await response.json()
      );
      return parsed.success ? (parsed.data.sessions ?? []) : [];
    },
    enabled: Boolean(organizationId) && aiChatExperiment.on,
    refetchOnWindowFocus: true,
  });

  const currentChatId = pathname.split("/").filter(Boolean)[2];
  const pinnedSessions = sessions.filter((session) =>
    Boolean(session.pinnedAt)
  );
  const recentSessions = sessions.filter((session) => !session.pinnedAt);

  useEffect(() => {
    if (!editingChatId) {
      return;
    }

    editInputRef.current?.focus();
    editInputRef.current?.select();
  }, [editingChatId]);

  useEffect(
    () => () => {
      if (pendingNavigationRef.current !== null) {
        window.clearTimeout(pendingNavigationRef.current);
      }
    },
    []
  );

  function replaceSessionInCache(
    chatId: string,
    updater: (session: ChatSessionSummary) => ChatSessionSummary
  ) {
    queryClient.setQueryData<ChatSessionSummary[]>(
      chatSessionsQueryKey,
      (current = []) =>
        sortChatSessions(
          current.map((item) => (item.chatId === chatId ? updater(item) : item))
        )
    );
  }

  async function submitRename(session: ChatSessionSummary) {
    if (!organizationId) {
      return;
    }

    const nextTitle = normalizeChatTitle(draftTitle);

    if (!nextTitle) {
      toast.error("Title can't be empty");
      setDraftTitle(session.title);
      setEditingChatId(null);
      return;
    }

    if (nextTitle === session.title) {
      setEditingChatId(null);
      return;
    }

    if (renameInFlightRef.current === session.chatId) {
      return;
    }

    renameInFlightRef.current = session.chatId;
    setRenamingChatId(session.chatId);
    const previousSessions =
      queryClient.getQueryData<ChatSessionSummary[]>(chatSessionsQueryKey) ??
      [];

    replaceSessionInCache(session.chatId, (item) => ({
      ...item,
      title: nextTitle,
    }));
    setEditingChatId(null);

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/chat/${session.chatId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: nextTitle }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to rename chat");
      }

      const parsed = chatSessionResponseSchema.safeParse(await response.json());
      if (parsed.success && parsed.data.session) {
        const updated = parsed.data.session;
        replaceSessionInCache(session.chatId, () => updated);
      }
    } catch {
      queryClient.setQueryData(chatSessionsQueryKey, previousSessions);
      setDraftTitle(session.title);
      setEditingChatId(session.chatId);
      toast.error("Failed to rename chat");
    } finally {
      renameInFlightRef.current = null;
      setRenamingChatId(null);
    }
  }

  async function handleDelete() {
    if (!organizationId || !deleteCandidate) {
      return;
    }

    setDeletingChatId(deleteCandidate.chatId);

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/chat/${deleteCandidate.chatId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to delete chat");
      }

      queryClient.setQueryData<ChatSessionSummary[]>(
        chatSessionsQueryKey,
        (current = []) =>
          current.filter((item) => item.chatId !== deleteCandidate.chatId)
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: chatSessionsQueryKey }),
        queryClient.invalidateQueries({
          queryKey: ["chat-history", organizationId, deleteCandidate.chatId],
        }),
      ]);

      if (deleteCandidate.chatId === currentChatId) {
        router.replace(`/${slug}/chat`);
      }

      toast.success("Chat deleted");
      setDeleteCandidate(null);
      setEditingChatId((current) =>
        current === deleteCandidate.chatId ? null : current
      );
    } catch {
      toast.error("Failed to delete chat");
    } finally {
      setDeletingChatId(null);
    }
  }

  function startEditing(session: ChatSessionSummary) {
    if (pendingNavigationRef.current !== null) {
      window.clearTimeout(pendingNavigationRef.current);
      pendingNavigationRef.current = null;
    }
    setDraftTitle(session.title);
    setEditingChatId(session.chatId);
  }

  function handleSessionClick(
    event: MouseEvent<HTMLAnchorElement>,
    session: ChatSessionSummary
  ) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();

    if (event.detail > 1) {
      return;
    }

    if (pendingNavigationRef.current !== null) {
      window.clearTimeout(pendingNavigationRef.current);
    }

    pendingNavigationRef.current = window.setTimeout(() => {
      pendingNavigationRef.current = null;
      router.push(`/${slug}/chat/${session.chatId}`);
    }, 200);
  }

  async function togglePinned(session: ChatSessionSummary) {
    if (!organizationId || pinningChatId === session.chatId) {
      return;
    }

    const nextPinned = !session.pinnedAt;
    setPinningChatId(session.chatId);
    const previousSessions =
      queryClient.getQueryData<ChatSessionSummary[]>(chatSessionsQueryKey) ??
      [];
    const nextPinnedAt = nextPinned ? new Date().toISOString() : null;

    replaceSessionInCache(session.chatId, (item) => ({
      ...item,
      pinnedAt: nextPinnedAt,
    }));

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/chat/${session.chatId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pinned: nextPinned }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update pin state");
      }

      const parsed = chatSessionResponseSchema.safeParse(await response.json());
      if (parsed.success && parsed.data.session) {
        const updated = parsed.data.session;
        replaceSessionInCache(session.chatId, () => updated);
      }
    } catch {
      queryClient.setQueryData(chatSessionsQueryKey, previousSessions);
      toast.error("Failed to update chat pin");
    } finally {
      setPinningChatId(null);
    }
  }

  function renderSessions(label: string, items: ChatSessionSummary[]) {
    if (items.length === 0) {
      return null;
    }

    return (
      <SidebarGroup>
        <SidebarGroupLabel>{label}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((session) => {
              const isEditing = editingChatId === session.chatId;
              const isRenaming = renamingChatId === session.chatId;
              const isPinning = pinningChatId === session.chatId;
              const isBusy = isRenaming || isPinning;

              return (
                <ContextMenu key={session.chatId}>
                  <ContextMenuTrigger
                    render={
                      <SidebarMenuItem className="[&[data-popup-open]_[data-slot=sidebar-menu-action]]:translate-x-0 [&[data-popup-open]_[data-slot=sidebar-menu-action]]:opacity-100" />
                    }
                  >
                    <SidebarMenuButton
                      className={cn(isBusy && "opacity-70")}
                      isActive={session.chatId === currentChatId}
                      render={
                        isEditing ? (
                          <div className="w-full">
                            <Input
                              className="h-7"
                              disabled={isBusy}
                              maxLength={CHAT_TITLE_MAX_LENGTH}
                              onBlur={() => submitRename(session)}
                              onChange={(event) =>
                                setDraftTitle(event.target.value)
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  submitRename(session);
                                  return;
                                }

                                if (event.key === "Escape") {
                                  event.preventDefault();
                                  setDraftTitle(session.title);
                                  setEditingChatId(null);
                                }
                              }}
                              ref={editInputRef}
                              value={draftTitle}
                            />
                          </div>
                        ) : (
                          <Link
                            href={`/${slug}/chat/${session.chatId}`}
                            onClick={(event) =>
                              handleSessionClick(event, session)
                            }
                            onDoubleClick={(event) => {
                              event.preventDefault();
                              startEditing(session);
                            }}
                          >
                            <span className="truncate">{session.title}</span>
                          </Link>
                        )
                      }
                      tooltip={session.title}
                    />

                    {!isEditing && (
                      <SidebarMenuAction
                        aria-label={
                          session.pinnedAt ? "Unpin chat" : "Pin chat"
                        }
                        className="translate-x-1 opacity-0 transition-[opacity,transform] duration-150 ease-out"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          togglePinned(session);
                        }}
                        showOnHover
                      >
                        <HugeiconsIcon
                          icon={session.pinnedAt ? PinOffIcon : PinIcon}
                        />
                      </SidebarMenuAction>
                    )}
                  </ContextMenuTrigger>

                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => togglePinned(session)}>
                      <HugeiconsIcon
                        icon={session.pinnedAt ? PinOffIcon : PinIcon}
                      />
                      {session.pinnedAt ? "Unpin" : "Pin"}
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => startEditing(session)}>
                      <HugeiconsIcon icon={PencilEdit02Icon} />
                      Rename
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() => setDeleteCandidate(session)}
                      variant="destructive"
                    >
                      <HugeiconsIcon icon={Delete02Icon} />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (!slug || !aiChatExperiment.on) {
    return null;
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={
                  <Link href={`/${slug}/chat`}>
                    <HugeiconsIcon icon={Add01Icon} />
                    <span>New chat</span>
                  </Link>
                }
                tooltip="New chat"
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <div className="flex-1 overflow-y-auto">
        {renderSessions("Pinned", pinnedSessions)}
        {renderSessions("Recents", recentSessions)}
      </div>

      <ResponsiveAlertDialog
        onOpenChange={(open) => {
          if (!open && !deletingChatId) {
            setDeleteCandidate(null);
          }
        }}
        open={Boolean(deleteCandidate)}
      >
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>
              Delete chat?
            </ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              This will permanently delete &quot;{deleteCandidate?.title}&quot;.
              This action cannot be undone.
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel disabled={Boolean(deletingChatId)}>
              Cancel
            </ResponsiveAlertDialogCancel>
            <ResponsiveAlertDialogAction
              disabled={Boolean(deletingChatId)}
              onClick={(event) => {
                event.preventDefault();
                handleDelete();
              }}
              variant="destructive"
            >
              {deletingChatId ? "Deleting..." : "Delete"}
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>
    </>
  );
}

"use client";

import {
  Add01Icon,
  Delete02Icon,
  MoreHorizontalIcon,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { Input } from "@notra/ui/components/ui/input";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@notra/ui/components/ui/sidebar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAiChatExperiment } from "@/components/providers/databuddy-flags-provider";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { CHAT_TITLE_MAX_LENGTH } from "@/constants/chat";
import {
  useChatSessionMutations,
  useChatSessions,
} from "@/lib/hooks/use-chat-sessions";
import { cn } from "@/lib/utils";
import type { ChatSessionSummary } from "@/types/chat";
import { normalizeChatTitle } from "@/utils/chat";

export function ChatHistoryNav() {
  const { activeOrganization } = useOrganizationsContext();
  const pathname = usePathname();
  const router = useRouter();
  const aiChatExperiment = useAiChatExperiment();
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [pinningChatId, setPinningChatId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] =
    useState<ChatSessionSummary | null>(null);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement | null>(null);
  const pendingNavigationRef = useRef<number | null>(null);

  const slug = activeOrganization?.slug;

  const { sessions } = useChatSessions({ enabled: aiChatExperiment.on });
  const { renameChat, togglePinned, deleteChat } = useChatSessionMutations();

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

  async function submitRename(session: ChatSessionSummary) {
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

    setRenamingChatId(session.chatId);
    setEditingChatId(null);
    const ok = await renameChat(session.chatId, nextTitle);
    if (!ok) {
      setDraftTitle(session.title);
      setEditingChatId(session.chatId);
    }
    setRenamingChatId(null);
  }

  async function handleDelete() {
    if (!deleteCandidate) {
      return;
    }

    const candidate = deleteCandidate;
    setDeletingChatId(candidate.chatId);
    const ok = await deleteChat(candidate.chatId);
    setDeletingChatId(null);

    if (!ok) {
      return;
    }

    if (candidate.chatId === currentChatId) {
      router.replace(`/${slug}/chat`);
    }
    setDeleteCandidate(null);
    setEditingChatId((current) =>
      current === candidate.chatId ? null : current
    );
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

  async function handleTogglePinned(session: ChatSessionSummary) {
    if (pinningChatId === session.chatId) {
      return;
    }
    setPinningChatId(session.chatId);
    await togglePinned(session);
    setPinningChatId(null);
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
                  <ContextMenuTrigger render={<SidebarMenuItem />}>
                    <SidebarMenuButton
                      className={cn(
                        "cursor-pointer pr-8",
                        isBusy && "opacity-70"
                      )}
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
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label="Chat options"
                          className="-translate-y-1/2 absolute top-1/2 right-1.5 flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground opacity-0 outline-hidden ring-sidebar-ring transition-opacity duration-150 ease-out hover:bg-sidebar-accent hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[popup-open]:bg-sidebar-accent data-[popup-open]:text-foreground data-[popup-open]:opacity-100 [&>svg]:size-4 [&>svg]:shrink-0"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                          }}
                        >
                          <HugeiconsIcon icon={MoreHorizontalIcon} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          className="w-44"
                          showBackdrop={false}
                          side="right"
                          sideOffset={6}
                        >
                          <DropdownMenuItem
                            onClick={() => handleTogglePinned(session)}
                          >
                            <HugeiconsIcon
                              icon={session.pinnedAt ? PinOffIcon : PinIcon}
                            />
                            {session.pinnedAt ? "Unpin" : "Pin"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => startEditing(session)}
                          >
                            <HugeiconsIcon icon={PencilEdit02Icon} />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteCandidate(session)}
                            variant="destructive"
                          >
                            <HugeiconsIcon icon={Delete02Icon} />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </ContextMenuTrigger>

                  <ContextMenuContent>
                    <ContextMenuItem
                      onClick={() => handleTogglePinned(session)}
                    >
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
                className="cursor-pointer"
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

"use client";

import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@notra/ui/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOrganizationsContext } from "@/components/providers/organization-provider";

interface ChatSessionSummary {
  chatId: string;
  title: string;
  updatedAt: string;
  createdAt: string;
}

export function ChatHistoryNav() {
  const { activeOrganization } = useOrganizationsContext();
  const pathname = usePathname();

  const slug = activeOrganization?.slug;
  const organizationId = activeOrganization?.id;

  const { data: sessions = [] } = useQuery({
    queryKey: ["chat-sessions", organizationId],
    queryFn: async () => {
      const response = await fetch(
        `/api/organizations/${organizationId}/chat/sessions`
      );
      if (!response.ok) {
        return [];
      }
      const data = (await response.json()) as {
        sessions?: ChatSessionSummary[];
      };
      return data.sessions ?? [];
    },
    enabled: Boolean(organizationId),
    refetchOnWindowFocus: true,
  });

  if (!slug) {
    return null;
  }

  const currentChatId = pathname.split("/").filter(Boolean)[2];

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

      {sessions.length > 0 && (
        <SidebarGroup className="flex-1 overflow-y-auto">
          <SidebarGroupLabel>Recents</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sessions.map((session) => (
                <SidebarMenuItem key={session.chatId}>
                  <SidebarMenuButton
                    isActive={session.chatId === currentChatId}
                    render={
                      <Link href={`/${slug}/chat/${session.chatId}`}>
                        <span className="truncate">{session.title}</span>
                      </Link>
                    }
                    tooltip={session.title}
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </>
  );
}

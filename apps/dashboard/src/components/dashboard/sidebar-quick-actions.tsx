"use client";

import { SearchIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { Kbd, KbdGroup } from "@notra/ui/components/ui/kbd";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@notra/ui/components/ui/sidebar";
import { useIsApplePlatform } from "@notra/ui/hooks/use-is-apple-platform";
import { useTranslations } from "use-intl";

import { useCommandPalette } from "@/components/command-palette/command-palette-context";
import { useRightPanel } from "@/components/dashboard/right-panel-context";
import { AgentIcon } from "@/components/icons/agent-icon";
import {
  SIDEBAR_SEARCH_PLACEMENTS,
  SIDEBAR_SEARCH_PLACEMENT_DEFAULT,
} from "@/constants/nav";
import { useDevVariant } from "@/lib/hooks/use-dev-variant";

import { SidebarLabel } from "./sidebar-label";

export function useSidebarSearchPlacement() {
  return useDevVariant(
    "sidebar-search",
    SIDEBAR_SEARCH_PLACEMENTS,
    SIDEBAR_SEARCH_PLACEMENT_DEFAULT
  );
}

function SearchShortcut() {
  const isApplePlatform = useIsApplePlatform();
  return (
    <KbdGroup className="ml-auto group-data-[collapsible=icon]:hidden">
      <Kbd>{isApplePlatform ? "⌘" : "Ctrl"}</Kbd>
      <Kbd>K</Kbd>
    </KbdGroup>
  );
}

export function SidebarSearchItem({ field = false }: { field?: boolean }) {
  const t = useTranslations("common.actions");
  const { setOpen } = useCommandPalette();
  const label = t("search");

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className={
          field
            ? "text-muted-foreground cursor-pointer group-data-[collapsible=icon]:shadow-none"
            : "cursor-pointer"
        }
        onClick={() => setOpen(true)}
        tooltip={label}
        variant={field ? "outline" : "default"}
      >
        <HugeiconsIcon icon={SearchIcon} />
        <SidebarLabel>{field ? `${label}…` : label}</SidebarLabel>
        <SearchShortcut />
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function SidebarAskAgentButton() {
  const t = useTranslations("common.labels");
  const { active, togglePanel } = useRightPanel();
  const buttonVariant = useDevVariant(
    "ask-agent-style",
    ["secondary", "outline"] as const,
    "secondary"
  );
  const label = t("askAgent");

  return (
    <Button
      aria-label={label}
      aria-pressed={active === "agent"}
      className="w-full group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:px-0"
      onClick={() => togglePanel("agent")}
      title={label}
      variant={buttonVariant}
    >
      <AgentIcon />
      <span className="group-data-[collapsible=icon]:hidden">{label}</span>
    </Button>
  );
}

/** Search above the navigation, for the top placement. */
export function SidebarTopQuickActions() {
  const placement = useSidebarSearchPlacement();
  if (placement === "bottom") {
    return null;
  }

  return (
    <SidebarMenu className="px-2 pt-1.5 pb-1">
      <SidebarSearchItem field />
    </SidebarMenu>
  );
}

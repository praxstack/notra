"use client";

import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  useSidebar,
} from "@notra/ui/components/ui/sidebar";
import { cn } from "@notra/ui/lib/utils";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "use-intl";

import { useJobsSidebar } from "@/components/providers/jobs-sidebar-provider";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { useNavVisibility } from "@/lib/hooks/use-nav-visibility";
import { usePathname, useRouter, useSearchParams } from "@/lib/navigation";
import type { DashboardSidebarProps } from "@/types/components/sidebar-resize-handle";
import dynamic from "@/utils/lazy-component";
import { isNavigation } from "@/utils/sidebar-navigation";

import { ChatHistoryNavLoading } from "./chat-history-nav-loading";
import { DeferredSidebarStatus } from "./deferred-sidebar-status";
import { NavFooter } from "./nav-footer";
import { NavJobs } from "./nav-jobs";
import { NavMain } from "./nav-main";
import { NavSite } from "./nav-site";
import { NavUtility } from "./nav-utility";
import { OrgSelector } from "./org-selector";
import { SidebarLabel } from "./sidebar-label";
import { SidebarProjectSwitcher } from "./sidebar-project-switcher";
import { SidebarTopQuickActions } from "./sidebar-quick-actions";
import { SidebarResizeHandle } from "./sidebar-resize-handle";
import { SidebarSwap } from "./sidebar-swap";
import { SidebarToggle } from "./sidebar-toggle";

const ChatHistoryNav = dynamic(
  () => import("./chat-history-nav").then((module) => module.ChatHistoryNav),
  {
    loading: () => <ChatHistoryNavLoading />,
  }
);

function SidebarBackButton({ onBack }: { onBack: () => void }) {
  const t = useTranslations("common.actions");
  return (
    <div className="bg-sidebar sticky top-0 z-10 p-2">
      <SidebarMenu>
        <SidebarMenuButton
          className="hover:bg-sidebar-accent duration-normal cursor-pointer transition-colors [&>*]:group-data-[collapsible=icon]:-translate-x-px"
          onClick={onBack}
          tooltip={t("back")}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} />
          <SidebarLabel>{t("back")}</SidebarLabel>
        </SidebarMenuButton>
      </SidebarMenu>
    </div>
  );
}

function SidebarHeaderActions() {
  const { isMobile } = useSidebar();
  // The mobile sheet closes through the topbar toggle instead.
  return isMobile ? null : <SidebarToggle className="shrink-0" />;
}

export function DashboardSidebar({
  className,
  onWidthChange,
  onWidthChangeEnd,
  onWidthChangeStart,
  resizing,
  width,
  ...props
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobile, setOpenMobile } = useSidebar();
  const { activeOrganization } = useOrganizationsContext();
  const visibility = useNavVisibility();
  const jobsSidebar = useJobsSidebar();
  const navigationKey = `${pathname}?${searchParams.toString()}`;
  const pathnameSegments = pathname.split("/").filter(Boolean);
  const slug = pathnameSegments[0] ?? activeOrganization?.slug ?? "";

  const section = pathnameSegments[1];
  const siteSegment = section === "sites" ? pathnameSegments[2] : undefined;
  const isSitePage =
    visibility.sites && Boolean(siteSegment) && siteSegment !== "new";
  let panelId = section === "chat" ? section : "main";
  if (isSitePage) {
    panelId = "site";
  }
  const isSubpage = panelId !== "main";

  const [hasMoreNavigation, setHasMoreNavigation] = useState(false);
  const scrollEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = scrollEndRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setHasMoreNavigation(!entry.isIntersecting);
        }
      },
      { root: node.parentElement }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const hasVisitedMainRef = useRef(false);
  const previousNavigationKeyRef = useRef(navigationKey);
  useEffect(() => {
    if (!isSubpage) {
      hasVisitedMainRef.current = true;
    }
  }, [isSubpage]);

  useEffect(() => {
    if (
      isMobile &&
      isNavigation(previousNavigationKeyRef.current, navigationKey)
    ) {
      setOpenMobile(false);
    }
    previousNavigationKeyRef.current = navigationKey;
  }, [isMobile, navigationKey, setOpenMobile]);

  function handleBack() {
    if (isSitePage) {
      router.push(`/${slug}`);
      return;
    }
    if (hasVisitedMainRef.current) {
      router.back();
      return;
    }
    router.push(`/${slug}`);
  }

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className={cn(
        "overscroll-none border-none",
        resizing && "transition-none!",
        className
      )}
    >
      <SidebarHeader className="pt-px pb-0.5">
        {jobsSidebar ? (
          <div className="flex items-center gap-1 group-data-[collapsible=icon]:flex-col">
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:flex-none">
              <SidebarProjectSwitcher />
            </div>
            <SidebarHeaderActions />
          </div>
        ) : (
          <SidebarProjectSwitcher />
        )}
      </SidebarHeader>
      {jobsSidebar ? <SidebarTopQuickActions /> : null}
      <SidebarContent>
        <SidebarSwap
          activeId={panelId}
          className="overflow-x-clip"
          items={[
            {
              id: "main",
              side: "left",
              children: jobsSidebar ? <NavJobs /> : <NavMain />,
            },
            {
              id: "chat",
              side: "right",
              children: (
                <>
                  <SidebarBackButton onBack={handleBack} />
                  <ChatHistoryNav />
                </>
              ),
            },
            {
              id: "site",
              side: "right",
              children: (
                <>
                  <SidebarBackButton onBack={handleBack} />
                  {visibility.sites ? <NavSite slug={slug} /> : null}
                </>
              ),
            },
          ]}
        />
        <div className="mt-auto">
          {jobsSidebar ? <NavFooter slug={slug} /> : <NavUtility slug={slug} />}
          <DeferredSidebarStatus />
        </div>
        <div aria-hidden className="h-px shrink-0" ref={scrollEndRef} />
      </SidebarContent>
      <div className="relative shrink-0">
        {hasMoreNavigation && (
          <div
            aria-hidden
            className="from-sidebar pointer-events-none absolute inset-x-0 bottom-full z-10 h-8 bg-linear-to-t to-transparent group-data-[collapsible=icon]:hidden"
            data-sidebar="scroll-fade"
          />
        )}
      </div>
      <SidebarFooter>
        <OrgSelector />
      </SidebarFooter>
      <SidebarResizeHandle
        onWidthChange={onWidthChange}
        onWidthChangeEnd={onWidthChangeEnd}
        onWidthChangeStart={onWidthChangeStart}
        width={width}
      />
    </Sidebar>
  );
}

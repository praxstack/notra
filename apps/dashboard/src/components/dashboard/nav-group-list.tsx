"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@notra/ui/components/ui/sidebar";
import { useTranslations } from "use-intl";

import { HOME_NAV_LINK } from "@/constants/nav";
import { useHasGeoFeature } from "@/lib/hooks/use-plan";
import { pickSidebarMode } from "@/lib/hooks/use-sidebar-mode";
import { usePathname } from "@/lib/navigation";
import type {
  NavGroup,
  NavMainItem,
  NavVisibility,
} from "@/types/components/nav";
import { geoNavHref, isGeoDashboardPath } from "@/utils/geo-paths";
import {
  resolveNavGroupRow,
  resolveNavItems,
  sidebarRouteFromPathname,
} from "@/utils/nav";

import { NavLockHint } from "./nav-lock-hint";
import { SidebarLabel } from "./sidebar-label";
import { SidebarNavLink } from "./sidebar-nav-link";

interface NavGroupListProps {
  groups: readonly NavGroup[];
  slug: string;
  activeLink: string | null;
  projectId?: string;
  visibility: NavVisibility;
}

function NavBadge({ item }: { item: NavMainItem }) {
  const t = useTranslations("nav");
  if (!item.badge) {
    return null;
  }
  return (
    <Badge
      className="text-muted-foreground ml-auto h-[1.125rem] px-[0.375rem] text-[0.625rem] group-data-[collapsible=icon]:hidden"
      variant="secondary"
    >
      {t(`badges.${item.badge}`)}
    </Badge>
  );
}

/**
 * Studio home is the org root, which restores a stored GEO mode by redirecting
 * to the GEO overview. Picking Studio before the click navigates keeps Home
 * reachable, and prefetching stays off so the redirect is never cached.
 */
function useHomeLinkProps() {
  const pathname = usePathname();
  return (link: string) =>
    link === HOME_NAV_LINK
      ? {
          disablePrefetch: true,
          onClick: () =>
            pickSidebarMode("studio", sidebarRouteFromPathname(pathname)),
        }
      : {};
}

function NavGroupRow({
  group,
  slug,
  activeLink,
  projectId,
  visibility,
}: Omit<NavGroupListProps, "groups"> & { group: NavGroup }) {
  const t = useTranslations("nav");
  const tLabels = useTranslations("common.labels");
  const { isLocked: geoLocked } = useHasGeoFeature();
  const { state, isMobile } = useSidebar();
  const homeLinkProps = useHomeLinkProps();
  const [first, ...rest] = resolveNavItems(group.links, visibility);
  if (!first) {
    return null;
  }

  const label = tLabels(group.labelKey);
  const { subRows, groupActive, ownPageActive, showSubRows, showOwnBadge } =
    resolveNavGroupRow(group, first, rest, activeLink);

  if (state === "collapsed" && !isMobile && rest.length > 0) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton aria-label={label} isActive={groupActive}>
                <HugeiconsIcon icon={group.icon} />
                <SidebarLabel>{label}</SidebarLabel>
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent
            align="start"
            aria-label={label}
            className="min-w-48"
            side="right"
          >
            {[first, ...rest].map((item) => (
              <DropdownMenuItem
                key={item.link}
                nativeButton={false}
                render={
                  <SidebarNavLink
                    aria-current={item.link === activeLink ? "page" : undefined}
                    href={geoNavHref(slug, item.link, projectId)}
                    {...homeLinkProps(item.link)}
                  />
                }
              >
                <HugeiconsIcon icon={item.icon} />
                <span>{tLabels(item.labelKey)}</span>
                <NavBadge item={item} />
                {geoLocked && isGeoDashboardPath(item.link) ? (
                  <NavLockHint message={t("geoUpgradeTooltip")} />
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className={
          groupActive && !ownPageActive ? "text-foreground font-medium" : ""
        }
        isActive={ownPageActive}
        render={
          <SidebarNavLink
            href={geoNavHref(slug, first.link, projectId)}
            {...homeLinkProps(first.link)}
          >
            <HugeiconsIcon icon={group.icon} />
            <SidebarLabel>{label}</SidebarLabel>
            {showOwnBadge ? <NavBadge item={first} /> : null}
            {geoLocked && isGeoDashboardPath(first.link) ? (
              <NavLockHint message={t("geoUpgradeTooltip")} />
            ) : null}
          </SidebarNavLink>
        }
        tooltip={label}
      />
      {subRows.length > 0 ? (
        <div
          className="duration-normal grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] ease-(--sidebar-ease) group-data-[collapsible=icon]:hidden data-[open=true]:grid-rows-[1fr] data-[open=true]:opacity-100 motion-reduce:transition-none"
          data-open={showSubRows}
          inert={!showSubRows}
        >
          <div className="min-h-0 overflow-hidden">
            <SidebarMenuSub>
              {subRows.map((item) => (
                <SidebarMenuSubItem key={item.link}>
                  <SidebarMenuSubButton
                    isActive={item.link === activeLink}
                    render={
                      <SidebarNavLink
                        aria-current={
                          item.link === activeLink ? "page" : undefined
                        }
                        href={geoNavHref(slug, item.link, projectId)}
                        {...homeLinkProps(item.link)}
                      >
                        <span>{tLabels(item.labelKey)}</span>
                        <NavBadge item={item} />
                      </SidebarNavLink>
                    }
                  />
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </div>
        </div>
      ) : null}
    </SidebarMenuItem>
  );
}

export function NavGroupList({
  groups,
  slug,
  activeLink,
  projectId,
  visibility,
}: NavGroupListProps) {
  return (
    <SidebarMenu>
      {groups.map((group) => (
        <NavGroupRow
          activeLink={activeLink}
          group={group}
          key={group.id}
          projectId={projectId}
          slug={slug}
          visibility={visibility}
        />
      ))}
    </SidebarMenu>
  );
}

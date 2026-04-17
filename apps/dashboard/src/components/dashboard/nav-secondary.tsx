"use client";

import { Settings01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@notra/ui/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentPropsWithoutRef } from "react";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import type { NavItem } from "@/types/components/nav";

const items: readonly NavItem[] = [
  {
    label: "Settings",
    link: "/settings/account",
    icon: Settings01Icon,
  },
];

export function NavSecondary({
  ...props
}: ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const { activeOrganization } = useOrganizationsContext();
  const pathname = usePathname();

  if (!activeOrganization?.slug) {
    return null;
  }

  const slug = activeOrganization.slug;

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const href = `/${slug}${item.link}`;
            const isActive = pathname.startsWith(href);
            return (
              <SidebarMenuItem key={item.link}>
                <SidebarMenuButton
                  isActive={isActive}
                  render={
                    <Link href={href}>
                      <HugeiconsIcon icon={item.icon} />
                      <span>{item.label}</span>
                    </Link>
                  }
                  tooltip={item.label}
                />
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

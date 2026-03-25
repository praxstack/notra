"use client";

import { SidebarInset, SidebarProvider } from "@notra/ui/components/ui/sidebar";
import { SubscriptionGate } from "@/components/billing/subscription-gate";
import { DashboardSidebar } from "@/components/dashboard/app-sidebar";
import { SiteHeader } from "@/components/dashboard/header";
import { OrganizationsProvider } from "@/components/providers/organization-provider";

interface DashboardClientWrapperProps {
  children: React.ReactNode;
}

export function DashboardClientWrapper({
  children,
}: DashboardClientWrapperProps) {
  return (
    <OrganizationsProvider>
      <SidebarProvider>
        <DashboardSidebar variant="inset" />
        <SidebarInset className="min-w-0 overflow-x-hidden">
          <SiteHeader />
          <div className="@container/main flex min-w-0 flex-1 flex-col gap-2">
            <SubscriptionGate>{children}</SubscriptionGate>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </OrganizationsProvider>
  );
}

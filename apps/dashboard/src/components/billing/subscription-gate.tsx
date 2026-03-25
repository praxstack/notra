"use client";

import { Button } from "@notra/ui/components/ui/button";
import { useCustomer } from "autumn-js/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOrganizationsContext } from "@/components/providers/organization-provider";

const ALLOWED_PATH_SEGMENTS = [
  "/billing",
  "/settings/account",
  "/settings/general",
];

function isAllowedPath(pathname: string, slug: string): boolean {
  const orgPrefix = `/${slug}`;
  const relativePath = pathname.startsWith(orgPrefix)
    ? pathname.slice(orgPrefix.length)
    : pathname;

  return ALLOWED_PATH_SEGMENTS.some(
    (segment) =>
      relativePath === segment || relativePath.startsWith(`${segment}/`)
  );
}

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { activeOrganization } = useOrganizationsContext();
  const { data: customer, isLoading } = useCustomer({
    expand: ["subscriptions.plan"],
  });

  if (isLoading || !customer) {
    return <>{children}</>;
  }

  const slug = activeOrganization?.slug ?? "";

  const hasActiveSubscription = customer.subscriptions.some(
    (subscription) => !subscription.addOn && subscription.status === "active"
  );

  if (hasActiveSubscription || isAllowedPath(pathname, slug)) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="max-w-md space-y-3 text-center">
        <h1 className="font-bold text-2xl tracking-tight">
          Your trial has ended
        </h1>
        <p className="text-muted-foreground">
          Subscribe to a plan to continue using Notra. Your workspace data is
          safe and will be available once you subscribe.
        </p>
      </div>
      <div className="flex gap-3">
        <Button
          nativeButton={false}
          render={<Link href={`/${slug}/settings/account`} />}
          variant="outline"
        >
          Account Settings
        </Button>
        <Button
          nativeButton={false}
          render={<Link href={`/${slug}/billing`} />}
        >
          Choose a Plan
        </Button>
      </div>
    </div>
  );
}

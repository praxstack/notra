"use client";

import { Button } from "@notra/ui/components/ui/button";
import { useCustomer } from "autumn-js/react";
import Link from "next/link";
import { useOrganizationsContext } from "@/components/providers/organization-provider";

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
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

  if (hasActiveSubscription) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="mx-4 mt-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950">
        <p className="text-amber-800 text-sm dark:text-amber-200">
          Your trial has ended. Subscribe to a plan to unlock full access.
          You&apos;re currently in read-only mode.
        </p>
        <Button
          nativeButton={false}
          render={<Link href={`/${slug}/billing`} />}
          size="sm"
        >
          Choose a Plan
        </Button>
      </div>
      {children}
    </>
  );
}

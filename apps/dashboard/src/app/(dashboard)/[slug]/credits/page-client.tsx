"use client";

import { Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Confetti } from "@neoconfetti/react";
import { Button } from "@notra/ui/components/ui/button";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { CreditTopupContent } from "@/components/billing/credit-topup-content";
import { PageContainer } from "@/components/layout/container";

export default function CreditsPageClient() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";

  if (success) {
    return (
      <PageContainer className="flex flex-1 flex-col items-center justify-center">
        <div className="-translate-x-1/2 pointer-events-none absolute top-0 left-1/2">
          <Confetti
            colors={[
              "var(--primary)",
              "#FFC700",
              "#FF6B6B",
              "#41BBC7",
              "#A78BFA",
              "#34D399",
            ]}
            duration={3000}
            force={0.5}
            particleCount={120}
            particleShape="mix"
            particleSize={8}
            stageHeight={600}
            stageWidth={800}
          />
        </div>
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <HugeiconsIcon
            className="size-12 text-emerald-500"
            icon={Tick02Icon}
          />
          <div className="space-y-1">
            <h2 className="font-bold text-2xl">Credits Added!</h2>
            <p className="text-muted-foreground">
              Your AI credits have been topped up and are ready to use.
            </p>
          </div>
          <Button nativeButton={false} render={<Link href={`/${slug}`} />}>
            Go to dashboard
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="space-y-1">
          <h1 className="font-bold text-3xl tracking-tight">Credits</h1>
          <p className="text-muted-foreground">
            View your balance and purchase additional AI credits
          </p>
        </div>
        <TitleCard className="max-w-md" heading="Top Up Credits">
          <CreditTopupContent />
        </TitleCard>
      </div>
    </PageContainer>
  );
}

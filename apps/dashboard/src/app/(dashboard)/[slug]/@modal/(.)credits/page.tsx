"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CreditTopupModal } from "@/components/billing/credit-topup-modal";

export default function CreditsInterceptedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";

  return (
    <CreditTopupModal
      onOpenChange={(open) => {
        if (!open) {
          router.back();
        }
      }}
      open
      success={success}
    />
  );
}

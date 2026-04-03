"use client";

import { Button } from "@notra/ui/components/ui/button";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useCustomer } from "autumn-js/react";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import {
  ADDONS,
  calculateTopupFee,
  calculateTopupTotal,
  FEATURES,
  TOPUP_MAX_DOLLARS,
  TOPUP_MIN_DOLLARS,
  TOPUP_OPTIONS,
} from "@/constants/features";

function formatDollars(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

interface CreditTopupContentProps {
  onSuccess?: () => void;
}

export function CreditTopupContent({ onSuccess }: CreditTopupContentProps) {
  const { activeOrganization } = useOrganizationsContext();
  const {
    attach,
    data: customer,
    isLoading,
    refetch,
  } = useCustomer({
    expand: ["balances.feature"],
  });
  const [loading, setLoading] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");

  const aiCredits = customer?.balances?.[FEATURES.AI_CREDITS];
  const aiCreditsBalance =
    typeof aiCredits?.remaining === "number" ? aiCredits.remaining : null;
  const aiCreditsIncluded =
    typeof aiCredits?.granted === "number" ? aiCredits.granted : null;

  async function handleTopup(dollars: number) {
    setLoading(dollars);
    try {
      const successUrl = activeOrganization?.slug
        ? `${window.location.origin}/${activeOrganization.slug}/credits?success=true`
        : undefined;

      const credits = dollars * 100;

      const result = await attach({
        planId: ADDONS.AI_CREDITS_TOPUP,
        featureQuantities: [
          { featureId: FEATURES.AI_CREDITS, quantity: credits },
        ],
        redirectMode: "if_required",
        successUrl,
      });

      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        await refetch();
        toast.success("Credits added successfully");
        onSuccess?.();
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not process top-up. Please try again."
      );
    } finally {
      setLoading(null);
    }
  }

  const parsedCustomAmount = Number.parseInt(customAmount, 10);
  const isCustomValid =
    !Number.isNaN(parsedCustomAmount) &&
    Number.isInteger(parsedCustomAmount) &&
    parsedCustomAmount >= TOPUP_MIN_DOLLARS &&
    parsedCustomAmount <= TOPUP_MAX_DOLLARS;
  const customFee = isCustomValid ? calculateTopupFee(parsedCustomAmount) : 0;
  const customTotal = isCustomValid
    ? calculateTopupTotal(parsedCustomAmount)
    : 0;

  return (
    <div className="space-y-6">
      {isLoading ? (
        <Skeleton className="h-16 rounded-lg" />
      ) : (
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-muted-foreground text-sm">Current Balance</p>
          <p className="font-bold text-2xl tabular-nums">
            {aiCreditsBalance !== null ? formatDollars(aiCreditsBalance) : "-"}
          </p>
          {aiCreditsIncluded !== null && (
            <p className="text-muted-foreground text-xs">
              of {formatDollars(aiCreditsIncluded)} included in plan
            </p>
          )}
        </div>
      )}

      <div className="space-y-3">
        <Label className="font-medium text-sm">Quick Top-Up</Label>
        <div className="grid grid-cols-2 gap-3">
          {TOPUP_OPTIONS.map((option) => (
            <button
              className="flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading !== null}
              key={option.creditValue}
              onClick={() => handleTopup(option.creditValue)}
              type="button"
            >
              <span className="font-semibold text-base">{option.label}</span>
              <span className="text-muted-foreground text-xs">
                {option.credits.toLocaleString()} credits
              </span>
              <span className="text-muted-foreground text-xs">
                ${option.creditValue.toFixed(2)} + $
                {(option.price - option.creditValue).toFixed(2)} fee
              </span>
              {loading === option.creditValue && (
                <Loader2Icon className="mt-1 size-4 animate-spin" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="font-medium text-sm" htmlFor="custom-amount">
          Custom Amount
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 text-muted-foreground text-sm">
              $
            </span>
            <Input
              className="pl-7"
              id="custom-amount"
              max={TOPUP_MAX_DOLLARS}
              min={TOPUP_MIN_DOLLARS}
              onChange={(e) =>
                setCustomAmount(e.target.value.replace(/\./g, ""))
              }
              placeholder={`${TOPUP_MIN_DOLLARS}–${TOPUP_MAX_DOLLARS}`}
              step={1}
              type="number"
              value={customAmount}
            />
          </div>
          <Button
            disabled={!isCustomValid || loading !== null}
            onClick={() => {
              if (isCustomValid) {
                handleTopup(parsedCustomAmount);
              }
            }}
          >
            {loading !== null &&
            !TOPUP_OPTIONS.some((o) => o.creditValue === loading) ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              "Buy"
            )}
          </Button>
        </div>
        {customAmount && !isCustomValid && (
          <p className="text-destructive text-xs">
            Amount must be between ${TOPUP_MIN_DOLLARS} and ${TOPUP_MAX_DOLLARS}
          </p>
        )}
        {isCustomValid && (
          <p className="text-muted-foreground text-xs">
            Total: ${customTotal.toFixed(2)} (${parsedCustomAmount.toFixed(2)} +
            ${customFee.toFixed(2)} processing fee)
          </p>
        )}
      </div>
    </div>
  );
}

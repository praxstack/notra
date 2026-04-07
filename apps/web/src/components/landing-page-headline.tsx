"use client";

import { useFlag } from "@databuddy/sdk/react";
import {
  getLandingPageH1Copy,
  LANDING_PAGE_H1_EXPERIMENT_KEY,
} from "@/utils/databuddy";

export function LandingPageHeadline({ className }: { className?: string }) {
  const { variant } = useFlag(LANDING_PAGE_H1_EXPERIMENT_KEY);

  return <h1 className={className}>{getLandingPageH1Copy(variant)}</h1>;
}

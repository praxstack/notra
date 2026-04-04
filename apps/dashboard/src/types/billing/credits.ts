export const CREDIT_RANGES = ["7d", "30d", "90d"] as const;
export type CreditRangeOption = (typeof CREDIT_RANGES)[number];

export const CREDIT_RANGE_LABELS: Record<CreditRangeOption, string> = {
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
};

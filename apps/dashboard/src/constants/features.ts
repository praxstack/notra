export const FEATURES = {
  TEAM_MEMBERS: "team_members",
  AI_CREDITS: "ai_credits",
  WORKFLOWS: "workflows",
  INTEGRATIONS: "integrations",
  REFERENCES: "references",
  LOG_RETENTION_7_DAYS: "log_retention_7_days",
  LOG_RETENTION_14_DAYS: "log_retention_14_days",
  LOG_RETENTION_30_DAYS: "log_retention_30_days",
} as const;

export const PLANS = {
  BASIC: "basic",
  BASIC_YEARLY: "basic_yearly",
  PRO: "pro",
  PRO_YEARLY: "pro_yearly",
} as const;

export const ADDONS = {
  AI_CREDITS_TOPUP: "ai_credits_top_up",
} as const;

export const TOPUP_MIN_DOLLARS = 5;
export const TOPUP_MAX_DOLLARS = 500;
export const STRIPE_FEE_PERCENT = 0.029;
export const STRIPE_FEE_FIXED = 0.3;

export function calculateTopupFee(dollars: number): number {
  return Number(
    ((dollars + STRIPE_FEE_FIXED) / (1 - STRIPE_FEE_PERCENT) - dollars).toFixed(
      2
    )
  );
}

export function calculateTopupTotal(dollars: number): number {
  return Number(
    ((dollars + STRIPE_FEE_FIXED) / (1 - STRIPE_FEE_PERCENT)).toFixed(2)
  );
}

export function dollarsToCredits(dollars: number): number {
  return dollars * 100;
}

export const TOPUP_OPTIONS = [10, 50]
  .filter(
    (dollars) => dollars >= TOPUP_MIN_DOLLARS && dollars <= TOPUP_MAX_DOLLARS
  )
  .map((dollars) => ({
    label: `$${dollars}`,
    credits: dollarsToCredits(dollars),
    creditValue: dollars,
    price: calculateTopupTotal(dollars),
    fee: calculateTopupFee(dollars),
  }));

export type FeatureId = (typeof FEATURES)[keyof typeof FEATURES];

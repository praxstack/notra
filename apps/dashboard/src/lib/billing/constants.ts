export const FEATURES = {
  CHAT_MESSAGES: "ai_credits",
} as const;

export type FeatureId = (typeof FEATURES)[keyof typeof FEATURES];

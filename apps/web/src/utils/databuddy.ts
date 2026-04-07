export const LANDING_PAGE_H1_EXPERIMENT_KEY = "landing-page-h1";
export const LANDING_PAGE_H1_TEAM_MARKETER_VARIANT = "team-marketer";

export const LANDING_PAGE_H1_CONTROL_COPY =
  "Turn your daily work into publish-ready content";
export const LANDING_PAGE_H1_TEAM_MARKETER_COPY =
  "Make everyone on your team a marketer";

export const DATABUDDY_SIGNUP_STARTED_EVENT = "signup_started";

export function normalizeLandingPageH1Variant(variant?: string): string {
  return variant === LANDING_PAGE_H1_TEAM_MARKETER_VARIANT
    ? LANDING_PAGE_H1_TEAM_MARKETER_VARIANT
    : "control";
}

export function getLandingPageH1Copy(variant?: string): string {
  return normalizeLandingPageH1Variant(variant) ===
    LANDING_PAGE_H1_TEAM_MARKETER_VARIANT
    ? LANDING_PAGE_H1_TEAM_MARKETER_COPY
    : LANDING_PAGE_H1_CONTROL_COPY;
}

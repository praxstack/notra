export const RESERVED_ORGANIZATION_SLUGS = [
  "api",
  "auth",
  "login",
  "signup",
  "forgot-password",
  "reset-password",
  "invitation",
  "callback",
  "onboarding",
  "dashboard",
  "rpc",
  "design-system",
  "settings",
  "admin",
  "help",
  "support",
  "docs",
  "blog",
  "about",
  "terms",
  "privacy",
  "contact",
] as const;

export const DATABUDDY_DASHBOARD_MASK_PATTERNS = ["/*"];

export const DATABUDDY_RESERVED_ROUTE_SKIP_PATTERNS =
  RESERVED_ORGANIZATION_SLUGS.flatMap((slug) => [`/${slug}`, `/${slug}/**`]);

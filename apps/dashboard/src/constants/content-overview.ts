import { Tick02Icon } from "@hugeicons/core-free-icons";
import type { ContentResponse } from "@notra/schemas/dashboard/content";

import type { SiteStatusBadgeConfig } from "@/types/sites";

export const CONTENT_METADATA_DEBOUNCE_MS = 600;

export const CONTENT_COVER_WIDTH = 1200;
export const CONTENT_COVER_HEIGHT = 630;

export const TAG_SUGGESTION_COUNT = 6;
export const AUTHOR_AVATAR_STACK_MAX = 3;
export const TAG_SUGGESTIONS_LIMIT = 50;

export const CONTENT_AUTHOR_LINK_FIELDS = [
  "url",
  "x",
  "linkedin",
  "github",
] as const;

export const CONTENT_AUTHOR_SLUG_FALLBACK = "author";
export const CONTENT_AUTHOR_ENSURE_SELF_ATTEMPTS = 3;

export const TRAILING_DASHES = /-+$/;

export const CONTENT_STATUS_BADGES = {
  published: { variant: "success", icon: Tick02Icon, square: true },
  draft: { variant: "secondary" },
} as const satisfies Record<ContentResponse["status"], SiteStatusBadgeConfig>;

export const CONTENT_PANEL_TABS = [
  { id: "overview" },
  { id: "agent" },
] as const;

import type {
  ContentDataPointSettings,
  OnDemandContentType,
} from "@/schemas/content";
import type { EventType } from "@/types/content/preview";

export const GITHUB_API_PAGE_SIZE = 100;
export const GITHUB_API_MAX_PAGES = 50;
export const GITHUB_API_MAX_RESULTS = 500;

export const EVENTS_PER_PAGE = 50;

export const DEFAULT_CONTENT_TYPE: OnDemandContentType = "changelog";

export const DEFAULT_DATA_POINTS: ContentDataPointSettings = {
  includePullRequests: true,
  includeCommits: true,
  includeReleases: true,
  includeLinearIssues: false,
};

export const EVENT_BADGE: Record<EventType, string> = {
  Release:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PR: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Commit:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

import {
  Activity01Icon,
  AiBrowserIcon,
  AiChat01Icon,
  Analytics01Icon,
  Calendar03Icon,
  ChartAnalysisIcon,
  Comment01Icon,
  Home01Icon,
  Key01Icon,
  Layers01Icon,
  MagicWand01Icon,
  Message01Icon,
  NoteIcon,
  Notification03Icon,
  PaintBoardIcon,
  PencilEdit01Icon,
  PlugIcon,
  PlusSignIcon,
  RainbowIcon,
  Robot01Icon,
  SearchList01Icon,
  Settings01Icon,
  UserGroupIcon,
  WebDesign01Icon,
} from "@hugeicons/core-free-icons";
import {
  GEO_AGENT_READINESS_NAV_LINK,
  GEO_GAPS_NAV_LINK,
  GEO_PROMPTS_NAV_LINK,
  GEO_WRITER_NAV_LINK,
} from "@notra/geo-core/constants/geo";
import { GEO_PERSONAS_NAV_LINK } from "@notra/geo-core/constants/geo-personas";
import type { PostStatus } from "@notra/schemas/dashboard/content";
import { DURATION } from "@notra/ui/lib/motion";

import { AGENT_FEEDBACK_NAV_LINK } from "@/constants/agent-feedback";
import { IRIS_NAV_LINK } from "@/constants/iris";
import { SITES_NAV_LINK } from "@/constants/sites";
import type {
  NavGroup,
  NavMainItem,
  NavPrimaryActionConfig,
  NavVisibility,
  SidebarMode,
  SidebarModeOption,
} from "@/types/components/nav";

/** Databuddy flag for the one-row-per-job sidebar. Off keeps the GEO/Studio sidebar. */
export const JOBS_SIDEBAR_FLAG_KEY = "jobs-sidebar";

export const HOME_NAV_LINK = "";
export const CHAT_NAV_LINK = "/chat";
export const CONTENT_NAV_LINK = "/content";
export const ANALYTICS_NAV_LINK = "/analytics";
export const BRAND_IDENTITY_NAV_LINK = "/brand/identity";
export const SCHEDULES_NAV_LINK = "/automation/schedules";
export const EVENTS_NAV_LINK = "/automation/events";
export const INTEGRATIONS_NAV_LINK = "/integrations";
export const SKILLS_NAV_LINK = "/skills";
export const API_KEYS_NAV_LINK = "/api-keys";
export const GEO_OVERVIEW_NAV_LINK = "/geo";
export const GEO_TRAFFIC_NAV_LINK = "/geo/traffic";
export const GEO_COMPETITORS_NAV_LINK = "/geo/competitors";
export const GEO_SHELF_SPACE_NAV_LINK = "/geo/shelf-space";
export const GEO_SETTINGS_NAV_LINK = "/geo/settings";

export const SIDEBAR_DEFAULT_MODE: SidebarMode = "geo";
export const SIDEBAR_DEFAULT_WIDTH = 256;
export const SIDEBAR_MIN_WIDTH = 240;
export const SIDEBAR_MAX_WIDTH = 400;
export const SIDEBAR_RESIZE_STEP = 8;
export const SIDEBAR_WIDTH_COOKIE_NAME = "sidebar_width";

export const SIDEBAR_MODES: SidebarModeOption[] = [
  {
    id: "geo",
    label: "GEO",
    descriptionKey: "measureVisibility",
    icon: AiBrowserIcon,
  },
  {
    id: "studio",
    label: "Studio",
    descriptionKey: "createContent",
    icon: NoteIcon,
  },
];

export const SIDEBAR_MODE_HOME_LINKS: Record<SidebarMode, string> = {
  geo: GEO_OVERVIEW_NAV_LINK,
  studio: HOME_NAV_LINK,
};

export const GEO_ROUTE_SECTIONS: ReadonlySet<string> = new Set(["geo"]);

export const SHARED_ROUTE_PREFIXES: readonly string[] = [
  "content",
  "automation/schedules",
];

export const STUDIO_ROUTE_SECTIONS: ReadonlySet<string> = new Set([
  "chat",
  "collection",
  "analytics",
  "brand",
  "automation",
  "feedback",
  "iris",
  "sites",
]);

export const NAV_MAIN_ITEMS: NavMainItem[] = [
  { link: HOME_NAV_LINK, icon: Home01Icon, labelKey: "home" },
  { link: CHAT_NAV_LINK, icon: Message01Icon, labelKey: "chat", badge: "beta" },
  { link: CONTENT_NAV_LINK, icon: NoteIcon, labelKey: "content" },
  { link: SITES_NAV_LINK, icon: WebDesign01Icon, labelKey: "sites" },
  { link: ANALYTICS_NAV_LINK, icon: Analytics01Icon, labelKey: "analytics" },
  {
    link: AGENT_FEEDBACK_NAV_LINK,
    icon: Comment01Icon,
    labelKey: "feedback",
    badge: "beta",
  },
  {
    link: BRAND_IDENTITY_NAV_LINK,
    icon: PaintBoardIcon,
    labelKey: "brandIdentityTitle",
  },
  { link: IRIS_NAV_LINK, icon: RainbowIcon, labelKey: "iris" },
  { link: SCHEDULES_NAV_LINK, icon: Calendar03Icon, labelKey: "schedules" },
  { link: EVENTS_NAV_LINK, icon: Notification03Icon, labelKey: "events" },
  { link: INTEGRATIONS_NAV_LINK, icon: PlugIcon, labelKey: "integrations" },
  { link: GEO_OVERVIEW_NAV_LINK, icon: AiBrowserIcon, labelKey: "overview" },
  { link: GEO_TRAFFIC_NAV_LINK, icon: Activity01Icon, labelKey: "traffic" },
  { link: GEO_PROMPTS_NAV_LINK, icon: AiChat01Icon, labelKey: "prompts" },
  { link: GEO_GAPS_NAV_LINK, icon: SearchList01Icon, labelKey: "contentGaps" },
  {
    link: GEO_SHELF_SPACE_NAV_LINK,
    icon: Layers01Icon,
    labelKey: "shelfSpace",
  },
  {
    link: GEO_AGENT_READINESS_NAV_LINK,
    icon: Robot01Icon,
    labelKey: "agentReadiness",
  },
  {
    link: GEO_COMPETITORS_NAV_LINK,
    icon: ChartAnalysisIcon,
    labelKey: "competitors",
  },
  {
    link: GEO_PERSONAS_NAV_LINK,
    icon: UserGroupIcon,
    labelKey: "personas",
    badge: "beta",
  },
  { link: GEO_WRITER_NAV_LINK, icon: PencilEdit01Icon, labelKey: "write" },
  {
    link: GEO_SETTINGS_NAV_LINK,
    icon: Settings01Icon,
    labelKey: "geoSettings",
  },
  { link: SKILLS_NAV_LINK, icon: MagicWand01Icon, labelKey: "skills" },
  { link: API_KEYS_NAV_LINK, icon: Key01Icon, labelKey: "apiKeys" },
];

export const NAV_GEO_VISIBILITY_LINKS: readonly string[] = [
  GEO_OVERVIEW_NAV_LINK,
  GEO_TRAFFIC_NAV_LINK,
  GEO_PROMPTS_NAV_LINK,
  GEO_COMPETITORS_NAV_LINK,
  GEO_PERSONAS_NAV_LINK,
];

export const NAV_GEO_IMPROVE_LINKS: readonly string[] = [
  GEO_GAPS_NAV_LINK,
  GEO_SHELF_SPACE_NAV_LINK,
  GEO_AGENT_READINESS_NAV_LINK,
  GEO_WRITER_NAV_LINK,
  CONTENT_NAV_LINK,
  SCHEDULES_NAV_LINK,
];

export const NAV_GEO_LINKS: readonly string[] = [
  ...NAV_GEO_VISIBILITY_LINKS,
  ...NAV_GEO_IMPROVE_LINKS,
];

export const NAV_STUDIO_LINKS: readonly string[] = [
  HOME_NAV_LINK,
  CHAT_NAV_LINK,
  CONTENT_NAV_LINK,
  SITES_NAV_LINK,
  ANALYTICS_NAV_LINK,
  AGENT_FEEDBACK_NAV_LINK,
  BRAND_IDENTITY_NAV_LINK,
];

export const NAV_AUTOMATION_LINKS: readonly string[] = [
  IRIS_NAV_LINK,
  SCHEDULES_NAV_LINK,
  EVENTS_NAV_LINK,
];

export const NAV_STUDIO_ALL_LINKS: readonly string[] = [
  ...NAV_STUDIO_LINKS,
  ...NAV_AUTOMATION_LINKS,
];

export const NAV_UTILITY_LINKS: readonly string[] = [
  INTEGRATIONS_NAV_LINK,
  SKILLS_NAV_LINK,
  API_KEYS_NAV_LINK,
];

/**
 * Main navigation. One row per job: the row opens its first page and reveals
 * the related pages underneath while one of them is active.
 */
export const NAV_GROUPS: readonly NavGroup[] = [
  {
    id: "overview",
    icon: Home01Icon,
    labelKey: "overview",
    links: [
      GEO_OVERVIEW_NAV_LINK,
      GEO_TRAFFIC_NAV_LINK,
      ANALYTICS_NAV_LINK,
      HOME_NAV_LINK,
    ],
  },
  {
    id: "prompts",
    icon: AiChat01Icon,
    labelKey: "prompts",
    links: [GEO_PROMPTS_NAV_LINK, GEO_PERSONAS_NAV_LINK],
  },
  {
    id: "competitors",
    icon: ChartAnalysisIcon,
    labelKey: "competitors",
    links: [GEO_COMPETITORS_NAV_LINK, GEO_SHELF_SPACE_NAV_LINK],
  },
  {
    id: "improve",
    icon: SearchList01Icon,
    labelKey: "improve",
    links: [
      GEO_GAPS_NAV_LINK,
      GEO_AGENT_READINESS_NAV_LINK,
      GEO_WRITER_NAV_LINK,
    ],
  },
  {
    id: "content",
    icon: NoteIcon,
    labelKey: "content",
    links: [
      CONTENT_NAV_LINK,
      CHAT_NAV_LINK,
      SCHEDULES_NAV_LINK,
      EVENTS_NAV_LINK,
      IRIS_NAV_LINK,
    ],
  },
  {
    id: "sites",
    icon: WebDesign01Icon,
    labelKey: "sites",
    links: [SITES_NAV_LINK],
  },
  {
    id: "feedback",
    icon: Comment01Icon,
    labelKey: "feedback",
    links: [AGENT_FEEDBACK_NAV_LINK],
  },
];

export const NAV_WORKSPACE_GROUP: NavGroup = {
  id: "workspace",
  icon: Settings01Icon,
  labelKey: "workspace",
  listsOwnPage: true,
  links: [
    BRAND_IDENTITY_NAV_LINK,
    INTEGRATIONS_NAV_LINK,
    SKILLS_NAV_LINK,
    API_KEYS_NAV_LINK,
  ],
};

/** Where Search sits in the sidebar. */
export const SIDEBAR_SEARCH_PLACEMENTS = ["bottom", "top-field"] as const;

export const SIDEBAR_SEARCH_PLACEMENT_DEFAULT: (typeof SIDEBAR_SEARCH_PLACEMENTS)[number] =
  "bottom";

export const DEFAULT_NAV_VISIBILITY: NavVisibility = {
  iris: true,
  analytics: true,
  sites: false,
};

export const NAV_PRIMARY_ACTIONS: Record<SidebarMode, NavPrimaryActionConfig> =
  {
    geo: { icon: PencilEdit01Icon },
    studio: { icon: PlusSignIcon },
  };

const SIDEBAR_MODE_SWOOSH_IN = "ease-[cubic-bezier(0.16,1,0.3,1)]";
const SIDEBAR_MODE_SWOOSH_OUT = "ease-emphasized";
const SIDEBAR_MODE_ENTER_TIMING = `duration-slow ${SIDEBAR_MODE_SWOOSH_IN}`;
const SIDEBAR_MODE_EXIT_TIMING = `duration-fast ${SIDEBAR_MODE_SWOOSH_OUT}`;

export const SIDEBAR_MODE_EXIT_MS = DURATION.fast * 1000;

export const SIDEBAR_MODE_FADE_CLASS =
  "transition-[opacity,translate,filter] will-change-[opacity,translate,filter] motion-reduce:translate-x-0 motion-reduce:blur-none motion-reduce:transition-opacity";

export const SIDEBAR_MODE_ENTER_CLASS = `z-10 translate-x-0 opacity-100 blur-[0px] ${SIDEBAR_MODE_ENTER_TIMING}`;

export const SIDEBAR_MODE_EXIT_LEFT_CLASS = `pointer-events-none z-0 -translate-x-5 opacity-0 blur-[8px] ${SIDEBAR_MODE_EXIT_TIMING}`;

export const SIDEBAR_MODE_EXIT_RIGHT_CLASS = `pointer-events-none z-0 translate-x-5 opacity-0 blur-[8px] ${SIDEBAR_MODE_EXIT_TIMING}`;

export const SIDEBAR_MODE_PILL_CLASS = `pointer-events-none absolute inset-y-0 left-0 w-1/2 rounded-md bg-background ring-1 ring-border transition-[translate] will-change-[translate] duration-slow ${SIDEBAR_MODE_SWOOSH_IN} motion-reduce:transition-none`;

export const SIDEBAR_MODE_PANEL_CLASS = `flex min-h-0 w-full flex-col ${SIDEBAR_MODE_FADE_CLASS}`;

export const SIDEBAR_MODE_SLOT_CLASS = `grid transition-[grid-template-rows,opacity] duration-slow ${SIDEBAR_MODE_SWOOSH_IN} motion-reduce:transition-none`;

export const NAV_RECENT_LIMIT = 3;
export const NAV_RECENT_SKELETON_IDS = ["first", "second", "third"] as const;
export const NAV_RECENT_TITLE_CLASS = "min-w-0 max-w-[8.5rem] flex-1 truncate";

export const POST_STATUS_DOT_CLASS: Record<PostStatus, string> = {
  draft: "bg-muted-foreground/50",
  published: "bg-success",
};

export const ORG_SWITCH_STATIC_PAGE_SECTIONS: ReadonlySet<string> = new Set([
  "geo",
  "automation",
  "brand",
]);

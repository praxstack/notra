import type { GeoOlostepEngine } from "../types/geo-olostep";

export const GEO_OLOSTEP_API_KEY_ENV = "GEO_OLOSTEP_API_KEY_ENV";
export const GEO_OLOSTEP_BASE_URL = "https://api.olostep.com/v1";
/** New Olostep accounts are capped at 100 items per batch. */
export const GEO_OLOSTEP_MAX_BATCH_ITEMS = 100;
export const GEO_OLOSTEP_POLL_INTERVAL = "30s";
/** Maximum active polling time per round, before the result grace period. */
export const GEO_OLOSTEP_MAX_WAIT_MS = 30 * 60 * 1000;
/** Item results can arrive after Olostep reports the batch as completed. */
export const GEO_OLOSTEP_RESULT_GRACE_MS = 3 * 60 * 1000;
export const GEO_OLOSTEP_REQUEST_TIMEOUT_MS = 30_000;
export const GEO_OLOSTEP_ITEMS_PAGE_LIMIT = 100;
/** Provider-reported terminal states; item results still need reconciliation. */
export const GEO_OLOSTEP_TERMINAL_BATCH_STATUSES: ReadonlySet<string> = new Set(
  ["completed", "failed", "cancelled"]
);
/** Keeps the persona intro short enough for a prompt URL. */
export const GEO_OLOSTEP_PERSONA_INTRO_MAX_CHARS = 600;

/**
 * Consumer AI apps queried through Olostep's hosted browsers instead of the
 * model APIs. Each engine id maps to its parser and the URL that submits the
 * prompt.
 */
export const GEO_OLOSTEP_ENGINES: Readonly<Record<string, GeoOlostepEngine>> = {
  "openai/chatgpt": {
    parser: "@olostep/chatgpt-results",
    url: (query) => `https://chatgpt.com/?q=${encodeURIComponent(query)}`,
  },
  "perplexity/perplexity": {
    parser: "@olostep/perplexity-results",
    url: (query) => `https://www.perplexity.ai/?q=${encodeURIComponent(query)}`,
  },
  "google/gemini": {
    parser: "@olostep/gemini-results",
    url: (query) => `https://gemini.google.com/?q=${encodeURIComponent(query)}`,
  },
  "google/ai-mode": {
    parser: "@olostep/google-aimode-results",
    url: (query) =>
      `https://www.google.com/aimode?q=${encodeURIComponent(query)}`,
  },
  "microsoft/copilot": {
    parser: "@olostep/microsoft-copilot-results",
    url: (query) =>
      `https://copilot.microsoft.com/chats?q=${encodeURIComponent(query)}`,
  },
};

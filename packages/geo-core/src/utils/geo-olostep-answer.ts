import {
  GEO_CHECK_GROUNDING_MAX_QUERIES,
  GEO_CHECK_GROUNDING_MAX_SOURCES,
} from "@notra/db/constants/geo-checks";
import type { GeoCheckSource } from "@notra/db/types/geo-checks";

import type { GeoEngineAnswer } from "../types/geo";
import type {
  GeoOlostepAnswerPayload,
  GeoOlostepSource,
} from "../types/geo-olostep";
import { getReferenceDomain } from "./reference-display";

function uniqueSources(sources: readonly GeoOlostepSource[]): GeoCheckSource[] {
  const seen = new Set<string>();
  const result: GeoCheckSource[] = [];
  for (const source of sources) {
    const domain = getReferenceDomain(source.url);
    if (!domain || seen.has(source.url)) {
      continue;
    }
    seen.add(source.url);
    const title = source.title || source.label || source.text || domain;
    result.push({ title, url: source.url, domain });
  }
  return result.slice(0, GEO_CHECK_GROUNDING_MAX_SOURCES);
}

/**
 * Inline references are what the answer cites. The sources drawer only counts
 * as cited when the parser does not mark an entry `cited: false` (ChatGPT
 * lists searched but uncited pages there). Grounding keeps the same cited
 * list: every reader of `grounding.sources` shows it as the answer's sources,
 * so uncited search candidates would read as citations. The search queries
 * remain as the search evidence.
 */
export function geoOlostepAnswer(
  payload: GeoOlostepAnswerPayload
): GeoEngineAnswer {
  const inline = payload.inline_references ?? [];
  const drawer = payload.sources ?? [];
  const cited = uniqueSources([
    ...inline,
    ...drawer.filter((source) => source.cited !== false),
  ]);
  const queries = [
    ...new Set(
      [
        ...(payload.network_search_calls?.search_queries ?? []),
        ...(payload.search_model_queries ?? []),
      ].map(({ query }) => query)
    ),
  ].slice(0, GEO_CHECK_GROUNDING_MAX_QUERIES);
  const text = payload.answer_markdown?.trim() ?? "";
  return {
    text,
    grounding: { queries, sources: cited },
    sources: cited.map(({ title, url }) => ({ title, url })),
    finishReason: text ? "stop" : null,
    zdrEnforced: false,
  };
}

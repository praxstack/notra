import type { GeoConversationEngine } from "../types/geo-conversations";
import { resolveGroundedEngineByKey } from "./geo-grounded-engines";
import { isGeoOlostepEngine } from "./geo-olostep";

/**
 * The engine a planned sequence or persona converses with: its Olostep
 * results for a consumer app, otherwise its search-grounded route.
 */
export function resolveGeoConversationEngine(planned: {
  engine: string;
  groundedKey: string | null;
  olostepRetrieveIds?: (string | null)[];
}): GeoConversationEngine | null {
  if (isGeoOlostepEngine(planned.engine)) {
    return {
      key: planned.engine,
      retrieveIds: planned.olostepRetrieveIds ?? [],
    };
  }
  return planned.groundedKey
    ? resolveGroundedEngineByKey(planned.groundedKey)
    : null;
}

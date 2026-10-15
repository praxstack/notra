import type { Autumn } from "autumn-js";

import { shouldBypassAutumnInDevelopment } from "../utils/autumn-development";

const AUTUMN_SECRET_KEY = process.env.AUTUMN_SECRET_KEY;

/**
 * Per-request deadline for read-only billing lookups. Pass it as the request
 * option of a single call: a client-wide timeout would also cut off writes such
 * as `autumn.track`, where an aborted request can silently drop a deduction.
 */
export const AUTUMN_READ_TIMEOUT_MS = 5000;

interface AutumnClient {
  check: Autumn["check"];
  track: Autumn["track"];
  customers: Pick<Autumn["customers"], "getOrCreate" | "update" | "delete">;
  balances: Pick<Autumn["balances"], "finalize">;
}

function createLazyAutumn(secretKey: string): AutumnClient {
  let client: Promise<Autumn> | undefined;
  const load = () => {
    client ??= import("autumn-js").then(
      ({ Autumn: AutumnSdk }) => new AutumnSdk({ secretKey })
    );
    return client;
  };
  return {
    check: async (...args) => (await load()).check(...args),
    track: async (...args) => (await load()).track(...args),
    customers: {
      getOrCreate: async (...args) =>
        (await load()).customers.getOrCreate(...args),
      update: async (...args) => (await load()).customers.update(...args),
      delete: async (...args) => (await load()).customers.delete(...args),
    },
    balances: {
      finalize: async (...args) => (await load()).balances.finalize(...args),
    },
  };
}

export const autumn = AUTUMN_SECRET_KEY
  ? createLazyAutumn(AUTUMN_SECRET_KEY)
  : null;

export const allowUnmeteredAiInDevelopment = shouldBypassAutumnInDevelopment(
  process.env.NODE_ENV,
  AUTUMN_SECRET_KEY
);

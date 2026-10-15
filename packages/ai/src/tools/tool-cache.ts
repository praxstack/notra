import type { CachedWrapper } from "@notra/ai/types/tools";

interface ExecutableTool {
  execute?: (params: unknown, context?: unknown) => Promise<unknown> | unknown;
}

interface MemoryCacheEntry {
  expiresAt: number;
  value: unknown;
}

const memoryCache = new Map<string, MemoryCacheEntry>();

function normalizeKeyPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const DEFAULT_TTL_MS = 5 * 60 * 1000;
const DEFAULT_KEY_PREFIX = "notra:ai-tools:";

export function getAICachedTools(options: {
  organizationId?: string;
  namespace: string;
}) {
  const orgPart = normalizeKeyPart(options.organizationId ?? "anonymous");
  const namespacePart = normalizeKeyPart(options.namespace);
  const keyPrefix = `${DEFAULT_KEY_PREFIX}${namespacePart}:${orgPart}:`;

  const debug = process.env.NODE_ENV === "development";

  return ((tool: ExecutableTool, cacheOptions = {}) => {
    if (typeof tool.execute !== "function") {
      return tool;
    }

    const originalExecute = tool.execute;
    const toolTtl = cacheOptions.ttl ?? DEFAULT_TTL_MS;
    return {
      ...tool,
      execute: async (params: unknown, context?: unknown) => {
        const cacheKey = `${keyPrefix}${cacheOptions.keyGenerator?.(params, context) ?? createDefaultCacheKey(params)}`;
        const cachedValue = readCachedValue(cacheKey);
        if (cachedValue.hit) {
          if (cacheOptions.debug ?? debug) {
            console.debug("[ai-tool-cache] hit", cacheKey);
          }
          return cachedValue.value;
        }

        const result = await originalExecute(params, context);
        if (cacheOptions.shouldCache?.(params, result) === false) {
          return result;
        }

        writeCachedValue(cacheKey, result, toolTtl);
        return result;
      },
    };
  }) as CachedWrapper;
}

function createDefaultCacheKey(params: unknown) {
  return JSON.stringify(params ?? {});
}

function readCachedValue(
  key: string
): { hit: true; value: unknown } | { hit: false } {
  const entry = memoryCache.get(key);
  if (!entry) {
    return { hit: false };
  }

  if (entry.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return { hit: false };
  }

  return { hit: true, value: entry.value };
}

function writeCachedValue(key: string, value: unknown, ttlMs: number) {
  pruneExpiredMemoryCacheEntries();
  memoryCache.set(key, {
    expiresAt: Date.now() + ttlMs,
    value,
  });
}

function pruneExpiredMemoryCacheEntries() {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt <= now) {
      memoryCache.delete(key);
    }
  }
}

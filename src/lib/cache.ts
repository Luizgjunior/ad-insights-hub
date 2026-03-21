interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memCache = new Map<string, CacheEntry<unknown>>();

export function setCache<T>(key: string, data: T, ttlMs: number): void {
  memCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function getCache<T>(key: string): T | null {
  const entry = memCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memCache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function clearCache(prefix?: string): void {
  if (!prefix) {
    memCache.clear();
    return;
  }
  for (const key of memCache.keys()) {
    if (key.startsWith(prefix)) memCache.delete(key);
  }
}

export const CACHE_TTL = {
  METRICS: 5 * 60 * 1000,
  CAMPAIGNS: 10 * 60 * 1000,
  AI_ANALYSIS: 60 * 60 * 1000,
  PROFILE: 30 * 60 * 1000,
};

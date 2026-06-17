import type { GeminiFreshInfoRequest, GeminiFreshInfoResult } from "@/types/freshInfo";

type FreshInfoCacheEntry = {
  key: string;
  result: GeminiFreshInfoResult;
  expiresAt: string;
};

type FreshInfoCacheState = {
  cache: Map<string, FreshInfoCacheEntry>;
  cacheHitCount: number;
};

declare global {
  var __worldCupFreshInfoCacheState: FreshInfoCacheState | undefined;
}

const defaultFreshInfoCacheTtlMs = 6 * 60 * 60 * 1000;

function getState(): FreshInfoCacheState {
  if (!globalThis.__worldCupFreshInfoCacheState) {
    globalThis.__worldCupFreshInfoCacheState = {
      cache: new Map(),
      cacheHitCount: 0
    };
  }

  return globalThis.__worldCupFreshInfoCacheState;
}

export function createFreshInfoCacheKey(request: GeminiFreshInfoRequest) {
  return [
    request.targetType,
    request.targetId,
    request.infoNeeds.slice().sort().join(","),
    request.dateHint ?? "no-date"
  ].join(":");
}

export function getFreshInfoCacheTtlMs() {
  const value = Number(process.env.GEMINI_FRESH_INFO_CACHE_TTL_MS);
  return Number.isFinite(value) && value >= 60_000 ? value : defaultFreshInfoCacheTtlMs;
}

export function readFreshInfoCache(key: string) {
  const entry = getState().cache.get(key);

  if (!entry) {
    return null;
  }

  if (new Date(entry.expiresAt).getTime() <= Date.now()) {
    getState().cache.delete(key);
    return null;
  }

  getState().cacheHitCount += 1;
  return entry.result;
}

export function writeFreshInfoCache(key: string, result: GeminiFreshInfoResult) {
  getState().cache.set(key, {
    key,
    result,
    expiresAt: new Date(Date.now() + getFreshInfoCacheTtlMs()).toISOString()
  });
}

export function getFreshInfoCacheStatus() {
  const state = getState();

  return {
    cacheEntries: state.cache.size,
    cacheHitCount: state.cacheHitCount
  };
}

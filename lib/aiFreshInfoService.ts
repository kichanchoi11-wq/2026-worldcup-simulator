import { getFreshInfoCacheStatus, readFreshInfoCache, writeFreshInfoCache, createFreshInfoCacheKey } from "@/lib/freshInfoCacheService";
import { getLatestInfoSearchProviders, isLatestInfoSearchConfigured, runLatestInfoSearch } from "@/lib/aiGroundedSearchService";
import { validateFreshInfoResult } from "@/lib/freshInfoValidationService";
import { buildMatchFreshInfoRequest, buildTeamFreshInfoRequest, createFallbackFreshInfoResult } from "@/lib/worldCupFallbackDataService";
import type { FootballMatch } from "@/types/football";
import type { FreshInfoItem, FreshInfoNeed, FreshInfoSource, AIFreshInfoRequest, AIFreshInfoResult, AIFreshInfoStatus } from "@/types/freshInfo";

type FreshInfoState = {
  results: Map<string, AIFreshInfoResult>;
  failureCount: number;
  timeoutCount: number;
  fallbackCount: number;
  lastSearchedAt: string | null;
};

declare global {
  var __worldCupAIFreshInfoState: FreshInfoState | undefined;
}

function getState(): FreshInfoState {
  if (!globalThis.__worldCupAIFreshInfoState) {
    globalThis.__worldCupAIFreshInfoState = {
      results: new Map(),
      failureCount: 0,
      timeoutCount: 0,
      fallbackCount: 0,
      lastSearchedAt: null
    };
  }

  return globalThis.__worldCupAIFreshInfoState;
}

function categoryFromNeed(need: FreshInfoNeed): FreshInfoItem["category"] {
  const map: Record<FreshInfoNeed, FreshInfoItem["category"]> = {
    actualResult: "경기 결과",
    matchStatus: "경기 상태",
    venue: "경기장",
    cards: "카드",
    injuries: "부상",
    suspensions: "징계",
    fitness: "체력",
    lineups: "라인업",
    formations: "포메이션",
    coachTactics: "감독 전술",
    matchReview: "경기 리뷰",
    predictionComparison: "예측 비교"
  };
  return map[need];
}

function targetLabel(request: AIFreshInfoRequest) {
  return request.matchName ?? request.teamNames?.join(" / ") ?? request.targetId;
}

function buildFreshInfoQuery(request: AIFreshInfoRequest) {
  const needs = request.infoNeeds.map(categoryFromNeed).join(" ");
  const teams = request.teamNames?.join(" ") ?? "";
  const dateHint = request.dateHint ? ` ${request.dateHint}` : "";
  const allowed = request.allowedSources?.join(" ") ?? "FIFA official team news football data injury suspension lineup";

  return [
    "2026 FIFA World Cup",
    targetLabel(request),
    teams,
    needs,
    dateHint,
    allowed,
    "official source latest"
  ]
    .filter(Boolean)
    .join(" ");
}

function defaultSourceNames(sources: FreshInfoSource[]) {
  return sources.slice(0, 3).map((source) => source.name);
}

function defaultSourceUrls(sources: FreshInfoSource[]) {
  return sources.slice(0, 3).map((source) => source.url).filter((url): url is string => Boolean(url));
}

function trimSummary(value: string) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned.length > 420 ? `${cleaned.slice(0, 420)}...` : cleaned;
}

function createSearchBackedItems(request: AIFreshInfoRequest, sources: FreshInfoSource[], searchedAt: string, summary: string) {
  const status: FreshInfoItem["status"] = sources.length >= 2 ? "복수 출처 확인" : "추정";
  const sourceNames = defaultSourceNames(sources);
  const sourceUrls = defaultSourceUrls(sources);

  return request.infoNeeds.map((need) => {
    const category = categoryFromNeed(need);
    return {
      category,
      title: `${targetLabel(request)} ${category}`,
      value:
        sources.length > 0
          ? `검색 provider가 관련 출처를 확인했습니다. 확정 사실은 출처 원문 기준으로 검토해야 하며, 현재 요약은 다음 근거에 기반합니다: ${trimSummary(summary)}`
          : "검색 provider가 관련 출처를 찾지 못해 확정 정보로 반영하지 않았습니다.",
      status,
      sourceNames,
      sourceUrls,
      lastCheckedAt: searchedAt
    } satisfies FreshInfoItem;
  });
}

function createSearchResult(
  request: AIFreshInfoRequest,
  provider: "tavily" | "exa",
  searchedAt: string,
  summaryText: string,
  sources: FreshInfoSource[]
): AIFreshInfoResult {
  const items = createSearchBackedItems(request, sources, searchedAt, summaryText);

  return validateFreshInfoResult({
    ok: true,
    targetType: request.targetType,
    targetId: request.targetId,
    generatedAt: new Date().toISOString(),
    searchedAt,
    searchUsed: sources.length > 0,
    providerUsed: provider,
    items,
    summary: `${provider === "tavily" ? "Tavily" : "Exa"} 검색 결과를 출처 기반으로 정리했습니다.`,
    limitations: [
      "AI는 검색 결과에 없는 부상, 카드, 징계, 라인업, 감독 전술 변화를 새로 만들지 않습니다.",
      "검색 결과가 특정 항목을 확정하지 못하면 관리자 입력 또는 공식 발표 확인 후 보강해야 합니다."
    ],
    sources,
    confidence: sources.length >= 2 ? "보통" : "낮음",
    fallbackUsed: false,
    error: null
  });
}

function createFallbackResult(request: AIFreshInfoRequest, reason: string, cacheKey: string) {
  const state = getState();
  state.fallbackCount += 1;
  const fallback = validateFreshInfoResult(createFallbackFreshInfoResult(request, reason));
  writeFreshInfoCache(cacheKey, fallback);
  state.results.set(cacheKey, fallback);
  return fallback;
}

export async function createAIFreshInfo(request: AIFreshInfoRequest): Promise<AIFreshInfoResult> {
  const cacheKey = createFreshInfoCacheKey(request);
  const cached = readFreshInfoCache(cacheKey);

  if (cached) {
    return {
      ...cached,
      summary: `${cached.summary} 저장된 최신정보 캐시를 사용했습니다.`
    };
  }

  const state = getState();
  const searched = await runLatestInfoSearch(buildFreshInfoQuery(request));
  state.lastSearchedAt = searched.searchedAt;

  if (!searched.ok) {
    state.failureCount += 1;
    if (searched.timeout) {
      state.timeoutCount += 1;
    }
    return createFallbackResult(request, searched.message, cacheKey);
  }

  if (!searched.searchUsed || searched.sources.length === 0) {
    return createFallbackResult(request, "Tavily/Exa 검색 결과에 출처가 없어 최신 사실로 반영하지 않았습니다.", cacheKey);
  }

  const result = createSearchResult(request, searched.provider, searched.searchedAt, searched.text, searched.sources);
  writeFreshInfoCache(cacheKey, result);
  state.results.set(cacheKey, result);
  return result;
}

export async function createMatchFreshInfo(matchId: string, apiMatches: FootballMatch[] = []) {
  const request = buildMatchFreshInfoRequest(matchId, apiMatches);
  return request ? createAIFreshInfo(request) : null;
}

export async function createTeamFreshInfo(teamId: string) {
  const request = buildTeamFreshInfoRequest(teamId);
  return request ? createAIFreshInfo(request) : null;
}

export function getAIFreshInfoStatus(results: AIFreshInfoResult[] = []): AIFreshInfoStatus {
  const state = getState();
  const cache = getFreshInfoCacheStatus();
  const allResults = results.length > 0 ? results : Array.from(state.results.values());
  const items = allResults.flatMap((result) => result.items);
  const categoryCount = (category: FreshInfoItem["category"]) => items.filter((item) => item.category === category && item.status !== "추가 확인 필요").length;
  const sourceBackedItemCount = items.filter((item) => item.sourceNames.length > 0 && !item.sourceNames.includes("출처 확인 필요")).length;
  const searchProviders = getLatestInfoSearchProviders();

  return {
    enabled: isLatestInfoSearchConfigured(),
    searchEnabled: searchProviders.length > 0,
    searchAvailable: allResults.some((result) => result.searchUsed),
    searchProviders,
    lastSearchedAt: state.lastSearchedAt,
    targetMatchCount: allResults.filter((result) => result.targetType === "match").length,
    targetTeamCount: allResults.filter((result) => result.targetType === "team").length,
    reflectedCounts: {
      cards: categoryCount("카드"),
      injuries: categoryCount("부상"),
      suspensions: categoryCount("징계"),
      lineupsAndFormations: categoryCount("라인업") + categoryCount("포메이션"),
      reviews: categoryCount("경기 리뷰"),
      fitness: categoryCount("체력")
    },
    needsReviewCount: items.filter((item) => item.status === "추가 확인 필요").length,
    sourceBackedItemCount,
    sourceMissingItemCount: Math.max(0, items.length - sourceBackedItemCount),
    cacheHitCount: cache.cacheHitCount,
    failureCount: state.failureCount,
    timeoutCount: state.timeoutCount,
    fallbackCount: state.fallbackCount,
    message: isLatestInfoSearchConfigured()
      ? "Tavily/Exa 검색 provider를 서버 Route에서만 호출합니다. 출처 없는 최신 정보는 확정 사실로 반영하지 않습니다."
      : "Tavily/Exa API 키가 없어 저장 데이터와 fallback 데이터만 분석합니다."
  };
}

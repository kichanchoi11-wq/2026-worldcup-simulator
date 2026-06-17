import { getFreshInfoCacheStatus, readFreshInfoCache, writeFreshInfoCache, createFreshInfoCacheKey } from "@/lib/freshInfoCacheService";
import { runGeminiGroundedSearch, isGeminiGroundingConfigured } from "@/lib/geminiGroundedSearchService";
import { validateFreshInfoResult } from "@/lib/freshInfoValidationService";
import { buildMatchFreshInfoRequest, buildTeamFreshInfoRequest, createFallbackFreshInfoResult } from "@/lib/worldCupFallbackDataService";
import type { FootballMatch } from "@/types/football";
import type { FreshInfoItem, FreshInfoNeed, FreshInfoSource, GeminiFreshInfoRequest, GeminiFreshInfoResult, GeminiFreshInfoStatus } from "@/types/freshInfo";

type FreshInfoState = {
  results: Map<string, GeminiFreshInfoResult>;
  failureCount: number;
  timeoutCount: number;
  fallbackCount: number;
  lastSearchedAt: string | null;
};

type GeminiFreshJson = {
  summary?: unknown;
  items?: unknown;
  limitations?: unknown;
};

declare global {
  var __worldCupGeminiFreshInfoState: FreshInfoState | undefined;
}

function getState(): FreshInfoState {
  if (!globalThis.__worldCupGeminiFreshInfoState) {
    globalThis.__worldCupGeminiFreshInfoState = {
      results: new Map(),
      failureCount: 0,
      timeoutCount: 0,
      fallbackCount: 0,
      lastSearchedAt: null
    };
  }

  return globalThis.__worldCupGeminiFreshInfoState;
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

function buildFreshInfoPrompt(request: GeminiFreshInfoRequest) {
  return [
    "너는 2026 FIFA 월드컵 데이터 보강을 돕는 검증 보조 엔진이다.",
    "중요 규칙:",
    "1. Google Search grounding 결과와 제공된 기존 데이터에 근거해서만 답한다.",
    "2. 없는 경기 결과, 카드 기록, 부상, 징계, 선수명, 라인업, 포메이션을 만들지 않는다.",
    "3. 확인되지 않은 정보는 반드시 '추정' 또는 '추가 확인 필요'로 표시한다.",
    "4. 카드, 부상, 징계 정보는 날짜에 따라 바뀌므로 확인 시각과 출처를 포함한다.",
    "5. 최소 1개 이상의 출처가 없으면 '추가 확인 필요'로 표시한다.",
    "6. 공식 출처와 데이터 사이트를 우선하고, 언론/전술 분석/팬 자료는 보조 근거로만 쓴다.",
    "7. 사용자에게 보여줄 문장은 한국어로 작성한다.",
    "8. 실제 사실 데이터와 분석/설명 문장을 분리한다.",
    "마크다운 없이 JSON 객체 하나만 반환한다.",
    "반환 형식:",
    "{ \"summary\": string, \"items\": [{ \"category\": string, \"title\": string, \"value\": string, \"status\": \"확정\"|\"복수 출처 확인\"|\"추정\"|\"추가 확인 필요\", \"sourceNames\": string[], \"sourceUrls\": string[] }], \"limitations\": string[] }",
    `대상: ${request.matchName ?? request.teamNames?.join(" / ") ?? request.targetId}`,
    `필요 항목: ${request.infoNeeds.map(categoryFromNeed).join(", ")}`,
    `허용/우선 출처: ${(request.allowedSources ?? []).join(", ") || "공식 출처와 축구 데이터 사이트"}`,
    "기존 데이터:",
    JSON.stringify(request.existingData)
  ].join("\n\n");
}

function parseJsonObject<T>(text: string): T | null {
  const trimmed = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
  }

  return null;
}

function asString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()) : [];
}

function isFreshCategory(value: string): value is FreshInfoItem["category"] {
  return ["경기 결과", "경기 상태", "경기장", "카드", "부상", "징계", "체력", "라인업", "포메이션", "감독 전술", "경기 리뷰", "예측 비교"].includes(value);
}

function isFreshStatus(value: unknown): value is FreshInfoItem["status"] {
  return value === "확정" || value === "복수 출처 확인" || value === "추정" || value === "추가 확인 필요";
}

function fallbackNeed(request: GeminiFreshInfoRequest, index: number): FreshInfoNeed {
  return request.infoNeeds[index] ?? request.infoNeeds[0] ?? "cards";
}

function defaultSourceNames(sources: FreshInfoSource[]) {
  return sources.slice(0, 3).map((source) => source.name);
}

function defaultSourceUrls(sources: FreshInfoSource[]) {
  return sources.slice(0, 3).map((source) => source.url).filter((url): url is string => Boolean(url));
}

function createSourceBackedPlaceholderItems(request: GeminiFreshInfoRequest, sources: FreshInfoSource[], searchedAt: string) {
  return request.infoNeeds.map((need) => ({
    category: categoryFromNeed(need),
    title: `${request.matchName ?? request.teamNames?.join(" / ") ?? request.targetId} ${categoryFromNeed(need)}`,
    value: "Gemini 검색 grounding 출처는 확인됐지만 항목별 사실을 안정적으로 분리하지 못했습니다. 화면에는 추가 확인 필요로 반영합니다.",
    status: "추가 확인 필요" as const,
    sourceNames: defaultSourceNames(sources),
    sourceUrls: defaultSourceUrls(sources),
    lastCheckedAt: searchedAt
  }));
}

function applyGroundedPayload(request: GeminiFreshInfoRequest, payload: GeminiFreshJson, sources: FreshInfoSource[], model: string | null, searchedAt: string): GeminiFreshInfoResult {
  const parsedItems = Array.isArray(payload.items)
    ? payload.items.map((item, index) => {
        const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
        const fallbackCategory = categoryFromNeed(fallbackNeed(request, index));
        const category = asString(row.category, fallbackCategory);
        const sourceNames = asStringArray(row.sourceNames);
        const sourceUrls = asStringArray(row.sourceUrls);

        return {
          category: isFreshCategory(category) ? category : fallbackCategory,
          title: asString(row.title, `${request.targetId} ${category}`),
          value: asString(row.value, "출처 기반으로 확인된 내용이 부족합니다."),
          status: isFreshStatus(row.status) ? row.status : "추가 확인 필요",
          sourceNames: sourceNames.length > 0 ? sourceNames : defaultSourceNames(sources),
          sourceUrls: sourceUrls.length > 0 ? sourceUrls : defaultSourceUrls(sources),
          lastCheckedAt: searchedAt
        } satisfies FreshInfoItem;
      })
    : [];
  const items = parsedItems.length > 0 ? parsedItems : createSourceBackedPlaceholderItems(request, sources, searchedAt);

  return validateFreshInfoResult({
    ok: true,
    targetType: request.targetType,
    targetId: request.targetId,
    generatedAt: new Date().toISOString(),
    searchedAt,
    searchUsed: sources.length > 0,
    modelUsed: model,
    items,
    summary: asString(payload.summary, "Gemini 검색 결과를 출처 기반으로 정리했습니다."),
    limitations: asStringArray(payload.limitations),
    sources,
    confidence: "보통",
    fallbackUsed: false,
    error: null
  });
}

function createFallbackResult(request: GeminiFreshInfoRequest, reason: string, cacheKey: string) {
  const state = getState();
  state.fallbackCount += 1;
  const fallback = validateFreshInfoResult(createFallbackFreshInfoResult(request, reason));
  writeFreshInfoCache(cacheKey, fallback);
  state.results.set(cacheKey, fallback);
  return fallback;
}

export async function createGeminiFreshInfo(request: GeminiFreshInfoRequest): Promise<GeminiFreshInfoResult> {
  const cacheKey = createFreshInfoCacheKey(request);
  const cached = readFreshInfoCache(cacheKey);

  if (cached) {
    return {
      ...cached,
      summary: `${cached.summary} 저장된 6시간 캐시를 사용했습니다.`
    };
  }

  const state = getState();
  const grounded = await runGeminiGroundedSearch(buildFreshInfoPrompt(request));
  state.lastSearchedAt = grounded.searchedAt;

  if (!grounded.ok) {
    state.failureCount += 1;
    if (grounded.timeout) {
      state.timeoutCount += 1;
    }
    return createFallbackResult(request, grounded.message, cacheKey);
  }

  if (!grounded.searchUsed || grounded.sources.length === 0) {
    return createFallbackResult(request, "Gemini 응답에 grounding 출처가 없어 최신 사실로 반영하지 않았습니다.", cacheKey);
  }

  const parsed = parseJsonObject<GeminiFreshJson>(grounded.text);

  if (!parsed) {
    state.failureCount += 1;
    return createFallbackResult(request, "Gemini 검색 응답 JSON 파싱에 실패해 fallback을 사용했습니다.", cacheKey);
  }

  const result = applyGroundedPayload(request, parsed, grounded.sources, grounded.model, grounded.searchedAt);
  writeFreshInfoCache(cacheKey, result);
  state.results.set(cacheKey, result);
  return result;
}

export async function createMatchFreshInfo(matchId: string, apiMatches: FootballMatch[] = []) {
  const request = buildMatchFreshInfoRequest(matchId, apiMatches);
  return request ? createGeminiFreshInfo(request) : null;
}

export async function createTeamFreshInfo(teamId: string) {
  const request = buildTeamFreshInfoRequest(teamId);
  return request ? createGeminiFreshInfo(request) : null;
}

export function getGeminiFreshInfoStatus(results: GeminiFreshInfoResult[] = []): GeminiFreshInfoStatus {
  const state = getState();
  const cache = getFreshInfoCacheStatus();
  const allResults = results.length > 0 ? results : Array.from(state.results.values());
  const items = allResults.flatMap((result) => result.items);
  const categoryCount = (category: FreshInfoItem["category"]) => items.filter((item) => item.category === category && item.status !== "추가 확인 필요").length;
  const sourceBackedItemCount = items.filter((item) => item.sourceNames.length > 0 && !item.sourceNames.includes("출처 확인 필요")).length;

  return {
    enabled: Boolean(process.env.GEMINI_API_KEY),
    groundingEnabled: process.env.GEMINI_SEARCH_GROUNDING_ENABLED !== "false",
    groundingAvailable: allResults.some((result) => result.searchUsed),
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
    message: isGeminiGroundingConfigured()
      ? "Gemini Google Search grounding을 서버 Route에서 시도합니다. 출처가 없는 응답은 최신 사실로 반영하지 않습니다."
      : "현재 배포 환경에서 Gemini 검색 grounding을 사용할 수 없어 저장 데이터와 fallback 데이터만 분석합니다."
  };
}

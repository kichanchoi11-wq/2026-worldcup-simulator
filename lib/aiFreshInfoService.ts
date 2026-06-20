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

const needSearchTerms: Record<FreshInfoNeed, string[]> = {
  actualResult: ["result", "score", "full time", "경기 결과", "스코어", "득점"],
  matchStatus: ["status", "kickoff", "finished", "scheduled", "경기 상태", "킥오프", "경기 종료"],
  venue: ["venue", "stadium", "host city", "경기장", "개최지"],
  cards: ["yellow card", "red card", "booking", "sent off", "card report", "경고", "퇴장", "카드", "경기 보고서"],
  injuries: ["injury", "injured", "doubtful", "fitness test", "out injured", "부상", "결장", "출전 불투명", "팀 뉴스"],
  suspensions: ["suspension", "suspended", "ban", "yellow card accumulation", "disciplinary", "징계", "출전 금지", "경고 누적"],
  fitness: ["rest days", "fatigue", "travel", "recovery", "fitness", "휴식일", "체력", "피로", "이동"],
  lineups: ["lineup", "starting XI", "team news", "probable lineup", "선발", "라인업", "예상 명단"],
  formations: ["formation", "tactical shape", "starting XI", "포메이션", "전형", "전술 대형"],
  coachTactics: ["coach tactics", "tactical change", "pressing", "formation", "감독", "전술", "압박", "빌드업"],
  matchReview: ["match review", "highlights", "key moments", "경기 리뷰", "주요 장면", "하이라이트"],
  predictionComparison: ["preview", "prediction", "head to head", "예측", "전망", "상대 전적"]
};

const needLackReasons: Record<FreshInfoNeed, string> = {
  actualResult: "경기 결과 전용 검색에서 확정 스코어를 확인하지 못했습니다. 실제 결과는 공식 경기 센터 또는 football-data.org 저장 결과가 들어올 때만 표시합니다.",
  matchStatus: "경기 상태 전용 검색에서 확정 상태를 확인하지 못했습니다. 킥오프/종료 상태는 공식 일정 데이터 기준으로 보강해야 합니다.",
  venue: "경기장 전용 검색에서 공식 경기장명을 확인하지 못했습니다. 경기장/도시는 FIFA 일정 데이터가 확인될 때만 확정 표시합니다.",
  cards: "카드 전용 검색을 실행했지만 선수명·팀·카드 종류·시간이 확인되는 출처를 찾지 못했습니다. 경기 결과 문장은 카드 기록으로 복사하지 않습니다.",
  injuries: "부상 전용 검색을 실행했지만 선수별 부상명·출전 가능성·팀 발표가 확인되지 않았습니다. 결장으로 단정하지 않고 확인 필요로 표시합니다.",
  suspensions: "징계 전용 검색을 실행했지만 경고 누적·퇴장 징계·출전 금지 공지가 확인되지 않았습니다. 출전 금지는 공식 공지/API 기록이 있을 때만 확정합니다.",
  fitness: "체력 전용 검색에서 선수별 컨디션 자료를 찾지 못했습니다. 휴식일·이동·일정 밀도는 내부 계산 참고 변수로만 표시합니다.",
  lineups: "라인업 전용 검색에서 공식 선발 명단을 확인하지 못했습니다. 경기 전 예상 명단과 확정 선발은 분리해 표시합니다.",
  formations: "포메이션 전용 검색에서 확정 전형을 확인하지 못했습니다. 저장된 예상 포메이션을 참고로만 표시합니다.",
  coachTactics: "감독/전술 전용 검색에서 최신 전술 변화 출처를 확인하지 못했습니다. 기존 전술 데이터와 분리해 표시합니다.",
  matchReview: "경기 리뷰 전용 검색에서 주요 장면을 정리할 수 있는 출처를 찾지 못했습니다. 종료 경기 리뷰는 공식/언론 리뷰 확인 후 표시합니다.",
  predictionComparison: "예측 비교 전용 검색에서 신뢰 가능한 전망 자료를 찾지 못했습니다. 내부 예측과 외부 전망은 분리해 표시합니다."
};

const coreNeeds: FreshInfoNeed[] = ["actualResult", "matchStatus", "venue", "matchReview", "predictionComparison"];
const lineupNeeds: FreshInfoNeed[] = ["lineups", "formations", "coachTactics"];
const standaloneNeeds: FreshInfoNeed[] = ["cards", "injuries", "suspensions", "fitness"];

function normalized(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9가-힣]+/g, " ")
    .trim();
}

function containsAny(value: string, keywords: string[]) {
  const text = normalized(value);
  return keywords.some((keyword) => text.includes(normalized(keyword)));
}

function buildFreshInfoQuery(request: AIFreshInfoRequest, needs: FreshInfoNeed[]) {
  const categories = needs.map(categoryFromNeed).join(" ");
  const terms = Array.from(new Set(needs.flatMap((need) => needSearchTerms[need]))).join(" ");
  const teams = request.teamNames?.join(" ") ?? "";
  const dateHint = request.dateHint ? ` ${request.dateHint}` : "";
  const allowed = request.allowedSources?.join(" ") ?? "FIFA official team news football data injury suspension lineup";

  return [
    "2026 FIFA World Cup",
    targetLabel(request),
    teams,
    categories,
    terms,
    dateHint,
    allowed,
    "official source latest"
  ]
    .filter(Boolean)
    .join(" ");
}

function buildSearchPlans(request: AIFreshInfoRequest) {
  const hasNeed = (need: FreshInfoNeed) => request.infoNeeds.includes(need);
  const plans: Array<{ key: string; needs: FreshInfoNeed[] }> = [];
  const core = coreNeeds.filter(hasNeed);
  const lineups = lineupNeeds.filter(hasNeed);
  if (core.length > 0) plans.push({ key: "core", needs: core });
  for (const need of standaloneNeeds) {
    if (hasNeed(need)) plans.push({ key: need, needs: [need] });
  }
  if (lineups.length > 0) plans.push({ key: "lineup-tactics", needs: lineups });
  return plans;
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

function sourceMatchesNeed(source: FreshInfoSource, summary: string, need: FreshInfoNeed) {
  if (coreNeeds.includes(need) || lineupNeeds.includes(need)) {
    return true;
  }
  return containsAny([source.name, summary].join(" "), needSearchTerms[need]);
}

function itemValueForNeed(need: FreshInfoNeed, sources: FreshInfoSource[], summary: string) {
  if (sources.length === 0) return needLackReasons[need];
  return `${categoryFromNeed(need)} 전용 검색에서 확인한 출처 기반 참고 정보입니다. 확정 사실은 출처 원문 기준으로 검토해야 하며, 현재 요약은 다음 근거에 기반합니다: ${trimSummary(summary)}`;
}

function createSearchBackedItems(request: AIFreshInfoRequest, needs: FreshInfoNeed[], sources: FreshInfoSource[], searchedAt: string, summary: string) {
  return needs.map((need) => {
    const category = categoryFromNeed(need);
    const matchedSources = sources.filter((source) => sourceMatchesNeed(source, summary, need));
    const sourceNames = defaultSourceNames(matchedSources);
    const sourceUrls = defaultSourceUrls(matchedSources);
    const status: FreshInfoItem["status"] =
      sourceNames.length >= 2 ? "복수 출처 확인" : sourceNames.length === 1 ? "추정" : "추가 확인 필요";

    return {
      category,
      title: `${targetLabel(request)} ${category}`,
      value: itemValueForNeed(need, matchedSources, summary),
      status,
      sourceNames,
      sourceUrls,
      lastCheckedAt: searchedAt
    } satisfies FreshInfoItem;
  });
}

function mergeSearchResults(
  request: AIFreshInfoRequest,
  partials: Array<{
    provider: "tavily" | "exa";
    searchedAt: string;
    summaryText: string;
    sources: FreshInfoSource[];
    needs: FreshInfoNeed[];
  }>
): AIFreshInfoResult {
  const now = new Date().toISOString();
  const items = partials.flatMap((partial) => createSearchBackedItems(request, partial.needs, partial.sources, partial.searchedAt, partial.summaryText));
  const sources = Array.from(
    new Map(partials.flatMap((partial) => partial.sources).map((source) => [`${source.name}:${source.url ?? ""}`, source])).values()
  );
  const searchedAtList = partials.map((partial) => partial.searchedAt).sort();
  const searchedAt = searchedAtList[searchedAtList.length - 1] ?? now;
  const provider = partials.find((partial) => partial.sources.length > 0)?.provider ?? partials[0]?.provider ?? null;
  const sourceBackedItems = items.filter((item) => item.sourceNames.length > 0);

  return validateFreshInfoResult({
    ok: true,
    targetType: request.targetType,
    targetId: request.targetId,
    generatedAt: now,
    searchedAt,
    searchUsed: sourceBackedItems.length > 0,
    providerUsed: provider,
    items,
    summary: "Tavily/Exa 검색 결과를 카테고리별로 분리해 출처 기반으로 정리했습니다.",
    limitations: [
      "AI는 검색 결과에 없는 부상, 카드, 징계, 라인업, 감독 전술 변화를 새로 만들지 않습니다.",
      "카드·부상·징계·체력은 각각 전용 검색 결과가 있을 때만 해당 카테고리의 참고 정보로 연결합니다.",
      "검색 결과가 특정 항목을 확정하지 못하면 관리자 입력 또는 공식 발표 확인 후 보강해야 합니다."
    ],
    sources,
    confidence: sourceBackedItems.length >= 2 ? "보통" : "낮음",
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
  const plans = buildSearchPlans(request);
  const partials: Array<{
    provider: "tavily" | "exa";
    searchedAt: string;
    summaryText: string;
    sources: FreshInfoSource[];
    needs: FreshInfoNeed[];
  }> = [];
  const failures: string[] = [];

  for (const plan of plans) {
    const searched = await runLatestInfoSearch(buildFreshInfoQuery(request, plan.needs));
    state.lastSearchedAt = searched.searchedAt;

    if (!searched.ok) {
      state.failureCount += 1;
      failures.push(`${plan.key}: ${searched.message}`);
      if (searched.timeout) {
        state.timeoutCount += 1;
      }
      partials.push({
        provider: "tavily",
        searchedAt: searched.searchedAt,
        summaryText: searched.message,
        sources: [],
        needs: plan.needs
      });
      continue;
    }

    partials.push({
      provider: searched.provider,
      searchedAt: searched.searchedAt,
      summaryText: searched.text,
      sources: searched.searchUsed ? searched.sources : [],
      needs: plan.needs
    });
  }

  if (partials.length === 0) {
    return createFallbackResult(request, failures.join(" / ") || "Tavily/Exa 검색 계획을 만들지 못했습니다.", cacheKey);
  }

  const result = mergeSearchResults(request, partials);
  if (failures.length > 0) {
    result.limitations.push(`일부 검색 실패: ${failures.slice(0, 3).join(" / ")}`);
  }
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

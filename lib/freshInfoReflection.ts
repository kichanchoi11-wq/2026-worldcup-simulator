import type { FootballDataRefreshSnapshot } from "@/lib/autoUpdateService";
import { getStorageByteSize, type SafeStorageWriteResult } from "@/lib/storage";
import type {
  AIFreshInfoResult,
  FreshInfoCategory,
  FreshInfoConfidence,
  FreshInfoItem,
  FreshInfoReflectionDiagnostics,
  FreshInfoSource,
  FreshInfoTargetMapping,
  RefreshSnapshotMeta,
  SourcedFootballInfo,
  SourcedFootballInfoCategory,
  SourcedFootballInfoConfidence,
  SourcedFootballInfoProvider,
  SourcedFootballInfoStatus
} from "@/types/freshInfo";

const categoryMap: Record<FreshInfoCategory, SourcedFootballInfoCategory | null> = {
  "경기 결과": "match_result",
  "경기 상태": "match_status",
  "경기장": "venue",
  "카드": "card",
  "부상": "injury",
  "징계": "suspension",
  "체력": "fitness",
  "라인업": "lineup",
  "포메이션": "formation",
  "감독 전술": "tactics",
  "경기 리뷰": "match_review",
  "예측 비교": "match_review"
};

function asArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function sourceProvider(source: FreshInfoSource | undefined, providerUsed: AIFreshInfoResult["providerUsed"]): SourcedFootballInfoProvider {
  if (source?.sourceType === "Tavily 검색" || providerUsed === "tavily") return "Tavily";
  if (source?.sourceType === "Exa 검색" || providerUsed === "exa") return "Exa";
  if (source?.sourceType === "football-data.org" || /football-data/i.test(source?.name ?? "")) return "football-data.org";
  if (/api-football|api-sports/i.test(source?.name ?? "")) return "API-Football";
  if (source?.sourceType === "정적 데이터" || source?.sourceType === "내부 계산") return "static";
  if (source?.sourceType === "관리자 입력") return "manual";
  return source ? "manual" : "AI";
}

function statusFromItem(item: FreshInfoItem, result: AIFreshInfoResult, sources: SourcedFootballInfo["sources"]): SourcedFootballInfoStatus {
  if (item.status === "확정" && sources.length > 0) return "confirmed";
  if (item.status === "복수 출처 확인" && sources.length > 1) return "multiple_sources";
  if (item.status === "추정" && sources.length > 0) return "single_source";
  if (result.fallbackUsed) return "needs_verification";
  return "ai_inferred";
}

function confidenceFromResult(result: AIFreshInfoResult, sources: SourcedFootballInfo["sources"]): SourcedFootballInfoConfidence {
  if (sources.length > 1) return "high";
  if (sources.length === 1) return result.confidence === "낮음" ? "low" : "medium";
  if (result.fallbackUsed) return "needs_check";
  return confidenceMap(result.confidence);
}

function confidenceMap(value: FreshInfoConfidence): SourcedFootballInfoConfidence {
  if (value === "높음") return "high";
  if (value === "보통") return "medium";
  if (value === "낮음") return "low";
  return "needs_check";
}

function generatedBy(result: AIFreshInfoResult, sources: SourcedFootballInfo["sources"]): SourcedFootballInfo["generatedBy"] {
  if (result.searchUsed && sources.length > 0) return "search";
  if (result.fallbackUsed) return "internal_rule";
  if (sources.some((source) => source.provider === "AI")) return "ai_summary";
  return "internal_rule";
}

function safeTargetType(value: string): SourcedFootballInfo["targetType"] {
  if (value === "match" || value === "team" || value === "player" || value === "coach") {
    return value;
  }

  return "team";
}

function targetName(result: AIFreshInfoResult) {
  const firstTitle = result.items[0]?.title;
  if (firstTitle) {
    return firstTitle.replace(/\s+(경기 결과|경기 상태|경기장|카드|부상|징계|체력|라인업|포메이션|감독 전술|경기 리뷰|예측 비교)$/u, "");
  }

  return result.targetId;
}

function sourcesForItem(result: AIFreshInfoResult, item: FreshInfoItem): SourcedFootballInfo["sources"] {
  const urls = asArray(item.sourceUrls);
  const selectedSources = result.sources.filter((source) => item.sourceNames.includes(source.name));
  const sources = selectedSources.length > 0 ? selectedSources : result.sources;

  return item.sourceNames.map((name, index) => {
    const matched = sources.find((source) => source.name === name) ?? sources[index];

    return {
      title: name,
      url: matched?.url ?? urls[index],
      provider: sourceProvider(matched, result.providerUsed),
      publishedAt: null,
      checkedAt: matched?.checkedAt ?? item.lastCheckedAt
    };
  });
}

export function normalizeFreshInfoResults(results: AIFreshInfoResult[] = []): SourcedFootballInfo[] {
  return results.flatMap((result) => {
    const targetType = safeTargetType(result.targetType);
    const resolvedTargetName = targetName(result);

    return result.items.flatMap((item, index) => {
      const category = categoryMap[item.category];
      if (!category) return [];

      const sources = sourcesForItem(result, item);
      const createdAt = result.generatedAt || item.lastCheckedAt;
      const updatedAt = item.lastCheckedAt || result.searchedAt || result.generatedAt;

      return {
        id: `${targetType}-${result.targetId}-${category}-${index}`,
        targetType,
        targetId: result.targetId,
        targetName: resolvedTargetName,
        category,
        title: item.title,
        summary: item.value,
        value: item.value,
        playerName: null,
        teamName: targetType === "team" ? resolvedTargetName : null,
        matchId: targetType === "match" ? result.targetId : null,
        status: statusFromItem(item, result, sources),
        confidence: confidenceFromResult(result, sources),
        sources,
        generatedBy: generatedBy(result, sources),
        createdAt,
        updatedAt
      } satisfies SourcedFootballInfo;
    });
  });
}

export function createFreshInfoMappings(items: SourcedFootballInfo[]): FreshInfoTargetMapping[] {
  return items.map((item) => {
    const mappedTargetType = item.targetType === "coach" ? "team" : item.targetType;
    const resolvedTargetId = item.targetId || item.matchId || null;
    const exact = Boolean(resolvedTargetId);

    return {
      infoId: item.id,
      targetType: mappedTargetType,
      resolvedTargetId,
      confidence: exact ? "exact" : "failed",
      reason: exact
        ? `${item.targetType} targetId ${resolvedTargetId}에 직접 연결했습니다.`
        : "targetId 또는 matchId가 없어 화면 반영 매핑이 필요합니다."
    };
  });
}

function categoryCount(items: SourcedFootballInfo[], category: SourcedFootballInfoCategory) {
  return items.filter((item) => item.category === category).length;
}

function statusFromSnapshot(snapshot: FootballDataRefreshSnapshot): RefreshSnapshotMeta["status"] {
  if (!snapshot.ok) return "failed";
  return snapshot.results.some((item) => item.status === "failed" || item.status === "partial" || item.status === "skipped")
    ? "partial"
    : "success";
}

export function createRefreshSnapshotMeta(
  snapshot: FootballDataRefreshSnapshot,
  sourcedItems = normalizeFreshInfoResults(asArray(snapshot.data?.freshInfoResults))
): RefreshSnapshotMeta {
  const updatedAt = snapshot.refreshedAt ?? new Date().toISOString();
  const providers = Array.from(new Set(sourcedItems.flatMap((item) => item.sources.map((source) => source.provider))));

  return {
    snapshotId: `${snapshot.mode}-${updatedAt}`,
    createdAt: updatedAt,
    updatedAt,
    targetSummary: {
      matches: asArray(snapshot.data?.matches).length || snapshot.data?.freshInfoStatus?.targetMatchCount || 0,
      teams: asArray(snapshot.data?.teams).length || snapshot.data?.freshInfoStatus?.targetTeamCount || 0,
      players: asArray(snapshot.data?.fallbackResources?.players).length
    },
    counts: {
      sourcedItems: sourcedItems.length,
      cards: categoryCount(sourcedItems, "card"),
      injuries: categoryCount(sourcedItems, "injury"),
      suspensions: categoryCount(sourcedItems, "suspension"),
      lineups: categoryCount(sourcedItems, "lineup"),
      formations: categoryCount(sourcedItems, "formation"),
      reviews: categoryCount(sourcedItems, "match_review"),
      fitness: categoryCount(sourcedItems, "fitness")
    },
    sourceProviders: providers,
    status: statusFromSnapshot(snapshot),
    storageMode: "localStorage-meta-only"
  };
}

export function createFreshInfoReflectionDiagnostics(input: {
  results: AIFreshInfoResult[];
  sourcedItems: SourcedFootballInfo[];
  originalSnapshotBytes: number;
  metaBytes: number;
  normalizedBytes: number;
  snapshotStorage: SafeStorageWriteResult;
}): FreshInfoReflectionDiagnostics {
  const mappings = createFreshInfoMappings(input.sourcedItems);
  const matched = mappings.filter((mapping) => mapping.resolvedTargetId !== null && mapping.confidence !== "failed");
  const unmatched = mappings.filter((mapping) => mapping.resolvedTargetId === null || mapping.confidence === "failed");
  const sourceBackedItems = input.sourcedItems.filter((item) => item.sources.length > 0 && item.generatedBy === "search").length;
  const aiInferredItems = input.sourcedItems.filter((item) => item.generatedBy === "ai_summary" || item.status === "ai_inferred").length;
  const matchDetailReflected = input.sourcedItems.filter((item) => item.targetType === "match").length;
  const teamDetailReflected = input.sourcedItems.filter((item) => item.targetType === "team" || item.targetType === "coach").length;

  return {
    checkedAt: new Date().toISOString(),
    collectedResults: input.results.length,
    normalizedItems: input.sourcedItems.length,
    sourceBackedItems,
    aiInferredItems,
    targetMappingSuccess: matched.length,
    matchDetailReflected,
    teamDetailReflected,
    unmatchedItems: unmatched.length,
    counts: {
      cards: categoryCount(input.sourcedItems, "card"),
      injuries: categoryCount(input.sourcedItems, "injury"),
      suspensions: categoryCount(input.sourcedItems, "suspension"),
      fitness: categoryCount(input.sourcedItems, "fitness"),
      lineups: categoryCount(input.sourcedItems, "lineup"),
      formations: categoryCount(input.sourcedItems, "formation"),
      reviews: categoryCount(input.sourcedItems, "match_review")
    },
    storage: {
      mode: "localStorage-meta-only",
      originalSnapshotBytes: input.originalSnapshotBytes,
      metaBytes: input.metaBytes,
      normalizedBytes: input.normalizedBytes,
      localStorageOk: input.snapshotStorage.ok,
      message:
        input.snapshotStorage.ok
          ? "worldCupFootballRefreshSnapshot에는 메타데이터만 저장했습니다."
          : input.snapshotStorage.message ?? "검색 결과 원본은 저장하지 않고 메타/정규화 데이터만 유지했습니다."
    },
    mappings,
    unmatchedReasons: unmatched.map((mapping) => mapping.reason ?? "매핑 실패"),
    message:
      unmatched.length > 0
        ? `${matched.length}건은 상세 화면에 연결했고, ${unmatched.length}건은 targetId 매핑 확인이 필요합니다.`
        : `${matched.length}건의 최신 정보가 경기/팀 상세 화면 저장소에 연결되었습니다.`
  };
}

export function measureFreshInfoStorage(snapshot: FootballDataRefreshSnapshot, meta: RefreshSnapshotMeta, sourcedItems: SourcedFootballInfo[]) {
  return {
    originalSnapshotBytes: getStorageByteSize(snapshot),
    metaBytes: getStorageByteSize(meta),
    normalizedBytes: getStorageByteSize(sourcedItems)
  };
}

import { randomUUID } from "crypto";
import { createMatchPageData, matchDetails } from "@/data/matchDetails";
import { refreshFootballData } from "@/lib/autoUpdateService";
import { fetchFootballData, getFootballProviderStatus, normalizeMatches, normalizeStandings, normalizeTeams } from "@/lib/footballApi";
import { createGeminiMatchReview } from "@/lib/geminiAnalysisService";
import { createMatchReview } from "@/lib/matchReviewService";
import { getAdvancedTeamDataAudit, getAllTeamAnalysisBundles, getBrokenPlayerNameAudit } from "@/lib/teamAnalysis";
import type { ApiFootballResourceSnapshot, ApiFootballTrackedResource, FootballApiEnvelope, FootballMatch } from "@/types/football";
import type {
  RecollectionDataPayload,
  RecollectionJob,
  RecollectionJobStatus,
  RecollectionResourceResult,
  RecollectionResponse,
  RecollectionScope
} from "@/types/recollection";

type DirectResource = {
  snapshot: ApiFootballResourceSnapshot;
  result: RecollectionResourceResult;
  items: unknown[];
};

const maxFixtureSamples = 3;
const maxTeamSamples = 4;

function nowIso() {
  return new Date().toISOString();
}

function getApiFootballLeagueId() {
  return process.env.API_FOOTBALL_LEAGUE_ID ?? "1";
}

function getApiFootballSeason() {
  return process.env.API_FOOTBALL_SEASON ?? "2026";
}

function responseItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  const response = (payload as { response?: unknown } | null)?.response;
  return Array.isArray(response) ? response : [];
}

function countPayload(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload.length;
  }

  return responseItems(payload).length;
}

function resourceSnapshot<T>(
  resource: ApiFootballTrackedResource,
  label: string,
  envelope: FootballApiEnvelope<T>,
  count: number
): ApiFootballResourceSnapshot {
  return {
    resource,
    label,
    source: envelope.source,
    lastUpdated: envelope.lastUpdated,
    cacheExpiresAt: envelope.cacheExpiresAt ?? null,
    isFallbackData: Boolean(envelope.isFallbackData),
    dataQuality: envelope.dataQuality ?? "unavailable",
    count,
    rawData: null,
    message: envelope.message
  };
}

function compactSnapshot(snapshot: ApiFootballResourceSnapshot): ApiFootballResourceSnapshot {
  return {
    ...snapshot,
    rawData: null,
    message: snapshot.message ? snapshot.message.slice(0, 320) : null
  };
}

function resourceStatus(envelope: FootballApiEnvelope<unknown>, count: number): RecollectionResourceResult["status"] {
  if (count > 0 && envelope.ok) {
    return envelope.source === "api-football" || envelope.source === "cache" ? "success" : "partial";
  }

  if (count > 0) {
    return "partial";
  }

  return envelope.ok ? "skipped" : "failed";
}

function resultFromEnvelope(
  id: string,
  label: string,
  envelope: FootballApiEnvelope<unknown>,
  count: number
): RecollectionResourceResult {
  return {
    id,
    label,
    status: resourceStatus(envelope, count),
    count,
    source: envelope.source,
    message: envelope.message ?? `${label} 재수집을 완료했습니다.`
  };
}

async function collectResource(path: string, resource: ApiFootballTrackedResource, label: string): Promise<DirectResource> {
  const envelope = await fetchFootballData(path, { response: [] });
  const items = responseItems(envelope.data);
  const count = countPayload(envelope.data);

  return {
    snapshot: resourceSnapshot(resource, label, envelope, count),
    result: resultFromEnvelope(`${resource}-${path}`, label, envelope as FootballApiEnvelope<unknown>, count),
    items
  };
}

async function collectFixtureResources(matches: FootballMatch[], scope: RecollectionScope): Promise<DirectResource[]> {
  const fixtureIds = matches
    .map((match) => match.apiId)
    .filter((id): id is number => typeof id === "number")
    .slice(0, maxFixtureSamples);

  if (fixtureIds.length === 0) {
    const skippedAt = nowIso();
    const skipped = (resource: ApiFootballTrackedResource, label: string): DirectResource => ({
      items: [],
      snapshot: {
        resource,
        label,
        source: "static",
        lastUpdated: skippedAt,
        cacheExpiresAt: null,
        isFallbackData: true,
        dataQuality: "static-default",
        count: 0,
        rawData: null,
        message: "API-Football fixture id가 없어 해당 세부 리소스 호출을 건너뛰었습니다."
      },
      result: {
        id: `${resource}-fixture-skip`,
        label,
        status: "skipped",
        count: 0,
        source: "static",
        message: "fixture id가 확인되면 자동으로 다시 수집됩니다."
      }
    });

    if (scope === "risks") {
      return [skipped("events", "카드/징계 이벤트"), skipped("injuries", "부상 정보")];
    }

    if (scope === "lineups" || scope === "formations") {
      return [skipped("lineups", "경기별 라인업"), skipped("statistics", "경기 통계")];
    }

    if (scope === "tactics") {
      return [skipped("statistics", "전술 참고 경기 통계")];
    }

    return [];
  }

  const resources: DirectResource[] = [];

  for (const fixtureId of fixtureIds) {
    if (scope === "risks" || scope === "all") {
      resources.push(await collectResource(`/api-football/fixtures/events?fixture=${fixtureId}`, "events", `카드/징계 이벤트 ${fixtureId}`));
      resources.push(await collectResource(`/api-football/injuries?fixture=${fixtureId}`, "injuries", `부상 정보 ${fixtureId}`));
    }

    if (scope === "lineups" || scope === "formations" || scope === "all") {
      resources.push(await collectResource(`/api-football/fixtures/lineups?fixture=${fixtureId}`, "lineups", `경기별 라인업 ${fixtureId}`));
    }

    if (scope === "formations" || scope === "tactics" || scope === "all") {
      resources.push(await collectResource(`/api-football/fixtures/statistics?fixture=${fixtureId}`, "statistics", `경기 통계 ${fixtureId}`));
    }

    if (scope === "all") {
      resources.push(await collectResource(`/api-football/predictions?fixture=${fixtureId}`, "predictions", `API 예측 ${fixtureId}`));
    }
  }

  return resources;
}

async function collectTeamResources(teamIds: Array<number | null>, scope: RecollectionScope): Promise<DirectResource[]> {
  const league = getApiFootballLeagueId();
  const season = getApiFootballSeason();
  const resources: DirectResource[] = [];

  if (scope === "hide-unverified-players" || scope === "all") {
    resources.push(await collectResource(`/api-football/players?league=${league}&season=${season}&page=1`, "players", "선수 명단 API 표본"));
  }

  if (scope === "coaches" || scope === "tactics" || scope === "hide-unverified-staff" || scope === "all") {
    const ids = teamIds.filter((id): id is number => typeof id === "number").slice(0, maxTeamSamples);

    if (ids.length === 0) {
      const skippedAt = nowIso();
      resources.push({
        items: [],
        snapshot: {
          resource: "coaches",
          label: "감독 정보 API 표본",
          source: "static",
          lastUpdated: skippedAt,
          cacheExpiresAt: null,
          isFallbackData: true,
          dataQuality: "static-default",
          count: 0,
          rawData: null,
          message: "API-Football 팀 id가 없어 coachs endpoint 호출을 건너뛰었습니다."
        },
        result: {
          id: "coaches-team-skip",
          label: "감독 정보 API 표본",
          status: "skipped",
          count: 0,
          source: "static",
          message: "팀 id가 확인되면 감독 endpoint를 소량 호출합니다."
        }
      });
    }

    for (const teamId of ids) {
      resources.push(await collectResource(`/api-football/coachs?team=${teamId}`, "coaches", `감독 정보 ${teamId}`));
    }
  }

  return resources;
}

async function collectGeminiReviews(scope: RecollectionScope) {
  if (scope !== "match-reviews" && scope !== "all") {
    return {
      reviews: [] as NonNullable<ReturnType<typeof createMatchReview>>[],
      result: null as RecollectionResourceResult | null
    };
  }

  const candidates = matchDetails
    .map((match) => createMatchPageData(match))
    .filter((pageData) => Boolean(createMatchReview(pageData)))
    .slice(0, 3);

  if (candidates.length === 0) {
    return {
      reviews: [] as NonNullable<ReturnType<typeof createMatchReview>>[],
      result: {
        id: "gemini-match-reviews",
        label: "Gemini 경기 리뷰",
        status: "skipped" as const,
        count: 0,
        source: "gemini",
        message: "종료된 경기 또는 실제 스코어가 없어 Gemini 리뷰 재생성을 건너뛰었습니다."
      }
    };
  }

  const reviews: NonNullable<ReturnType<typeof createMatchReview>>[] = [];
  let failedCount = 0;

  for (const pageData of candidates) {
    try {
      const result = await createGeminiMatchReview(pageData);
      if (result.review) {
        reviews.push(result.review);
      } else if (!result.ok) {
        failedCount += 1;
      }
    } catch {
      failedCount += 1;
    }
  }

  return {
    reviews,
    result: {
      id: "gemini-match-reviews",
      label: "Gemini 경기 리뷰",
      status: reviews.length > 0 && failedCount === 0 ? "success" : reviews.length > 0 ? "partial" : "failed",
      count: reviews.length,
      source: "gemini",
      message:
        reviews.length > 0
          ? "Gemini 또는 fallback 규칙으로 종료 경기 리뷰를 다시 생성했습니다."
          : "Gemini 경기 리뷰 재생성에 실패했습니다."
    } satisfies RecollectionResourceResult
  };
}

function deriveJobStatus(results: RecollectionResourceResult[], updatedCount: number): RecollectionJobStatus {
  const failedCount = results.filter((result) => result.status === "failed").length;
  const skippedCount = results.filter((result) => result.status === "skipped").length;
  const successCount = results.filter((result) => result.status === "success" || result.status === "partial").length;

  if (successCount > 0 && (failedCount > 0 || skippedCount > 0)) {
    return "부분 성공";
  }

  if (successCount > 0 || updatedCount > 0) {
    return "성공";
  }

  if (skippedCount > 0 && failedCount === 0) {
    return "건너뜀";
  }

  return "실패";
}

function scopeMessage(status: RecollectionJobStatus, label: string, updatedCount: number, failedCount: number, skippedCount: number) {
  if (status === "성공") {
    return `${label} 완료: ${updatedCount}개 항목을 저장 가능한 데이터로 갱신했습니다.`;
  }

  if (status === "부분 성공") {
    return `${label} 부분 완료: ${updatedCount}개 갱신, ${failedCount}개 실패, ${skippedCount}개 건너뜀. 저장된 fallback 데이터는 유지했습니다.`;
  }

  if (status === "건너뜀") {
    return `${label}은 현재 fixture id 또는 종료 경기 조건이 부족해 건너뛰었습니다. 기존 저장 데이터는 유지됩니다.`;
  }

  return `${label}에 실패했습니다. API-Football, football-data.org, 캐시, 정적 fallback 순서를 확인해 주세요.`;
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value && value.trim().length > 0))));
}

export async function runAdminRecollection(scope: RecollectionScope): Promise<RecollectionResponse> {
  const definitionLabel: Record<RecollectionScope, string> = {
    all: "전체 관리자 재수집",
    coaches: "감독 정보 재검증",
    formations: "포메이션 정보 재검증",
    tactics: "전술 정보 재검증",
    lineups: "예상 라인업 재검증",
    risks: "경기별 카드/징계/부상 정보 재검증",
    "match-reviews": "끝난 경기 리뷰 재검증",
    "hide-unverified-players": "출처 없는 선수 데이터 숨기기",
    "hide-unverified-staff": "출처 없는 감독/전술/포메이션 숨기기",
    "disable-invalid-data": "잘못된 데이터 비활성화"
  };
  const requestedAt = nowIso();
  const startedAt = nowIso();
  const label = definitionLabel[scope] ?? "관리자 재수집";

  const refreshSnapshot = await refreshFootballData("manual");
  const matches = refreshSnapshot.data.matches.length > 0 ? refreshSnapshot.data.matches : normalizeMatches(refreshSnapshot.data.matches);
  const standings = refreshSnapshot.data.standings.length > 0 ? refreshSnapshot.data.standings : normalizeStandings(refreshSnapshot.data.standings);
  const teams = refreshSnapshot.data.teams.length > 0 ? refreshSnapshot.data.teams : normalizeTeams(refreshSnapshot.data.teams);
  const teamResources = await collectTeamResources(
    teams.map((team) => team.id),
    scope
  );
  const fixtureResources = await collectFixtureResources(matches, scope);
  const geminiReviews = await collectGeminiReviews(scope);
  const teamAnalysisBundles = getAllTeamAnalysisBundles();
  const audit = getAdvancedTeamDataAudit();
  const brokenPlayerNames = getBrokenPlayerNameAudit();
  const directResources = [...teamResources, ...fixtureResources];
  const resourceSnapshots = [...refreshSnapshot.data.resourceSnapshots.map(compactSnapshot), ...directResources.map((resource) => compactSnapshot(resource.snapshot))];
  const directResults = directResources.map((resource) => resource.result);
  const baseResults: RecollectionResourceResult[] = refreshSnapshot.results.map((result) => ({
    id: `base-${result.id}`,
    label: result.label,
    status: result.status,
    count: result.count,
    source: "server-refresh",
    message: result.message
  }));
  const results = [...baseResults, ...directResults, ...(geminiReviews.result ? [geminiReviews.result] : [])];
  const apiPlayers = directResources.filter((resource) => resource.snapshot.resource === "players").flatMap((resource) => resource.items);
  const apiCoaches = directResources.filter((resource) => resource.snapshot.resource === "coaches").flatMap((resource) => resource.items);
  const apiLineups = directResources.filter((resource) => resource.snapshot.resource === "lineups").flatMap((resource) => resource.items);
  const apiEvents = directResources.filter((resource) => resource.snapshot.resource === "events").flatMap((resource) => resource.items);
  const apiInjuries = directResources.filter((resource) => resource.snapshot.resource === "injuries").flatMap((resource) => resource.items);
  const apiStatistics = directResources.filter((resource) => resource.snapshot.resource === "statistics").flatMap((resource) => resource.items);
  const apiPredictions = directResources.filter((resource) => resource.snapshot.resource === "predictions").flatMap((resource) => resource.items);
  const fallbackResources = refreshSnapshot.data.fallbackResources;
  const matchReviews = geminiReviews.reviews.length > 0 ? geminiReviews.reviews : refreshSnapshot.data.matchReviews;
  const updatedCount =
    matches.length +
    standings.length +
    teams.length +
    fallbackResources.players.length +
    fallbackResources.coaches.length +
    fallbackResources.lineups.length +
    apiPlayers.length +
    apiCoaches.length +
    apiLineups.length +
    apiEvents.length +
    apiInjuries.length +
    apiStatistics.length +
    apiPredictions.length +
    teamAnalysisBundles.length * 4 +
    matchReviews.length;
  const failedCount = results.filter((result) => result.status === "failed").length;
  const skippedCount = results.filter((result) => result.status === "skipped").length;
  const status = deriveJobStatus(results, updatedCount);
  const finishedAt = nowIso();
  const sourcesUsed = uniqueStrings([
    ...resourceSnapshots.map((snapshot) => snapshot.source),
    ...resourceSnapshots.map((snapshot) => snapshot.source === "static" ? "정적 fallback 데이터" : null),
    geminiReviews.result ? "Gemini API/fallback" : null
  ]);
  const message = scopeMessage(status, label, updatedCount, failedCount, skippedCount);
  const job: RecollectionJob = {
    jobId: randomUUID(),
    scope,
    label,
    status,
    requestedAt,
    startedAt,
    finishedAt,
    updatedCount,
    failedCount,
    skippedCount,
    sourcesUsed,
    message,
    error: failedCount > 0 && updatedCount === 0 ? message : null,
    results
  };
  const data: RecollectionDataPayload = {
    refreshSnapshot: {
      ...refreshSnapshot,
      data: {
        ...refreshSnapshot.data,
        resourceSnapshots,
        matchReviews,
        providerStatus: getFootballProviderStatus()
      }
    },
    matches,
    standings,
    teams,
    resourceSnapshots,
    providerStatus: getFootballProviderStatus(),
    players: fallbackResources.players,
    coaches: fallbackResources.coaches,
    lineups: fallbackResources.lineups,
    events: fallbackResources.events,
    injuries: fallbackResources.injuries,
    statistics: fallbackResources.statistics,
    predictions: fallbackResources.predictions,
    apiPlayers,
    apiCoaches,
    apiLineups,
    apiEvents,
    apiInjuries,
    apiStatistics,
    apiPredictions,
    teamTactics: teamAnalysisBundles.map((item) => item.coachTacticalProfile),
    teamFormations: teamAnalysisBundles.map((item) => item.formationProfile),
    teamRiskProfiles: teamAnalysisBundles.map((item) => item.riskProfile),
    koreaPredictions: teamAnalysisBundles.map((item) => item.koreaPrediction),
    matchReviews,
    audit,
    brokenPlayerNames
  };

  return {
    ok: status === "성공" || status === "부분 성공" || status === "건너뜀",
    status,
    job,
    data,
    message
  };
}

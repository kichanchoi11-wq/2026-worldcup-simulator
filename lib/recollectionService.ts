import { randomUUID } from "crypto";
import { createMatchPageData, matchDetails } from "@/data/matchDetails";
import { refreshFootballData } from "@/lib/autoUpdateService";
import { buildCardRecords } from "@/lib/cardRecordService";
import { fetchFootballData, getFootballProviderStatus, normalizeMatches, normalizeStandings, normalizeTeams } from "@/lib/footballApi";
import { createAIAnalysis, createAIMatchReview, getAIProviderStatus } from "@/lib/aiAnalysisService";
import { createMatchReview } from "@/lib/matchReviewService";
import { getAdvancedTeamDataAudit, getAllTeamAnalysisBundles, getBrokenPlayerNameAudit } from "@/lib/teamAnalysis";
import type { ApiFootballResourceSnapshot, ApiFootballTrackedResource, FootballApiEnvelope, FootballMatch } from "@/types/football";
import type { CardRecord } from "@/types/card";
import type { AIAnalysisRecord } from "@/types/ai";
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

function needsRiskResources(scope: RecollectionScope) {
  return scope === "risks" || scope === "ai-risks" || scope === "ai-all" || scope === "all";
}

function needsLineupResources(scope: RecollectionScope) {
  return scope === "lineups" || scope === "formations" || scope === "ai-formations" || scope === "ai-all" || scope === "all";
}

function needsTacticResources(scope: RecollectionScope) {
  return scope === "tactics" || scope === "formations" || scope === "ai-coach-tactics" || scope === "ai-formations" || scope === "ai-all" || scope === "all";
}

function needsCoachResources(scope: RecollectionScope) {
  return scope === "coaches" || scope === "tactics" || scope === "ai-coach-tactics" || scope === "ai-all" || scope === "hide-unverified-staff" || scope === "all";
}

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
        message: "API-Football 2026 fixtureId가 없어 해당 세부 리소스 호출을 건너뛰었습니다. 원인: 무료 플랜에서 2026 fixtures 접근 제한 또는 매핑 실패. 대체: football-data.org 실제 결과, 정적 리스크, AI/fallback 설명을 사용합니다."
      },
      result: {
        id: `${resource}-fixture-skip`,
        label,
        status: "skipped",
        count: 0,
        source: "static",
        message: "fixtureId가 확인되면 API-Football 세부 endpoint를 다시 수집합니다. 지금은 대체 처리 사유를 화면에 표시합니다."
      }
    });

    if (needsRiskResources(scope)) {
      return [skipped("events", "카드/징계 이벤트"), skipped("injuries", "부상 정보")];
    }

    if (needsLineupResources(scope)) {
      return [skipped("lineups", "경기별 라인업"), skipped("statistics", "경기 통계")];
    }

    if (needsTacticResources(scope)) {
      return [skipped("statistics", "전술 참고 경기 통계")];
    }

    return [];
  }

  const resources: DirectResource[] = [];

  for (const fixtureId of fixtureIds) {
    if (needsRiskResources(scope)) {
      resources.push(await collectResource(`/api-football/fixtures/events?fixture=${fixtureId}`, "events", `카드/징계 이벤트 ${fixtureId}`));
      resources.push(await collectResource(`/api-football/injuries?fixture=${fixtureId}`, "injuries", `부상 정보 ${fixtureId}`));
    }

    if (needsLineupResources(scope)) {
      resources.push(await collectResource(`/api-football/fixtures/lineups?fixture=${fixtureId}`, "lineups", `경기별 라인업 ${fixtureId}`));
    }

    if (needsTacticResources(scope)) {
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

  if (needsCoachResources(scope)) {
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

async function collectAIReviews(scope: RecollectionScope) {
  if (scope !== "match-reviews" && scope !== "ai-all" && scope !== "all") {
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
        id: "ai-match-reviews",
        label: "AI 경기 리뷰",
        status: "skipped" as const,
        count: 0,
        source: "ai",
        message: "종료된 경기 또는 실제 스코어가 없어 AI 리뷰 재생성을 건너뛰었습니다."
      }
    };
  }

  const reviews: NonNullable<ReturnType<typeof createMatchReview>>[] = [];
  let failedCount = 0;

  for (const pageData of candidates) {
    try {
      const result = await createAIMatchReview(pageData);
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
      id: "ai-match-reviews",
      label: "AI 경기 리뷰",
      status: reviews.length > 0 && failedCount === 0 ? "success" : reviews.length > 0 ? "partial" : "failed",
      count: reviews.length,
      source: "ai",
      message:
        reviews.length > 0
          ? "AI 또는 fallback 규칙으로 종료 경기 리뷰를 다시 생성했습니다."
          : "AI 경기 리뷰 재생성에 실패했습니다."
    } satisfies RecollectionResourceResult
  };
}

async function collectAdminAIAnalyses(input: {
  scope: RecollectionScope;
  refreshSnapshot: Awaited<ReturnType<typeof refreshFootballData>>;
  directResources: DirectResource[];
  teamAnalysisBundles: ReturnType<typeof getAllTeamAnalysisBundles>;
  cardRecords: CardRecord[];
}): Promise<AIAnalysisRecord[]> {
  const { scope, refreshSnapshot, directResources, teamAnalysisBundles, cardRecords } = input;
  const korea = teamAnalysisBundles.find((bundle) => bundle.teamId === "korea-republic") ?? teamAnalysisBundles[0];
  const timestampKey = nowIso().slice(0, 16);
  const resourceContext = {
    mode: refreshSnapshot.mode,
    refreshedAt: refreshSnapshot.refreshedAt,
    providerStatus: getFootballProviderStatus(),
    resourceSnapshots: refreshSnapshot.data.resourceSnapshots.map((snapshot) => ({
      resource: snapshot.resource,
      label: snapshot.label,
      source: snapshot.source,
      count: snapshot.count,
      dataQuality: snapshot.dataQuality,
      message: snapshot.message
    })),
    directResults: directResources.map((resource) => resource.result),
    cardRecords: cardRecords.slice(0, 40)
  };
  const analyses: Array<() => Promise<AIAnalysisRecord>> = [];

  if (scope === "ai-refresh-summary" || scope === "ai-all" || scope === "all") {
    analyses.push(
      () => createAIAnalysis({
        kind: "refresh-summary",
        title: "관리자 새로고침 결과 요약",
        cacheKey: `admin-refresh-summary-${scope}-${timestampKey}`,
        instruction: "관리자 재수집 결과를 성공/부분 성공/실패/건너뜀으로 나누어 요약하고, fallback 사용 이유를 설명한다.",
        input: resourceContext,
        fallbackSummary: "관리자 재수집은 서버 Route에서 실행됐고, 외부 API 실패 시 캐시와 정적 기본 데이터로 보완했습니다.",
        fallbackBullets: [
          `리소스 결과 ${directResources.length}건`,
          `카드 레코드 ${cardRecords.length}건`,
          `AI 상태: ${getAIProviderStatus().message}`
        ],
        fallbackDataGaps: ["AI API 응답이 없으면 내부 규칙 기반 요약으로 표시합니다."],
        sources: ["API-Football", "football-data.org", "cache", "static"]
      })
    );
  }

  if (korea && (scope === "ai-coach-tactics" || scope === "ai-all" || scope === "all")) {
    analyses.push(
      () => createAIAnalysis({
        kind: "coach-tactics",
        title: "대한민국 감독 전술 관리자 재분석",
        cacheKey: `admin-korea-coach-tactics-${scope}-${timestampKey}`,
        instruction:
          "대한민국 홍명보 감독 전술을 데이터 근거 안에서만 다시 설명한다. 부임 시기, 최근 3-4-3 운용, 4-2-3-1 대체 운용, 강점/약점을 분리한다.",
        input: {
          koreaCoach: korea.coachTacticalProfile,
          koreaFormation: korea.formationProfile,
          resources: resourceContext
        },
        fallbackSummary: "홍명보 감독 정보는 2024-07-08 부임, 최근 3-4-3 운용, 4-2-3-1 대체 운용 기준으로 보수 표시합니다.",
        fallbackBullets: [
          "최근 실제 운용: 2026-06-12 체코전 3-4-3",
          "예상/대체 운용: 3-4-3과 4-2-3-1 병행",
          "전술 핵심: 김민재 중심 수비 안정, 황인범 전개, 손흥민·이강인 전환/창의성"
        ],
        fallbackDataGaps: ["API-Football lineups가 없는 경기는 공식 라인업 확인 전까지 추정 표시합니다."],
        sources: korea.coachTacticalProfile.sources.map((source) => source.sourceName ?? "출처 확인 필요")
      })
    );
  }

  if (korea && (scope === "ai-formations" || scope === "ai-all" || scope === "all")) {
    analyses.push(
      () => createAIAnalysis({
        kind: "formation",
        title: "대한민국 포메이션 관리자 재분석",
        cacheKey: `admin-korea-formation-${scope}-${timestampKey}`,
        instruction: "최근 실제 포메이션과 예상 포메이션을 분리하고, 불확실한 항목은 추가 확인 필요로 남긴다.",
        input: {
          koreaFormation: korea.formationProfile,
          koreaCoach: korea.coachTacticalProfile,
          lineups: directResources.filter((resource) => resource.snapshot.resource === "lineups").flatMap((resource) => resource.items)
        },
        fallbackSummary: "대한민국 포메이션은 최근 3-4-3, 예상 3-4-3/4-2-3-1 병행으로 표시합니다.",
        fallbackBullets: [
          "최근 실제: 3-4-3",
          "예상 기본: 3-4-3",
          "대체: 4-2-3-1, 4-3-3"
        ],
        fallbackDataGaps: ["fixture lineups 응답이 없으면 최근 경기 기사/정적 검증 데이터를 사용합니다."],
        sources: korea.formationProfile.sources.map((source) => source.sourceName ?? "출처 확인 필요")
      })
    );
  }

  if (scope === "ai-risks" || scope === "ai-all" || scope === "all") {
    analyses.push(
      () => createAIAnalysis({
        kind: "risk-summary",
        title: "관리자 카드·부상·징계 설명",
        cacheKey: `admin-risk-summary-${scope}-${timestampKey}`,
        instruction: "API-Football events/injuries와 fallback 카드 레코드를 구분해 리스크 설명을 만든다.",
        input: {
          ...resourceContext,
          riskProfiles: teamAnalysisBundles.slice(0, 12).map((bundle) => bundle.riskProfile)
        },
        fallbackSummary: "카드·부상·징계·체력은 실제 이벤트가 없을 때도 확인 대상자와 결측 사유를 표시합니다.",
        fallbackBullets: [
          "API-Football Card 이벤트가 있으면 실제 카드로 우선 표시",
          "이벤트가 없으면 정적 확인 대상 레코드로 빈 화면 방지",
          "부상/징계/체력은 공식 발표 전까지 확인 필요 상태 유지"
        ],
        fallbackDataGaps: ["fixtures/events, injuries, lineups 응답이 들어오면 실제 값으로 교체됩니다."],
        sources: ["API-Football events", "API-Football injuries", "static risk profiles"]
      })
    );
  }

  const records: AIAnalysisRecord[] = [];
  for (const createAnalysis of analyses) {
    records.push(await createAnalysis());
  }

  return records;
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
    "ai-coach-tactics": "AI 감독 전술 재분석",
    "ai-formations": "AI 포메이션 재분석",
    "ai-risks": "AI 카드/부상/징계 설명",
    "ai-refresh-summary": "AI 새로고침 결과 요약",
    "ai-all": "전체 AI 분석 재실행",
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
  const aiReviews = await collectAIReviews(scope);
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
  const apiPlayers = directResources.filter((resource) => resource.snapshot.resource === "players").flatMap((resource) => resource.items);
  const apiCoaches = directResources.filter((resource) => resource.snapshot.resource === "coaches").flatMap((resource) => resource.items);
  const apiLineups = directResources.filter((resource) => resource.snapshot.resource === "lineups").flatMap((resource) => resource.items);
  const apiEvents = directResources.filter((resource) => resource.snapshot.resource === "events").flatMap((resource) => resource.items);
  const apiInjuries = directResources.filter((resource) => resource.snapshot.resource === "injuries").flatMap((resource) => resource.items);
  const apiStatistics = directResources.filter((resource) => resource.snapshot.resource === "statistics").flatMap((resource) => resource.items);
  const apiPredictions = directResources.filter((resource) => resource.snapshot.resource === "predictions").flatMap((resource) => resource.items);
  const fallbackResources = refreshSnapshot.data.fallbackResources;
  const matchReviews = aiReviews.reviews.length > 0 ? aiReviews.reviews : refreshSnapshot.data.matchReviews;
  const cardRecords = buildCardRecords({
    apiEvents: apiEvents.length > 0 ? apiEvents : fallbackResources.events,
    matches,
    refreshedAt: nowIso()
  });
  const adminAIAnalyses = await collectAdminAIAnalyses({
    scope,
    refreshSnapshot,
    directResources,
    teamAnalysisBundles,
    cardRecords
  });
  const aiAnalyses = [...refreshSnapshot.data.aiAnalyses, ...adminAIAnalyses];
  const aiStatus = getAIProviderStatus();
  const freshInfoResults = refreshSnapshot.data.freshInfoResults;
  const freshInfoStatus = refreshSnapshot.data.freshInfoStatus;
  const aiAnalysisResult: RecollectionResourceResult = {
    id: `ai-analysis-${scope}`,
    label: "AI 분석 실행",
    status: aiAnalyses.some((analysis) => analysis.usedAI) ? "success" : aiAnalyses.length > 0 ? "partial" : "skipped",
    count: aiAnalyses.length,
    source: aiStatus.enabled ? "ai" : "fallback",
    message: aiStatus.enabled
      ? `AI 분석 ${aiAnalyses.length}건 처리, 호출 ${aiStatus.callCount}회, 캐시 ${aiStatus.cacheHitCount}건입니다.`
      : "GROQ_API_KEY/OPENROUTER_API_KEY가 없어 내부 규칙 기반 분석으로 fallback했습니다."
  };
  const results = [...baseResults, ...directResults, ...(aiReviews.result ? [aiReviews.result] : []), aiAnalysisResult];
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
    cardRecords.length +
    freshInfoResults.length +
    aiAnalyses.length +
    teamAnalysisBundles.length * 4 +
    matchReviews.length;
  const failedCount = results.filter((result) => result.status === "failed").length;
  const skippedCount = results.filter((result) => result.status === "skipped").length;
  const status = deriveJobStatus(results, updatedCount);
  const finishedAt = nowIso();
  const sourcesUsed = uniqueStrings([
    ...resourceSnapshots.map((snapshot) => snapshot.source),
    ...resourceSnapshots.map((snapshot) => snapshot.source === "static" ? "정적 fallback 데이터" : null),
    aiReviews.result || aiAnalyses.length > 0 ? "AI API/fallback" : null
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
        cardRecords,
        freshInfoResults,
        freshInfoStatus,
        aiAnalyses,
        aiStatus,
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
    cardRecords,
    freshInfoResults,
    freshInfoStatus,
    aiAnalyses,
    aiStatus,
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

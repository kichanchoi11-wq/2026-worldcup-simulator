import { teamVerificationData } from "@/data/teamVerificationData";
import { matchDetails, createMatchPageData } from "@/data/matchDetails";
import { fetchFootballData, getFootballProviderStatus, normalizeMatches, normalizeStandings, normalizeTeams } from "@/lib/footballApi";
import { createMatchReview } from "@/lib/matchReviewService";
import { getAdvancedTeamDataAudit, getAllTeamAnalysisBundles, getBrokenPlayerNameAudit } from "@/lib/teamAnalysis";
import type { ApiFootballResourceSnapshot, ApiFootballTrackedResource, FootballApiEnvelope } from "@/types/football";
import type { CoachData, FormationData, KoreaVsTeamPrediction, PlayerData, PlayerStatus } from "@/types/team";

export type RefreshStatus = "success" | "partial" | "failed" | "skipped";

export type RefreshResultItem = {
  id: string;
  label: string;
  status: RefreshStatus;
  message: string;
  count: number;
};

export type FootballDataRefreshSnapshot = {
  ok: boolean;
  mode: "manual" | "cron";
  refreshedAt: string;
  message: string;
  results: RefreshResultItem[];
  data: {
    matches: ReturnType<typeof normalizeMatches>;
    standings: ReturnType<typeof normalizeStandings>;
    teams: ReturnType<typeof normalizeTeams>;
    resourceSnapshots: ApiFootballResourceSnapshot[];
    fallbackResources: {
      players: PlayerData[];
      coaches: CoachData[];
      lineups: FormationData[];
      events: unknown[];
      injuries: PlayerStatus[];
      statistics: unknown[];
      predictions: KoreaVsTeamPrediction[];
    };
    teamAnalysisBundles: ReturnType<typeof getAllTeamAnalysisBundles>;
    matchReviews: NonNullable<ReturnType<typeof createMatchReview>>[];
    brokenPlayerNames: ReturnType<typeof getBrokenPlayerNameAudit>;
    audit: ReturnType<typeof getAdvancedTeamDataAudit>;
    providerStatus: ReturnType<typeof getFootballProviderStatus>;
  };
  autoUpdate: {
    cronEnabled: boolean;
    stable: boolean;
    message: string;
  };
};

function item(id: string, label: string, status: RefreshStatus, message: string, count: number): RefreshResultItem {
  return { id, label, status, message, count };
}

function envelopeSnapshot<T>(
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
    rawData: envelope.rawData ?? null,
    message: envelope.message
  };
}

function fallbackSnapshot(
  resource: ApiFootballTrackedResource,
  label: string,
  count: number,
  refreshedAt: string,
  message: string
): ApiFootballResourceSnapshot {
  return {
    resource,
    label,
    source: "static",
    lastUpdated: refreshedAt,
    cacheExpiresAt: null,
    isFallbackData: true,
    dataQuality: "static-default",
    count,
    rawData: null,
    message
  };
}

export async function refreshFootballData(mode: "manual" | "cron" = "manual"): Promise<FootballDataRefreshSnapshot> {
  const refreshedAt = new Date().toISOString();
  const [matchesEnvelope, standingsEnvelope, teamsEnvelope] = await Promise.all([
    fetchFootballData("/competitions/WC/matches", { matches: [] }),
    fetchFootballData("/competitions/WC/standings", { standings: [] }),
    fetchFootballData("/teams", { response: [] })
  ]);
  const matches = normalizeMatches(matchesEnvelope.data);
  const standings = normalizeStandings(standingsEnvelope.data);
  const teams = normalizeTeams(teamsEnvelope.data);
  const teamAnalysisBundles = getAllTeamAnalysisBundles();
  const matchReviews = matchDetails.map((match) => createMatchReview(createMatchPageData(match))).filter((review): review is NonNullable<typeof review> => Boolean(review));
  const brokenPlayerNames = getBrokenPlayerNameAudit();
  const audit = getAdvancedTeamDataAudit();
  const fallbackResources = {
    players: teamVerificationData.flatMap((team) => team.players),
    coaches: teamVerificationData.map((team) => team.coach),
    lineups: teamVerificationData.map((team) => team.expectedLineup),
    events: [],
    injuries: teamVerificationData.flatMap((team) =>
      team.playerStatuses.filter((player) => player.injuryStatus !== "정상" || player.suspensionStatus !== "없음")
    ),
    statistics: matchDetails.map((match) => ({
      matchId: match.matchId,
      homeTeamName: match.homeTeamName,
      awayTeamName: match.awayTeamName,
      dateTime: match.dateTime,
      status: match.status
    })),
    predictions: teamAnalysisBundles.map((bundle) => bundle.koreaPrediction)
  };
  const resourceSnapshots: ApiFootballResourceSnapshot[] = [
    envelopeSnapshot("fixtures", "경기 일정/결과", matchesEnvelope, matches.length),
    envelopeSnapshot("standings", "조별 순위", standingsEnvelope, standings.length),
    envelopeSnapshot("teams", "팀 정보", teamsEnvelope, teams.length),
    fallbackSnapshot("players", "선수 명단", fallbackResources.players.length, refreshedAt, "팀별 상세 선수 API는 호출 제한 보호를 위해 정적 스쿼드 fallback으로 유지합니다."),
    fallbackSnapshot("coaches", "감독 정보", fallbackResources.coaches.length, refreshedAt, "API-Football coaches 데이터가 없을 때 검증된 정적 감독 정보를 표시합니다."),
    fallbackSnapshot("lineups", "예상 라인업/포메이션", fallbackResources.lineups.length, refreshedAt, "경기별 lineups는 fixture ID 확인 후 제한적으로 갱신하고 현재는 예상 라인업 fallback을 표시합니다."),
    fallbackSnapshot("events", "골/카드/교체 이벤트", fallbackResources.events.length, refreshedAt, "종료 또는 진행 중 fixture가 확인되면 events를 제한적으로 갱신합니다."),
    fallbackSnapshot("injuries", "부상/징계", fallbackResources.injuries.length, refreshedAt, "공식 부상 API 데이터가 없을 때 선수 상태 fallback을 표시합니다."),
    fallbackSnapshot("statistics", "경기/팀 통계", fallbackResources.statistics.length, refreshedAt, "경기별 statistics는 fixture ID 확인 후 제한적으로 갱신합니다."),
    fallbackSnapshot("predictions", "승부 예측", fallbackResources.predictions.length, refreshedAt, "API-Football predictions가 없으면 내부 시뮬레이션 기반 예측을 표시합니다.")
  ];
  const providerStatus = getFootballProviderStatus();
  const results: RefreshResultItem[] = [
    item(
      "matches",
      "경기 데이터",
      matchesEnvelope.ok ? (matches.length > 0 ? "success" : "partial") : "failed",
      matchesEnvelope.message ?? (matches.length > 0 ? "경기 일정/결과를 갱신했습니다." : "표시할 경기 데이터가 아직 없습니다."),
      matches.length
    ),
    item(
      "standings",
      "조별 순위",
      standingsEnvelope.ok ? (standings.length > 0 ? "success" : "partial") : "failed",
      standingsEnvelope.message ?? (standings.length > 0 ? "순위표를 갱신했습니다." : "표시할 순위 데이터가 아직 없습니다."),
      standings.length
    ),
    item(
      "teams",
      "팀 정보",
      teamsEnvelope.ok ? (teams.length > 0 ? "success" : "partial") : "skipped",
      teamsEnvelope.message ??
        (teams.length > 0
          ? "API-Football 팀 정보를 갱신했습니다."
          : "팀별 상세 API 호출은 무료 플랜 보호를 위해 캐시 또는 정적 팀 정보로 보완합니다."),
      teams.length
    ),
    item(
      "api-usage",
      "API-Football 호출 제한",
      providerStatus.apiFootball.blocked ? "partial" : "success",
      providerStatus.apiFootball.warning ??
        `API-Football 사용량 ${providerStatus.apiFootball.used}/${providerStatus.apiFootball.limit}회, 남은 호출 ${providerStatus.apiFootball.remaining}회입니다.`,
      providerStatus.apiFootball.used
    ),
    item(
      "api-resource-snapshots",
      "API 리소스 저장 구조",
      resourceSnapshots.length > 0 ? "success" : "failed",
      "fixtures, standings, teams, players, coaches, lineups, events, injuries, statistics, predictions 저장 메타데이터를 갱신했습니다.",
      resourceSnapshots.length
    ),
    item(
      "team-analysis",
      "감독/전술/포메이션",
      teamAnalysisBundles.length > 0 ? "success" : "failed",
      "정적 팀 상세 데이터와 신뢰 가능한 스쿼드/전술 참고 자료 기준으로 분석 묶음을 생성했습니다.",
      teamAnalysisBundles.length
    ),
    item(
      "risks",
      "카드/부상/징계/체력",
      audit.riskProfiles > 0 ? "partial" : "failed",
      "공식 이벤트 데이터가 부족한 항목은 추가 확인 필요로 유지하고, 핵심 선수 기준 확인 대상을 표시했습니다.",
      audit.riskProfiles
    ),
    item(
      "match-reviews",
      "경기 리뷰",
      matchReviews.length > 0 ? "success" : "skipped",
      matchReviews.length > 0
        ? "종료 경기 기준 리뷰를 생성했습니다."
        : "종료 경기 또는 실제 스코어가 없어 리뷰를 준비 중 상태로 유지합니다.",
      matchReviews.length
    ),
    item(
      "name-audit",
      "깨진 선수명 검사",
      brokenPlayerNames.length === 0 ? "success" : "partial",
      brokenPlayerNames.length === 0 ? "깨진 선수명을 찾지 못했습니다." : "표시 단계에서 보정할 깨진 선수명이 남아 있습니다.",
      brokenPlayerNames.length
    )
  ];
  const ok = results.some((result) => result.status === "success" || result.status === "partial");

  return {
    ok,
    mode,
    refreshedAt,
    message: ok ? "최신 정보 새로고침을 완료했습니다. 실패한 항목은 기존 저장 데이터를 유지하세요." : "최신 정보를 불러오지 못했습니다. 기존 저장 데이터를 유지합니다.",
    results,
    data: {
      matches,
      standings,
      teams,
      resourceSnapshots,
      fallbackResources,
      teamAnalysisBundles,
      matchReviews,
      brokenPlayerNames,
      audit,
      providerStatus
    },
    autoUpdate: {
      cronEnabled: true,
      stable: true,
      message:
        "Vercel Cron은 서버 API Route만 호출하고 브라우저 크롤링을 하지 않습니다. API-Football 호출 제한에 가까워지면 자동으로 football-data.org, 캐시, 정적 데이터 순서로 fallback합니다."
    }
  };
}

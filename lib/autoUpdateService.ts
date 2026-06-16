import { teamVerificationData } from "@/data/teamVerificationData";
import { matchDetails, createMatchPageData } from "@/data/matchDetails";
import { fetchFootballData, getFootballProviderStatus, normalizeMatches, normalizeStandings, normalizeTeams } from "@/lib/footballApi";
import { buildCardRecords } from "@/lib/cardRecordService";
import { createGeminiAnalysis, getGeminiProviderStatus } from "@/lib/geminiAnalysisService";
import { createMatchReview } from "@/lib/matchReviewService";
import { getAdvancedTeamDataAudit, getAllTeamAnalysisBundles, getBrokenPlayerNameAudit } from "@/lib/teamAnalysis";
import type { ApiFootballResourceSnapshot, ApiFootballTrackedResource, FootballApiEnvelope } from "@/types/football";
import type { CardRecord } from "@/types/card";
import type { GeminiAnalysisRecord, GeminiProviderStatus } from "@/types/gemini";
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
    cardRecords: CardRecord[];
    geminiAnalyses: GeminiAnalysisRecord[];
    geminiStatus: GeminiProviderStatus;
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

type TeamAnalysisBundle = ReturnType<typeof getAllTeamAnalysisBundles>[number];

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

function sourceNamesFromSnapshots(resourceSnapshots: ApiFootballResourceSnapshot[]) {
  return Array.from(new Set(resourceSnapshots.map((snapshot) => `${snapshot.label}: ${snapshot.source}`)));
}

function compactKoreaAnalysis(teamAnalysisBundles: TeamAnalysisBundle[]) {
  const korea = teamAnalysisBundles.find((bundle) => bundle.teamId === "korea-republic") ?? teamAnalysisBundles[0];

  if (!korea) {
    return null;
  }

  return {
    teamId: korea.teamId,
    coach: korea.coachTacticalProfile,
    formation: korea.formationProfile,
    risk: korea.riskProfile,
    koreaPrediction: korea.koreaPrediction
  };
}

async function createRefreshGeminiAnalyses(input: {
  mode: "manual" | "cron";
  refreshedAt: string;
  resourceSnapshots: ApiFootballResourceSnapshot[];
  providerStatus: ReturnType<typeof getFootballProviderStatus>;
  teamAnalysisBundles: TeamAnalysisBundle[];
  matchReviewCount: number;
  cardRecordCount: number;
  audit: ReturnType<typeof getAdvancedTeamDataAudit>;
}): Promise<GeminiAnalysisRecord[]> {
  const sourceNames = sourceNamesFromSnapshots(input.resourceSnapshots);
  const korea = compactKoreaAnalysis(input.teamAnalysisBundles);
  const baseKey = `${input.mode}-${input.refreshedAt.slice(0, 13)}`;
  const commonInput = {
    mode: input.mode,
    refreshedAt: input.refreshedAt,
    providerStatus: input.providerStatus,
    resourceSnapshots: input.resourceSnapshots.map((snapshot) => ({
      resource: snapshot.resource,
      label: snapshot.label,
      source: snapshot.source,
      count: snapshot.count,
      dataQuality: snapshot.dataQuality,
      message: snapshot.message
    })),
    audit: input.audit,
    matchReviewCount: input.matchReviewCount,
    cardRecordCount: input.cardRecordCount
  };
  const analyses = [
    createGeminiAnalysis({
      kind: "refresh-summary",
      title: "새로고침 결과 요약",
      cacheKey: `refresh-summary-${baseKey}`,
      instruction:
        "새로고침 결과를 관리자에게 보여 줄 짧은 요약으로 정리한다. API-Football 호출 제한, 캐시 사용, fallback 사용, 다음 확인 대상을 구분한다.",
      input: commonInput,
      fallbackSummary: "서버 새로고침은 완료됐고, API-Football/football-data.org/캐시/정적 데이터 순서로 fallback 상태를 유지했습니다.",
      fallbackBullets: [
        `API-Football 사용량 ${input.providerStatus.apiFootball.used}/${input.providerStatus.apiFootball.limit}회`,
        `${input.resourceSnapshots.length}종 리소스 스냅샷 저장`,
        `${input.cardRecordCount}건 카드 확인 레코드 저장`
      ],
      fallbackDataGaps: ["Gemini API 키 또는 응답이 없으면 내부 규칙 기반 요약을 표시합니다."],
      sources: sourceNames
    }),
    createGeminiAnalysis({
      kind: "risk-summary",
      title: "카드·부상·징계·체력 요약",
      cacheKey: `risk-summary-${baseKey}`,
      instruction:
        "카드, 부상, 징계, 체력 정보가 실제 API 이벤트인지 fallback인지 구분해 설명한다. 빈 데이터가 있으면 원인과 다음 수집 대상을 적는다.",
      input: {
        ...commonInput,
        riskProfiles: input.teamAnalysisBundles.slice(0, 8).map((bundle) => bundle.riskProfile)
      },
      fallbackSummary: "카드·부상·징계·체력 정보는 API 이벤트가 부족한 경우 정적 확인 대상 목록으로 표시합니다.",
      fallbackBullets: [
        "API-Football events가 들어오면 옐로카드·레드카드·두 번째 경고를 우선 반영합니다.",
        "부상/징계/체력은 경기 전 공식 발표 전까지 확인 대상 상태로 유지합니다."
      ],
      fallbackDataGaps: ["경기별 fixture events/injuries/lineups가 부족한 항목은 추가 수집 필요로 표시합니다."],
      sources: sourceNames
    })
  ];

  if (input.mode === "manual" && korea) {
    analyses.push(
      createGeminiAnalysis({
        kind: "coach-tactics",
        title: "대한민국 감독 전술 재분석",
        cacheKey: `korea-coach-tactics-${baseKey}`,
        instruction:
          "대한민국 홍명보 감독 체제의 전술을 제공 데이터 기준으로만 설명한다. 부임 시기, 최근 운용, 강점/약점, 한국이 상대에게 적용할 전략을 구분한다.",
        input: korea,
        fallbackSummary:
          "대한민국은 홍명보 감독 체제에서 수비 안정과 전환 공격을 중시하며, 최근 3-4-3과 4-2-3-1을 상황별로 나누어 보는 보수 분석을 표시합니다.",
        fallbackBullets: [
          "부임 시기: 2024-07-08 기준으로 표시",
          "최근 운용: 2026-06-12 체코전 3-4-3을 최근 실제 포메이션 근거로 반영",
          "대체 운용: 예선/친선전 흐름을 고려해 4-2-3-1과 4-3-3을 함께 유지"
        ],
        fallbackDataGaps: ["경기별 공식 라인업 API가 없으면 최근 포메이션은 신뢰 가능한 경기 기사와 정적 검증 데이터 기준입니다."],
        sources: korea.coach.sources.map((source) => source.sourceName ?? "출처 확인 필요")
      }),
      createGeminiAnalysis({
        kind: "formation",
        title: "대한민국 포메이션 재분석",
        cacheKey: `korea-formation-${baseKey}`,
        instruction:
          "최근 실제 포메이션, 예상 포메이션, 대체 포메이션, 공격 시/수비 시 형태를 데이터 안에서만 정리한다.",
        input: korea,
        fallbackSummary: "대한민국 최근 실제 포메이션은 3-4-3, 예상 기본 운용은 3-4-3/4-2-3-1 병행으로 표시합니다.",
        fallbackBullets: [
          "체코전 선발 구조는 3-4-3으로 반영",
          "손흥민·이강인·황인범 활용을 위해 전방 3명과 중원 2명을 유동적으로 조정",
          "상대와 경기 흐름에 따라 4-2-3-1로 전환 가능"
        ],
        fallbackDataGaps: ["공식 라인업 API가 없는 경기는 예상 포메이션과 실제 포메이션을 분리 표기합니다."],
        sources: korea.formation.sources.map((source) => source.sourceName ?? "출처 확인 필요")
      })
    );
  }

  return Promise.all(analyses);
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
  const cardRecords = buildCardRecords({ apiEvents: fallbackResources.events, matches, refreshedAt });
  const providerStatus = getFootballProviderStatus();
  const geminiAnalyses = await createRefreshGeminiAnalyses({
    mode,
    refreshedAt,
    resourceSnapshots,
    providerStatus,
    teamAnalysisBundles,
    matchReviewCount: matchReviews.length,
    cardRecordCount: cardRecords.length,
    audit
  });
  const geminiStatus = getGeminiProviderStatus();
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
      cardRecords.length > 0 ? "partial" : "failed",
      "API-Football 이벤트가 있으면 실제 카드 이벤트를 저장하고, 없으면 공식 기록 확인 대상자를 빈 화면 없이 표시합니다.",
      cardRecords.length
    ),
    item(
      "gemini-analysis",
      "Gemini 분석",
      geminiAnalyses.some((analysis) => analysis.usedGemini) ? "success" : geminiAnalyses.length > 0 ? "partial" : "skipped",
      geminiStatus.enabled
        ? `Gemini 분석 ${geminiAnalyses.length}건 처리, 호출 ${geminiStatus.callCount}회, 캐시 ${geminiStatus.cacheHitCount}건입니다.`
        : "GEMINI_API_KEY가 없어 내부 규칙 기반 분석으로 fallback했습니다.",
      geminiAnalyses.length
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
  const cronConfigured = Boolean(process.env.CRON_SECRET);

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
      cardRecords,
      geminiAnalyses,
      geminiStatus,
      brokenPlayerNames,
      audit,
      providerStatus
    },
    autoUpdate: {
      cronEnabled: cronConfigured,
      stable: cronConfigured,
      message:
        cronConfigured
          ? "Vercel Hobby 플랜 제한에 맞춰 하루 1회 서버 API Route만 호출합니다. API-Football 호출 제한에 가까워지면 자동으로 football-data.org, 캐시, 정적 데이터 순서로 fallback합니다."
          : "자동 새로고침은 CRON_SECRET 환경변수가 설정되어야 활성화됩니다. 지금은 관리자 수동 새로고침을 사용하세요."
    }
  };
}

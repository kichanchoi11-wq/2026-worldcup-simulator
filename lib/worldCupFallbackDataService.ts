import { createMatchPageData, matchDetails } from "@/data/matchDetails";
import { teamVerificationData } from "@/data/teamVerificationData";
import type { FootballMatch } from "@/types/football";
import type { FreshInfoItem, FreshInfoNeed, FreshInfoSource, GeminiFreshInfoRequest, GeminiFreshInfoResult } from "@/types/freshInfo";

const needCategory: Record<FreshInfoNeed, FreshInfoItem["category"]> = {
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

function displayName(value: string | null | undefined, fallback: string) {
  return value && value.trim().length > 0 ? value : fallback;
}

export function buildMatchFreshInfoRequest(matchId: string, apiMatches: FootballMatch[] = []): GeminiFreshInfoRequest | null {
  const match = matchDetails.find((item) => String(item.matchId) === String(matchId));

  if (!match) {
    return null;
  }

  const pageData = createMatchPageData(match);
  const apiMatch = apiMatches.find((item) => String(item.id) === String(matchId) || String(item.apiId ?? "") === String(matchId)) ?? null;
  const homeTeam = displayName(match.homeTeamName, "홈 팀 확인 필요");
  const awayTeam = displayName(match.awayTeamName, "원정 팀 확인 필요");

  return {
    targetType: "match",
    targetId: String(match.matchId),
    teamNames: [homeTeam, awayTeam],
    matchName: `${homeTeam} vs ${awayTeam}`,
    dateHint: match.dateTime,
    infoNeeds: ["actualResult", "matchStatus", "venue", "cards", "injuries", "suspensions", "fitness", "lineups", "formations", "matchReview", "predictionComparison"],
    existingData: {
      match,
      apiMatch,
      pageData: {
        detail: pageData.detail,
        dataGaps: pageData.dataGaps,
        cardStatuses: pageData.cardStatuses,
        injuryStatuses: pageData.injuryStatuses,
        suspensionStatuses: pageData.suspensionStatuses,
        teamFitnessProfiles: pageData.teamFitnessProfiles,
        homeFormation: pageData.homeFormation,
        awayFormation: pageData.awayFormation,
        prediction: pageData.prediction
      }
    },
    allowedSources: ["FIFA", "CONCACAF", "football-data.org", "각 팀 공식 발표", "공식 경기 보고서", "주요 스포츠 언론"],
    language: "ko"
  };
}

export function buildTeamFreshInfoRequest(teamId: string): GeminiFreshInfoRequest | null {
  const team = teamVerificationData.find((item) => item.teamId === teamId);

  if (!team) {
    return null;
  }

  return {
    targetType: "team",
    targetId: team.teamId,
    teamNames: [team.teamName, team.teamNameEn],
    playerNames: team.players.slice(0, 12).map((player) => player.playerName),
    infoNeeds: ["injuries", "suspensions", "lineups", "formations", "coachTactics", "fitness"],
    existingData: {
      teamId: team.teamId,
      teamName: team.teamName,
      coach: team.coach,
      formation: team.formation,
      expectedLineup: team.expectedLineup,
      tactics: team.tactics,
      playerStatuses: team.playerStatuses,
      sources: team.sources
    },
    allowedSources: ["FIFA", "각 팀 공식 발표", "공식 스쿼드", "축구 데이터 사이트", "주요 스포츠 언론"],
    language: "ko"
  };
}

export function createFallbackFreshInfoResult(request: GeminiFreshInfoRequest, reason: string): GeminiFreshInfoResult {
  const now = new Date().toISOString();
  const sources = fallbackSources(request, now);
  const items = request.infoNeeds.map((need) => fallbackItem(request, need, now, sources));

  return {
    ok: true,
    targetType: request.targetType,
    targetId: request.targetId,
    generatedAt: now,
    searchedAt: now,
    searchUsed: false,
    modelUsed: null,
    items,
    summary: `${request.matchName ?? request.teamNames?.join(", ") ?? request.targetId} 최신 정보는 확인 가능한 2026 fallback 데이터와 내부 계산으로 표시합니다.`,
    limitations: [
      reason,
      "Gemini 검색 grounding이 없거나 출처가 부족한 항목은 확정 정보로 표시하지 않습니다.",
      "카드, 부상, 징계, 실제 라인업은 공식 경기 보고서나 팀 공식 발표가 확인되면 관리자 입력 또는 다음 새로고침으로 교체해야 합니다."
    ],
    sources,
    confidence: items.some((item) => item.status === "추가 확인 필요") ? "추가 확인 필요" : "보통",
    fallbackUsed: true,
    error: reason
  };
}

function fallbackSources(request: GeminiFreshInfoRequest, checkedAt: string): FreshInfoSource[] {
  const sources: FreshInfoSource[] = [
    {
      name: "2026 월드컵 정적 공식 대진 데이터",
      sourceType: "정적 데이터",
      checkedAt
    },
    {
      name: "일정 기반 내부 계산",
      sourceType: "내부 계산",
      checkedAt
    },
    {
      name: "관리자 수동 입력 대기",
      sourceType: "관리자 입력",
      checkedAt
    }
  ];

  if (request.targetType !== "team") {
    sources.splice(1, 0, {
      name: "football-data.org fallback",
      sourceType: "football-data.org",
      checkedAt
    });
  }

  return sources;
}

function fallbackItem(request: GeminiFreshInfoRequest, need: FreshInfoNeed, checkedAt: string, sources: FreshInfoSource[]): FreshInfoItem {
  const category = needCategory[need];
  const sourceNames = sources.map((source) => source.name);
  const titlePrefix = request.matchName ?? request.teamNames?.join(" / ") ?? request.targetId;

  if (need === "fitness") {
    return {
      category,
      title: `${titlePrefix} 체력 변수`,
      value: "경기 일정, 휴식일, 다음 경기 간격을 기준으로 내부 계산합니다. 이동 거리, 날씨, 선수별 최근 출전 시간은 공식 기록 확인 후 보정해야 합니다.",
      status: "추정",
      sourceNames: ["일정 기반 내부 계산", "2026 월드컵 정적 공식 대진 데이터"],
      lastCheckedAt: checkedAt
    };
  }

  if (need === "actualResult" || need === "matchStatus" || need === "venue") {
    return {
      category,
      title: `${titlePrefix} ${category}`,
      value: "football-data.org 또는 2026 정적 공식 대진 데이터에 저장된 값만 표시합니다. 값이 없으면 공식 경기 센터 확인이 필요합니다.",
      status: "추정",
      sourceNames: sourceNames.filter((name) => name !== "관리자 수동 입력 대기"),
      lastCheckedAt: checkedAt
    };
  }

  return {
    category,
    title: `${titlePrefix} ${category}`,
    value: "API-Football 무료 플랜의 2026 접근 제한 또는 검색 출처 부족으로 확정 정보를 만들지 않았습니다. 공식 경기 보고서, 팀 공식 발표, 관리자 수동 입력으로 보강해야 합니다.",
    status: "추가 확인 필요",
    sourceNames,
    lastCheckedAt: checkedAt
  };
}

import { allOfficialBracketSlots } from "@/data/fifaBracket";
import { worldCupGroupSlots } from "@/data/worldCupGroups";
import type { MatchDetailData, MatchPageData } from "@/types/match";
import type { FormationData } from "@/types/team";

const competition = "2026 FIFA 월드컵";
const lastUpdated = "2026-06-14";
const fifaScheduleSource = {
  sourceName: "FIFA World Cup 26 match schedule",
  sourceUrl: "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/match-schedule",
  lastUpdated,
  isOfficial: true,
  confidence: "공식" as const
};

const groupPairings = [
  [0, 1],
  [2, 3],
  [0, 2],
  [1, 3],
  [0, 3],
  [1, 2]
] as const;

function emptyFormation(teamId: string | null, teamName: string | null): FormationData {
  return {
    teamId: teamId ?? "team-pending",
    teamName: teamName ?? "팀 확인 필요",
    formation: null,
    matchBasis: null,
    players: [],
    type: "확인 필요",
    sourceName: null,
    sourceUrl: null,
    lastUpdated: null,
    isOfficial: false,
    confidence: "확인 필요",
    notes: [
      "공식 소집 명단, 최근 경기 라인업, 부상/징계 정보가 검증되지 않아 예상 명단을 표시할 수 없습니다."
    ]
  };
}

const groupMatchDetails: MatchDetailData[] = (["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const).flatMap((groupId) => {
  const teams = worldCupGroupSlots.filter((slot) => slot.groupId === groupId);

  return groupPairings.map(([homeIndex, awayIndex], index) => {
    const home = teams[homeIndex];
    const away = teams[awayIndex];

    return {
      matchId: `group-${groupId.toLowerCase()}-${index + 1}`,
      competition,
      round: "조별리그",
      groupId,
      homeTeamId: home?.teamSlug ?? null,
      awayTeamId: away?.teamSlug ?? null,
      homeTeamName: home?.teamName ?? null,
      awayTeamName: away?.teamName ?? null,
      dateTime: null,
      stadium: null,
      status: "확인 필요",
      score: {
        home: null,
        away: null
      },
      sourceType: "확인 필요 데이터",
      sourceName: fifaScheduleSource.sourceName,
      sourceUrl: fifaScheduleSource.sourceUrl,
      lastUpdated
    };
  });
});

const bracketMatchDetails: MatchDetailData[] = allOfficialBracketSlots.map((slot) => ({
  matchId: slot.matchId,
  competition,
  round: slot.round,
  groupId: null,
  homeTeamId: null,
  awayTeamId: null,
  homeTeamName: slot.teamASeed,
  awayTeamName: slot.teamBSeed,
  dateTime: null,
  stadium: null,
  status: "확인 필요",
  score: {
    home: null,
    away: null
  },
  sourceType: "공식 출처 데이터",
  sourceName: "FIFA official bracket structure",
  sourceUrl: fifaScheduleSource.sourceUrl,
  lastUpdated
}));

export const matchDetails: MatchDetailData[] = [...groupMatchDetails, ...bracketMatchDetails];

export function getAllMatchIds() {
  return matchDetails.map((match) => String(match.matchId));
}

export function getMatchDetailById(matchId: string) {
  return matchDetails.find((match) => String(match.matchId) === matchId) ?? null;
}

export function getGroupMatchDetails(groupId: string) {
  return groupMatchDetails.filter((match) => match.groupId === groupId);
}

export function createMatchPageData(match: MatchDetailData): MatchPageData {
  const isKoreaMatch = match.homeTeamId === "korea-republic" || match.awayTeamId === "korea-republic";

  return {
    detail: match,
    homeFormation: emptyFormation(match.homeTeamId, match.homeTeamName),
    awayFormation: emptyFormation(match.awayTeamId, match.awayTeamName),
    expectedPlayers: [],
    suspendedPlayers: [],
    injuryPlayers: [],
    cardRiskPlayers: [],
    prediction: {
      homeWinProbability: null,
      drawProbability: null,
      awayWinProbability: null,
      expectedScore: null,
      confidence: "확인 필요",
      variables: [
        "공식 소집 명단 확인 필요",
        "최근 경기 라인업 확인 필요",
        "부상/징계/카드 정보 확인 필요"
      ],
      uncertainty: "팀 정보가 검증되지 않아 선수·감독·전술·포메이션 기반 예측을 제한합니다.",
      lastUpdated: null
    },
    koreaAnalysis: {
      applies: isKoreaMatch,
      notice: isKoreaMatch
        ? "대한민국과 상대팀의 최신 선수 명단, 포메이션, 부상/징계 정보가 충분히 검증되지 않아 구체적인 경기 전략은 제한적으로 제공합니다."
        : "대한민국이 포함되지 않은 경기입니다.",
      points: isKoreaMatch
        ? [
            "공식 선발 명단 확인 후 압박 위치를 업데이트합니다.",
            "상대 카드/체력 변수가 확인되면 교체 전략 아이디어를 반영합니다.",
            "세트피스 키커와 제공권 데이터가 확인되면 대응 방안을 구체화합니다."
          ]
        : []
    },
    sources: [fifaScheduleSource]
  };
}

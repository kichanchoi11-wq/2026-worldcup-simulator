import { allOfficialBracketSlots } from "@/data/fifaBracket";
import { getTeamVerificationDataById } from "@/data/teamVerificationData";
import { worldCupGroupSlots } from "@/data/worldCupGroups";
import type { SourceMeta } from "@/types/football";
import type { MatchDetailData, MatchPageData, MatchPlayerStatus } from "@/types/match";
import type { FormationData, PlayerData, TeamVerificationData } from "@/types/team";

const competition = "2026 FIFA 월드컵";
const lastUpdated = "2026-06-14";

const fifaScheduleSource: SourceMeta = {
  sourceName: "FIFA World Cup 26 match schedule",
  sourceUrl: "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/match-schedule",
  lastUpdated,
  isOfficial: true,
  confidence: "공식",
  sourceLevel: "공식 확인",
  sourceNotes: "경기 일정과 대진 구조 확인용 공식 출처"
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
    sourceLevel: "확인 필요",
    notes: ["팀 정보가 연결되면 예상 포메이션과 핵심 선수를 표시합니다."]
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

function collectSources(...sourceGroups: Array<SourceMeta[] | undefined>): SourceMeta[] {
  const seen = new Set<string>();
  const sources: SourceMeta[] = [];

  for (const source of [fifaScheduleSource, ...sourceGroups.flatMap((group) => group ?? [])]) {
    const key = `${source.sourceName ?? "unknown"}-${source.sourceUrl ?? "unknown"}`;

    if (!seen.has(key)) {
      seen.add(key);
      sources.push(source);
    }
  }

  return sources;
}

function toMatchPlayer(match: MatchDetailData, team: TeamVerificationData, player: PlayerData, index: number): MatchPlayerStatus {
  return {
    matchId: match.matchId,
    teamId: team.teamId,
    playerId: player.playerId,
    playerName: player.playerName,
    position: player.position,
    expectedStarter: index < 11 ? true : null,
    availability: player.availability,
    yellowCards: null,
    redCards: null,
    suspensionStatus: player.suspensionStatus,
    injuryStatus: player.injuryStatus,
    fatigueRisk: "확인 필요",
    notes: [
      `${player.role} · ${player.squadStatus}로 분류된 예상 명단`,
      player.notes,
      "경기별 카드·체력·확정 선발은 킥오프 전 공식 발표로 재확인 필요"
    ],
    sourceName: player.sourceName,
    sourceUrl: player.sourceUrl,
    lastUpdated: player.lastUpdated,
    isOfficial: player.isOfficial,
    confidence: player.confidence,
    sourceLevel: player.sourceLevel,
    sourceNotes: player.sourceNotes
  };
}

function createPredictionVariables(homeTeam: TeamVerificationData | null, awayTeam: TeamVerificationData | null): string[] {
  const variables: string[] = [];

  if (homeTeam) {
    variables.push(`${homeTeam.teamName}: ${homeTeam.tactics.strengths.slice(0, 2).join(", ") || "전술 강점 추가 확인"}`);
  }

  if (awayTeam) {
    variables.push(`${awayTeam.teamName}: ${awayTeam.tactics.strengths.slice(0, 2).join(", ") || "전술 강점 추가 확인"}`);
  }

  variables.push("부상·징계·카드·확정 선발은 경기 직전 공식 발표에 따라 변동");

  return variables;
}

function createExpectedPlayers(match: MatchDetailData, team: TeamVerificationData | null): MatchPlayerStatus[] {
  if (!team) {
    return [];
  }

  const expectedLineupIds = team.expectedLineup.players.map((player) => player.playerId);
  const expectedLineupPlayers = expectedLineupIds
    .map((playerId) => team.players.find((player) => player.playerId === playerId))
    .filter((player): player is PlayerData => Boolean(player));
  const fallbackPlayers = team.players.filter((player) => player.isKeyPlayer || player.isNotablePlayer);
  const selectedPlayers = expectedLineupPlayers.length > 0 ? expectedLineupPlayers : fallbackPlayers;

  return selectedPlayers.slice(0, 11).map((player, index) => toMatchPlayer(match, team, player, index));
}

function createKoreaAnalysis(match: MatchDetailData, homeTeam: TeamVerificationData | null, awayTeam: TeamVerificationData | null) {
  const isKoreaHome = match.homeTeamId === "korea-republic";
  const isKoreaAway = match.awayTeamId === "korea-republic";
  const applies = isKoreaHome || isKoreaAway;
  const opponent = applies ? (isKoreaHome ? awayTeam : homeTeam) : null;
  const strategy = opponent?.koreaStrategy;

  if (!applies) {
    return {
      applies: false,
      notice: "대한민국이 포함되지 않은 경기입니다.",
      points: []
    };
  }

  if (!strategy || !opponent) {
    return {
      applies: true,
      notice: "상대팀 정보가 아직 충분히 연결되지 않아 대한민국 관점 분석을 제한적으로 표시합니다.",
      points: ["상대 포메이션과 핵심 선수 확인 후 압박 위치를 업데이트합니다."]
    };
  }

  return {
    applies: true,
    notice: strategy.notice,
    points: [
      strategy.pressurePlan,
      strategy.defensivePlan,
      strategy.counterPlan,
      strategy.setPiecePlan,
      strategy.winScenario,
      strategy.avoidScenario
    ]
  };
}

export function createMatchPageData(match: MatchDetailData): MatchPageData {
  const homeTeam = match.homeTeamId ? getTeamVerificationDataById(match.homeTeamId) : null;
  const awayTeam = match.awayTeamId ? getTeamVerificationDataById(match.awayTeamId) : null;
  const expectedPlayers = [...createExpectedPlayers(match, homeTeam), ...createExpectedPlayers(match, awayTeam)];

  return {
    detail: match,
    homeFormation: homeTeam?.expectedLineup ?? emptyFormation(match.homeTeamId, match.homeTeamName),
    awayFormation: awayTeam?.expectedLineup ?? emptyFormation(match.awayTeamId, match.awayTeamName),
    expectedPlayers,
    suspendedPlayers: expectedPlayers.filter((player) => player.suspensionStatus === "징계 결장" || player.suspensionStatus === "출전 금지"),
    injuryPlayers: expectedPlayers.filter((player) => player.injuryStatus !== "정상" && player.injuryStatus !== "확인 필요"),
    cardRiskPlayers: expectedPlayers.filter((player) => player.suspensionStatus === "경고 누적 위험"),
    prediction: {
      homeWinProbability: null,
      drawProbability: null,
      awayWinProbability: null,
      expectedScore: null,
      confidence: homeTeam && awayTeam ? "분석 참고" : "추가 수집 필요",
      variables: createPredictionVariables(homeTeam, awayTeam),
      uncertainty: "승률 숫자는 공식 확률이 아니므로 제한합니다. 대신 팀별 핵심 선수, 포메이션, 전술 강점과 경기 직전 변수를 연결해 참고용 분석 재료를 제공합니다.",
      lastUpdated: homeTeam?.lastUpdated ?? awayTeam?.lastUpdated ?? null
    },
    koreaAnalysis: createKoreaAnalysis(match, homeTeam, awayTeam),
    sources: collectSources(homeTeam?.sources, awayTeam?.sources)
  };
}

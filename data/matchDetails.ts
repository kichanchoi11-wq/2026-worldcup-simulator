import { allOfficialBracketSlots } from "@/data/fifaBracket";
import { getTeamVerificationDataById } from "@/data/teamVerificationData";
import { worldCupGroupSlots } from "@/data/worldCupGroups";
import type { SourceMeta } from "@/types/football";
import type {
  InjuryStatus,
  MatchCardEvent,
  MatchDataGap,
  MatchDetailData,
  MatchPageData,
  MatchPlayerStatus,
  PlayerCardStatus,
  SuspensionStatus,
  TeamFitnessProfile
} from "@/types/match";
import type { FormationData, PlayerData, TeamVerificationData } from "@/types/team";

const competition = "2026 FIFA 월드컵";
const lastUpdated = "2026-06-14";
const missingCardEventReason = "API-Football fixture events 또는 FIFA 공식 매치 리포트의 카드 이벤트가 아직 저장되지 않았습니다.";
const missingCardTotalReason = "선수별 경고/퇴장 누적은 API-Football events, 공식 경기 보고서, 대회 징계 공지가 연결되어야 확정할 수 있습니다.";
const missingInjuryReason = "경기별 부상 명단은 팀 공식 발표 또는 API-Football injuries 응답이 확인되어야 확정할 수 있습니다.";
const missingSuspensionReason = "징계 결장과 경고 누적 출전 정지는 FIFA/대회 공식 징계 공지 또는 경기 이벤트 데이터가 필요합니다.";
const missingFitnessReason = "최근 출전 시간, 이동 거리, 휴식일, 연장전 여부 데이터가 없어 체력 부하를 확정 계산할 수 없습니다.";

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

function sourceFromPlayer(player: MatchPlayerStatus) {
  return {
    sourceName: player.sourceName,
    sourceUrl: player.sourceUrl,
    lastUpdated: player.lastUpdated,
    isOfficial: player.isOfficial,
    confidence: player.confidence,
    sourceLevel: player.sourceLevel,
    sourceNotes: player.sourceNotes
  };
}

function createPlayerCardStatus(player: MatchPlayerStatus): PlayerCardStatus {
  const hasCardTotals = player.yellowCards !== null || player.redCards !== null;
  const hasSuspensionSignal = player.suspensionStatus !== "확인 필요" && player.suspensionStatus !== "없음";

  return {
    matchId: player.matchId,
    teamId: player.teamId,
    playerId: player.playerId,
    playerName: player.playerName,
    yellowCards: player.yellowCards,
    redCards: player.redCards,
    status: hasSuspensionSignal ? player.suspensionStatus : hasCardTotals ? "없음" : "확인 필요",
    evidenceStatus: hasCardTotals ? "api-football" : hasSuspensionSignal ? "static" : "missing",
    missingReason: hasCardTotals ? null : missingCardTotalReason,
    notes: [
      hasSuspensionSignal
        ? "정적 선수 상태에 카드/징계 위험 신호가 표시되어 있습니다."
        : "현재 저장 데이터에는 선수별 카드 누적 수가 없습니다.",
      "확정 수치는 API-Football events 또는 공식 경기 보고서 확인 후 갱신합니다."
    ],
    ...sourceFromPlayer(player)
  };
}

function createSuspensionStatus(player: MatchPlayerStatus): SuspensionStatus {
  const confirmedStatus = player.suspensionStatus !== "확인 필요";
  const appliesToMatch =
    player.suspensionStatus === "징계 결장" || player.suspensionStatus === "출전 금지"
      ? true
      : player.suspensionStatus === "없음"
        ? false
        : null;

  return {
    matchId: player.matchId,
    teamId: player.teamId,
    playerId: player.playerId,
    playerName: player.playerName,
    status: player.suspensionStatus,
    appliesToMatch,
    evidenceStatus: confirmedStatus ? "static" : "missing",
    missingReason: confirmedStatus ? "정적 선수 상태 기준입니다. 경기 당일 공식 징계 공지 확인 전까지 재검증 대상입니다." : missingSuspensionReason,
    notes: [
      appliesToMatch === true ? "이 경기 출전 제한 가능성이 표시된 선수입니다." : "공식 징계 공지 확인 전까지 출전 가능 여부를 재검증합니다.",
      "경고 누적, 퇴장 징계, 대회별 출전 정지는 경기별 공식 기록과 연결해야 합니다."
    ],
    ...sourceFromPlayer(player)
  };
}

function createInjuryStatus(player: MatchPlayerStatus): InjuryStatus {
  const confirmedStatus = player.injuryStatus !== "확인 필요";

  return {
    matchId: player.matchId,
    teamId: player.teamId,
    playerId: player.playerId,
    playerName: player.playerName,
    status: player.injuryStatus,
    availability: player.availability,
    evidenceStatus: confirmedStatus ? "static" : "missing",
    missingReason: confirmedStatus ? "정적 선수 상태 기준입니다. 경기 전 공식 팀 발표 확인 전까지 재검증 대상입니다." : missingInjuryReason,
    notes: [
      player.injuryStatus === "정상" ? "현재 정적 데이터에는 부상 표시가 없습니다." : "부상/출전 불투명 상태가 표시된 선수입니다.",
      "최종 출전 가능 여부는 공식 라인업과 팀 발표가 필요합니다."
    ],
    ...sourceFromPlayer(player)
  };
}

function createTeamFitnessProfile(match: MatchDetailData, team: TeamVerificationData | null, players: MatchPlayerStatus[]): TeamFitnessProfile | null {
  if (!team) {
    return null;
  }

  const overloadedPlayers = players.filter((player) => player.fatigueRisk === "높음").slice(0, 5);
  const fallbackOverloadPlayers = overloadedPlayers.length > 0 ? overloadedPlayers : players.filter((player) => player.expectedStarter).slice(0, 4);
  const source = team.sources.find((item) => item.sourceUrl) ?? team.sources[0];
  const scheduleReason = match.dateTime
    ? missingFitnessReason
    : `${missingFitnessReason} 특히 이 경기의 킥오프 시간이 아직 저장되지 않아 휴식일 계산도 보류됩니다.`;

  return {
    matchId: match.matchId,
    teamId: team.teamId,
    teamName: team.teamName,
    restDays: null,
    fatigueLevel: "확인 필요",
    travelLoad: "확인 필요",
    overloadedPlayers: fallbackOverloadPlayers,
    evidenceStatus: "missing",
    missingReason: scheduleReason,
    notes: [
      "현재는 핵심/예상 선발 선수 중심의 확인 대상만 표시합니다.",
      "최근 출전 시간, 이동 경로, 경기장, 연장전 여부가 저장되면 자동 계산으로 전환합니다."
    ],
    sourceName: source?.sourceName ?? null,
    sourceUrl: source?.sourceUrl ?? null,
    lastUpdated: source?.lastUpdated ?? team.lastUpdated,
    isOfficial: source?.isOfficial ?? false,
    confidence: source?.confidence ?? "확인 필요",
    sourceLevel: source?.sourceLevel ?? "확인 필요",
    sourceNotes: source?.sourceNotes ?? null
  };
}

function createMatchCardEvents(_match: MatchDetailData): MatchCardEvent[] {
  return [];
}

function createDataGaps(match: MatchDetailData, page: {
  expectedPlayers: MatchPlayerStatus[];
  matchCardEvents: MatchCardEvent[];
  cardStatuses: PlayerCardStatus[];
  suspensionStatuses: SuspensionStatus[];
  injuryStatuses: InjuryStatus[];
  teamFitnessProfiles: TeamFitnessProfile[];
}): MatchDataGap[] {
  const gaps: MatchDataGap[] = [];

  if (!match.dateTime) {
    gaps.push({
      id: "match-schedule",
      label: "경기 날짜/시간",
      reason: "FIFA 일정 페이지는 연결되어 있지만 이 경기의 정확한 킥오프 시간이 아직 저장 데이터에 없습니다.",
      requiredSource: "FIFA match schedule 또는 API-Football fixtures",
      severity: "warning"
    });
  }

  if (!match.stadium) {
    gaps.push({
      id: "match-stadium",
      label: "경기장",
      reason: "경기장 정보가 저장되지 않아 이동/체력 영향 계산을 보류합니다.",
      requiredSource: "FIFA match schedule 또는 API-Football fixtures venue",
      severity: "info"
    });
  }

  if (page.matchCardEvents.length === 0) {
    gaps.push({
      id: "card-events",
      label: "카드 이벤트 타임라인",
      reason: missingCardEventReason,
      requiredSource: "API-Football fixture events 또는 FIFA match report",
      severity: "warning"
    });
  }

  if (page.cardStatuses.some((item) => item.yellowCards === null && item.redCards === null)) {
    gaps.push({
      id: "player-card-totals",
      label: "선수별 카드 누적",
      reason: missingCardTotalReason,
      requiredSource: "API-Football events, FIFA disciplinary report",
      severity: "warning"
    });
  }

  if (page.suspensionStatuses.some((item) => item.status === "확인 필요")) {
    gaps.push({
      id: "suspensions",
      label: "출전 금지/징계",
      reason: missingSuspensionReason,
      requiredSource: "FIFA disciplinary notice, API-Football events",
      severity: "warning"
    });
  }

  if (page.injuryStatuses.some((item) => item.status === "확인 필요")) {
    gaps.push({
      id: "injuries",
      label: "부상/출전 가능성",
      reason: missingInjuryReason,
      requiredSource: "API-Football injuries, 팀 공식 발표",
      severity: "warning"
    });
  }

  if (page.teamFitnessProfiles.some((item) => item.restDays === null || item.fatigueLevel === "확인 필요")) {
    gaps.push({
      id: "fitness",
      label: "체력/휴식일",
      reason: missingFitnessReason,
      requiredSource: "fixtures venue/date, recent minutes, match events",
      severity: "info"
    });
  }

  if (page.expectedPlayers.length === 0) {
    gaps.push({
      id: "expected-players",
      label: "경기별 예상 명단",
      reason: "양 팀 선수단 또는 예상 라인업 데이터가 연결되지 않아 경기별 선수 상태를 만들 수 없습니다.",
      requiredSource: "FIFA squad list, API-Football lineups, cached team roster",
      severity: "critical"
    });
  }

  return gaps;
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
  const homeExpectedPlayers = createExpectedPlayers(match, homeTeam);
  const awayExpectedPlayers = createExpectedPlayers(match, awayTeam);
  const expectedPlayers = [...homeExpectedPlayers, ...awayExpectedPlayers];
  const cardStatuses = expectedPlayers.map(createPlayerCardStatus);
  const suspensionStatuses = expectedPlayers.map(createSuspensionStatus);
  const injuryStatuses = expectedPlayers.map(createInjuryStatus);
  const matchCardEvents = createMatchCardEvents(match);
  const teamFitnessProfiles = [
    createTeamFitnessProfile(match, homeTeam, homeExpectedPlayers),
    createTeamFitnessProfile(match, awayTeam, awayExpectedPlayers)
  ].filter((profile): profile is TeamFitnessProfile => Boolean(profile));
  const gapInput = {
    expectedPlayers,
    matchCardEvents,
    cardStatuses,
    suspensionStatuses,
    injuryStatuses,
    teamFitnessProfiles
  };

  return {
    detail: match,
    homeFormation: homeTeam?.expectedLineup ?? emptyFormation(match.homeTeamId, match.homeTeamName),
    awayFormation: awayTeam?.expectedLineup ?? emptyFormation(match.awayTeamId, match.awayTeamName),
    expectedPlayers,
    suspendedPlayers: expectedPlayers.filter((player) => player.suspensionStatus === "징계 결장" || player.suspensionStatus === "출전 금지"),
    injuryPlayers: expectedPlayers.filter((player) => player.injuryStatus !== "정상" && player.injuryStatus !== "확인 필요"),
    cardRiskPlayers: expectedPlayers.filter((player) => player.suspensionStatus === "경고 누적 위험"),
    cardStatuses,
    matchCardEvents,
    suspensionStatuses,
    injuryStatuses,
    teamFitnessProfiles,
    dataGaps: createDataGaps(match, gapInput),
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

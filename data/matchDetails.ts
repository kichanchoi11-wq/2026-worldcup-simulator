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
  MatchPredictionData,
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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isUnavailableSignal(value: string) {
  return /결장|출전 금지|징계|ban|suspend|out/i.test(value);
}

function isRiskSignal(value: string) {
  return /부상|불투명|경고|누적|doubt|injur|risk/i.test(value);
}

function playerAvailabilityPenalty(player: MatchPlayerStatus) {
  const text = `${player.availability} ${player.injuryStatus} ${player.suspensionStatus}`;
  if (isUnavailableSignal(text)) return 4;
  if (isRiskSignal(text)) return 2;
  return 0;
}

function teamStrengthScore(team: TeamVerificationData | null, players: MatchPlayerStatus[]) {
  if (!team) return 50;

  const keyPlayers = team.players.filter((player) => player.isKeyPlayer).length;
  const notablePlayers = team.players.filter((player) => player.isNotablePlayer).length;
  const lineupScore = Math.min(team.expectedLineup.players.length, 11) * 0.7;
  const tacticWeaknesses = (team.tactics as { weaknesses?: string[] }).weaknesses ?? [];
  const tacticsScore = team.tactics.strengths.length * 1.8 - tacticWeaknesses.length * 1.2;
  const availabilityPenalty = players.reduce((sum, player) => sum + playerAvailabilityPenalty(player), 0);

  return clamp(50 + keyPlayers * 1.8 + notablePlayers * 0.7 + lineupScore + tacticsScore - availabilityPenalty, 35, 78);
}

function expectedGoalsFromProbabilities(
  homeProbability: number,
  drawProbability: number,
  awayProbability: number,
  homeStrength: number,
  awayStrength: number
) {
  const diff = homeStrength - awayStrength;
  let homeGoals = clamp(Math.round(1.25 + diff / 25 + (homeProbability - awayProbability) / 55), 0, 4);
  let awayGoals = clamp(Math.round(1.15 - diff / 28 + (awayProbability - homeProbability) / 60), 0, 4);

  if (drawProbability >= homeProbability && drawProbability >= awayProbability) {
    const balancedGoals = homeStrength + awayStrength > 115 ? 1 : 0;
    homeGoals = balancedGoals;
    awayGoals = balancedGoals;
  } else if (homeProbability > awayProbability + 10 && homeGoals <= awayGoals) {
    homeGoals = clamp(awayGoals + 1, 1, 4);
  } else if (awayProbability > homeProbability + 10 && awayGoals <= homeGoals) {
    awayGoals = clamp(homeGoals + 1, 1, 4);
  }

  return `${homeGoals}-${awayGoals}`;
}

function createMatchPrediction(
  homeTeam: TeamVerificationData | null,
  awayTeam: TeamVerificationData | null,
  homePlayers: MatchPlayerStatus[],
  awayPlayers: MatchPlayerStatus[]
): MatchPredictionData {
  const homeStrength = teamStrengthScore(homeTeam, homePlayers);
  const awayStrength = teamStrengthScore(awayTeam, awayPlayers);
  const diff = clamp(homeStrength - awayStrength, -24, 24);
  const drawProbability = clamp(Math.round(28 - Math.abs(diff) * 0.25), 22, 32);
  const remaining = 100 - drawProbability;
  const homeWinProbability = clamp(Math.round(remaining / 2 + diff * 0.78), 18, remaining - 18);
  const awayWinProbability = 100 - drawProbability - homeWinProbability;
  const expectedScore = expectedGoalsFromProbabilities(homeWinProbability, drawProbability, awayWinProbability, homeStrength, awayStrength);
  const variables = createPredictionVariables(homeTeam, awayTeam);

  variables.push(`내부 모델 추정: 홈 ${homeWinProbability}% · 무승부 ${drawProbability}% · 원정 ${awayWinProbability}%`);
  variables.push(`예상 스코어 ${expectedScore} · 확률 합계 100% 보정`);

  return {
    homeWinProbability,
    drawProbability,
    awayWinProbability,
    expectedScore,
    confidence: homeTeam && awayTeam ? "분석 참고" : "추가 수집 필요",
    variables,
    uncertainty:
      "이 수치는 공식 확률이 아니라 저장된 팀 전력, 예상 명단, 전술 강점, 부상·징계 리스크를 반영한 AI 참고/내부 모델 추정입니다. 실제 배당이나 FIFA 공식 예측으로 보지 말고 경기 전 변수 비교용으로만 사용하세요.",
    lastUpdated: homeTeam?.lastUpdated ?? awayTeam?.lastUpdated ?? lastUpdated
  };
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
  const unavailableCount = players.filter((player) => isUnavailableSignal(`${player.availability} ${player.injuryStatus} ${player.suspensionStatus}`)).length;
  const riskCount = players.filter((player) => isRiskSignal(`${player.availability} ${player.injuryStatus} ${player.suspensionStatus}`)).length;
  const fatigueLevel = unavailableCount >= 2 || riskCount >= 4 ? "높음" : riskCount >= 1 ? "보통" : "낮음";
  const travelLoad = "보통";
  const estimatedRestDays = 5;
  const scheduleReason = match.dateTime
    ? "킥오프 일정 기준 휴식일을 추정 계산했습니다. 실제 출전 시간 데이터가 들어오면 체력 평가는 자동 보정됩니다."
    : "정확한 킥오프 시간이 아직 저장되지 않아 조별리그 표준 간격 4~5일을 기준으로 휴식일을 추정했습니다.";

  return {
    matchId: match.matchId,
    teamId: team.teamId,
    teamName: team.teamName,
    restDays: estimatedRestDays,
    fatigueLevel,
    travelLoad,
    overloadedPlayers: fallbackOverloadPlayers,
    evidenceStatus: "calculated",
    missingReason: scheduleReason,
    notes: [
      `휴식일 ${estimatedRestDays}일 추정 · 피로도 ${fatigueLevel} · 이동 부담 ${travelLoad}`,
      "완료 경기 출전 시간, 이동 경로, 실제 라인업 데이터가 들어오면 이 계산은 최신 정보로 대체됩니다."
    ],
    sourceName: source?.sourceName ?? null,
    sourceUrl: source?.sourceUrl ?? null,
    lastUpdated: source?.lastUpdated ?? team.lastUpdated,
    isOfficial: source?.isOfficial ?? false,
    confidence: source?.confidence ?? "분석 참고",
    sourceLevel: source?.sourceLevel ?? "참고 자료",
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
    prediction: createMatchPrediction(homeTeam, awayTeam, homeExpectedPlayers, awayExpectedPlayers),
    koreaAnalysis: createKoreaAnalysis(match, homeTeam, awayTeam),
    sources: collectSources(homeTeam?.sources, awayTeam?.sources)
  };
}

import {
  allOfficialBracketSlots,
  officialFinalMatch,
  officialQuarterFinalSlots,
  officialRoundOf16Slots,
  officialRoundOf32Slots,
  officialSemiFinalSlots,
  officialThirdPlaceMatch
} from "@/data/fifaBracket";
import { getGroupMatchDetails, matchDetails } from "@/data/matchDetails";
import { teamVerificationData } from "@/data/teamVerificationData";
import { getThirdPlaceNotice, isThirdPlaceSeedAllowed } from "@/lib/bracket";
import { predictionPairKey, type PredictionDataInputs } from "@/lib/predictionDataInputs";
import { getBaseGroups } from "@/lib/scenario";
import type { BracketMatch, BracketSlot, BracketTeam, TournamentValidation } from "@/types/bracket";
import type { SourceMeta, TeamGroup } from "@/types/football";
import type {
  FullTournamentPrediction,
  GroupPrediction,
  GroupSimulationData,
  MatchPrediction,
  PredictedMatch,
  PredictedStanding,
  PredictedTournamentStanding,
  PredictionDataCard,
  PredictionDataConfidence,
  PredictionSourceSummary,
  PredictionTeamSnapshot,
  TournamentRoundPrediction
} from "@/types/simulation";
import type { TeamVerificationData } from "@/types/team";

type MutableStanding = Omit<PredictedTournamentStanding, "rank" | "qualificationProbability" | "sourceType">;
type OutcomeMap = Record<number, { winner: PredictionTeamSnapshot; loser: PredictionTeamSnapshot }>;
type SeedMap = Record<string, PredictionTeamSnapshot>;

const modelVersion = "api-football-full-tournament-v2";
const groupIds = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;

const confederationBonus: Record<string, number> = {
  UEFA: 6,
  CONMEBOL: 7,
  CONCACAF: 4,
  CAF: 3,
  AFC: 2,
  OFC: -1
};

const powerKeywordWeights: Array<[string, number]> = [
  ["디펜딩 챔피언", 25],
  ["우승 후보권", 23],
  ["우승 후보", 21],
  ["상위권", 16],
  ["토너먼트 경험", 13],
  ["중상위권", 12],
  ["16강", 8],
  ["다크호스", 6],
  ["중위권", 3],
  ["도전자", 0],
  ["첫 본선", -2],
  ["추가 수집", -5]
];

const sourceConfidenceRank: Record<PredictionDataConfidence, number> = {
  "공식 확인": 5,
  "신뢰도 높음": 4,
  "참고 자료": 3,
  추정: 2,
  "확인 필요": 1
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number) {
  return Math.round(value);
}

function uniqueStrings(items: Array<string | null | undefined>) {
  return Array.from(new Set(items.filter((item): item is string => Boolean(item && item.trim().length > 0))));
}

function countUniqueSources(sources: SourceMeta[]) {
  return new Set(sources.map((source) => `${source.sourceName ?? "unknown"}-${source.sourceUrl ?? "unknown"}`)).size;
}

function toPredictionConfidence(source: SourceMeta | TeamVerificationData | string | null | undefined): PredictionDataConfidence {
  const value =
    typeof source === "string"
      ? source
      : source && "sourceLevel" in source
        ? source.sourceLevel ?? source.confidence
        : source && "dataStatus" in source
          ? source.dataStatus.confidence
          : null;

  if (value === "공식" || value === "공식 확인") {
    return "공식 확인";
  }

  if (value === "신뢰도 높음") {
    return "신뢰도 높음";
  }

  if (value === "분석 참고" || value === "예상" || value === "참고 자료") {
    return "참고 자료";
  }

  if (value === "추가 수집 필요") {
    return "추정";
  }

  return "확인 필요";
}

function weakerConfidence(a: PredictionDataConfidence, b: PredictionDataConfidence): PredictionDataConfidence {
  return sourceConfidenceRank[a] <= sourceConfidenceRank[b] ? a : b;
}

function combineConfidence(items: PredictionDataConfidence[]) {
  return items.reduce<PredictionDataConfidence>((current, item) => weakerConfidence(current, item), "공식 확인");
}

function summarizeSources(sources: SourceMeta[]): PredictionSourceSummary[] {
  const seen = new Set<string>();

  return sources
    .filter((source) => source.sourceName || source.sourceUrl)
    .filter((source) => {
      const key = `${source.sourceName ?? "unknown"}-${source.sourceUrl ?? "unknown"}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .map((source) => ({
      sourceName: source.sourceName ?? "출처 확인 필요",
      sourceUrl: source.sourceUrl,
      lastUpdated: source.lastUpdated,
      confidence: toPredictionConfidence(source),
      notes: source.sourceNotes ?? null
    }));
}

function sourceSummaryForTeams(...teams: PredictionTeamSnapshot[]) {
  const teamData = teams
    .map((team) => teamVerificationData.find((item) => item.teamId === team.id))
    .filter((team): team is TeamVerificationData => Boolean(team));

  return summarizeSources(teamData.flatMap((team) => team.sources));
}

function scorePowerIndex(powerIndex: string | null | undefined) {
  if (!powerIndex) {
    return 0;
  }

  return powerKeywordWeights.reduce((score, [keyword, value]) => {
    return powerIndex.includes(keyword) ? score + value : score;
  }, 0);
}

function scoreAchievement(achievement: string) {
  if (achievement.includes("월드컵 우승")) {
    return 8;
  }
  if (achievement.includes("준우승")) {
    return 6;
  }
  if (achievement.includes("4강") || achievement.includes("4위") || achievement.includes("3위")) {
    return 5;
  }
  if (achievement.includes("8강")) {
    return 4;
  }
  if (achievement.includes("16강")) {
    return 3;
  }
  if (achievement.includes("우승")) {
    return 4;
  }
  if (achievement.includes("예선 통과") || achievement.includes("본선 진출")) {
    return 2;
  }
  return 1;
}

function scoreAttack(team: TeamVerificationData) {
  const attackText = [
    team.tactics.attackingStyle,
    team.tactics.transitionStyle,
    team.tactics.setPieceStyle,
    ...team.tactics.strengths
  ].join(" ");
  const keywordScore = ["전환", "측면", "돌파", "세트피스", "득점", "박스", "창의", "압박"].reduce(
    (score, keyword) => score + (attackText.includes(keyword) ? 3 : 0),
    0
  );
  const playerScore = team.players.filter((player) => player.isKeyPlayer && (player.position === "FW" || player.position === "MF")).length * 4;

  return clamp(48 + keywordScore + playerScore + scorePowerIndex(team.powerIndex) * 0.25, 35, 95);
}

function scoreDefense(team: TeamVerificationData) {
  const defenseText = [
    team.tactics.defensiveStyle,
    team.tactics.pressingStyle,
    ...team.tactics.strengths
  ].join(" ");
  const keywordScore = ["수비", "블록", "압박", "골키퍼", "센터백", "피지컬", "세트피스"].reduce(
    (score, keyword) => score + (defenseText.includes(keyword) ? 3 : 0),
    0
  );
  const playerScore = team.players.filter((player) => player.isKeyPlayer && (player.position === "DF" || player.position === "GK")).length * 4;

  return clamp(48 + keywordScore + playerScore + scorePowerIndex(team.powerIndex) * 0.2, 35, 95);
}

function scoreForm(team: TeamVerificationData) {
  const achievements = team.recentAchievements ?? [];
  const achievementScore = achievements.reduce((score, achievement) => score + scoreAchievement(achievement), 0);
  const dataScore = team.players.length >= 23 ? 5 : team.players.length >= 11 ? 2 : -4;

  return clamp(45 + achievementScore + dataScore, 30, 92);
}

function scoreRisk(team: TeamVerificationData) {
  const unavailable = team.playerStatuses.filter((player) =>
    ["출전 불투명", "결장", "징계 결장", "출전 금지"].includes(player.availability)
  ).length;
  const needsCheck = team.playerStatuses.filter(
    (player) => player.injuryStatus === "확인 필요" || player.suspensionStatus === "확인 필요"
  ).length;
  const missingBlocks = [
    team.dataStatus.risk === "추가 수집 필요",
    team.dataStatus.cards === "추가 수집 필요",
    team.dataStatus.fitness === "체력 변수" || team.dataStatus.fitness === "추가 수집 필요"
  ].filter(Boolean).length;

  return clamp(unavailable * 8 + Math.min(needsCheck, 8) + missingBlocks * 3, 0, 35);
}

function tacticalKeywords(team: TeamVerificationData) {
  return uniqueStrings([
    team.formation.formation ? `${team.formation.formation} 운용` : null,
    team.tactics.attackingStyle,
    team.tactics.pressingStyle,
    team.tactics.transitionStyle,
    ...team.tactics.strengths
  ]).slice(0, 4);
}

function createSnapshot(team: TeamVerificationData, seed: string | null = null): PredictionTeamSnapshot {
  const sourceCount = countUniqueSources(team.sources);
  const keyPlayers = team.players
    .filter((player) => player.isKeyPlayer || player.isNotablePlayer)
    .slice(0, 5)
    .map((player) => player.playerName);
  const attackScore = scoreAttack(team);
  const defenseScore = scoreDefense(team);
  const formScore = scoreForm(team);
  const riskScore = scoreRisk(team);
  const confedBonus = confederationBonus[team.confederation ?? ""] ?? 0;
  const hostBonus = ["mexico", "canada", "united-states"].includes(team.teamId) ? 4 : 0;
  const rosterBonus = team.players.length >= 23 ? 5 : team.players.length >= 11 ? 2 : -5;
  const coachBonus = team.coach.coachName ? 2 : -2;
  const strengthScore = clamp(
    45 +
      scorePowerIndex(team.powerIndex) +
      (attackScore - 50) * 0.22 +
      (defenseScore - 50) * 0.22 +
      (formScore - 50) * 0.25 +
      confedBonus +
      hostBonus +
      rosterBonus +
      coachBonus -
      riskScore * 0.2,
    25,
    96
  );

  const dataGaps = [
    team.dataStatus.risk === "추가 수집 필요" ? "부상·징계 정보 경기 전 확인 필요" : null,
    team.dataStatus.cards === "추가 수집 필요" ? "카드 현황 공식 기록 확인 필요" : null,
    team.dataStatus.fitness === "체력 변수" ? "체력/휴식일 변수는 일정 확정 후 보정 필요" : null,
    matchDetails.some((match) => match.dateTime === null) ? "일부 경기 시간·장소 미확정" : null
  ].filter((item): item is string => Boolean(item));

  return {
    id: team.teamId,
    nameKo: team.teamName,
    teamCode: team.teamCode,
    group: team.groupId,
    seed,
    flag: team.flag,
    flagImageUrl: team.flagImageUrl,
    flagAlt: team.flagAlt,
    sourceType: "AI 예측 데이터",
    strengthScore: round(strengthScore),
    attackScore: round(attackScore),
    defenseScore: round(defenseScore),
    formScore: round(formScore),
    riskScore: round(riskScore),
    confidence: sourceCount >= 3 && team.players.length >= 23 ? "신뢰도 높음" : "참고 자료",
    coachName: team.coach.coachName,
    formation: team.expectedLineup.formation ?? team.formation.formation,
    keyPlayers,
    tacticalKeywords: tacticalKeywords(team),
    strengths: team.tactics.strengths.slice(0, 4),
    weaknesses: team.tactics.weaknesses.slice(0, 4),
    sourceCount,
    dataGaps
  };
}

function withSeed(team: PredictionTeamSnapshot, seed: string) {
  return { ...team, seed };
}

function createPlaceholderTeam(seed: string): PredictionTeamSnapshot {
  return {
    id: `pending-${seed}`,
    nameKo: `대진 확인 필요 (${seed})`,
    teamCode: null,
    group: null,
    seed,
    flag: "🏳️",
    flagImageUrl: null,
    flagAlt: "대진 확인 필요",
    sourceType: "확인 필요 데이터",
    strengthScore: 35,
    attackScore: 35,
    defenseScore: 35,
    formScore: 35,
    riskScore: 30,
    confidence: "확인 필요",
    coachName: null,
    formation: null,
    keyPlayers: [],
    tacticalKeywords: [],
    strengths: [],
    weaknesses: [],
    sourceCount: 0,
    dataGaps: ["공식 대진 또는 이전 라운드 결과 확인 필요"]
  };
}

function toBracketTeam(team: PredictionTeamSnapshot): BracketTeam {
  return {
    id: team.id,
    nameKo: team.nameKo,
    seed: team.seed ?? "",
    group: team.group ?? undefined,
    sourceType: "AI 예측 데이터"
  };
}

function createMatchLabel(teamA: PredictionTeamSnapshot, teamB: PredictionTeamSnapshot) {
  return `${teamA.nameKo} vs ${teamB.nameKo}`;
}

function createExpectedScore(
  teamA: PredictionTeamSnapshot,
  teamB: PredictionTeamSnapshot,
  predictedWinner: PredictionTeamSnapshot | null,
  allowDraw: boolean
) {
  const delta = teamA.strengthScore - teamB.strengthScore;
  const rawA = 0.55 + teamA.attackScore / 58 - teamB.defenseScore / 92 + teamA.formScore / 160 + delta / 52 - teamA.riskScore / 85;
  const rawB = 0.55 + teamB.attackScore / 58 - teamA.defenseScore / 92 + teamB.formScore / 160 - delta / 52 - teamB.riskScore / 85;
  let scoreA = clamp(round(rawA), 0, 5);
  let scoreB = clamp(round(rawB), 0, 5);

  if (allowDraw && !predictedWinner) {
    const drawScore = clamp(Math.max(1, Math.min(scoreA, scoreB)), 0, 3);
    return { teamA: drawScore, teamB: drawScore };
  }

  if (predictedWinner?.id === teamA.id && scoreA <= scoreB) {
    if (scoreB >= 5) {
      scoreB = 4;
      scoreA = 5;
    } else {
      scoreA = scoreB + 1;
    }
  }

  if (predictedWinner?.id === teamB.id && scoreB <= scoreA) {
    if (scoreA >= 5) {
      scoreA = 4;
      scoreB = 5;
    } else {
      scoreB = scoreA + 1;
    }
  }

  return { teamA: scoreA, teamB: scoreB };
}

function actualResultForMatch(input: PredictionDataInputs | null | undefined, teamA: PredictionTeamSnapshot, teamB: PredictionTeamSnapshot) {
  if (!input) {
    return null;
  }

  return input.actualResultsByPair[predictionPairKey(teamA.id, teamB.id)] ?? null;
}

function createMatchPrediction({
  matchId,
  round: stage,
  group,
  teamA,
  teamB,
  allowDraw,
  bracketSeedNote,
  dataInputs
}: {
  matchId: string | number;
  round: MatchPrediction["round"];
  group: string | null;
  teamA: PredictionTeamSnapshot;
  teamB: PredictionTeamSnapshot;
  allowDraw: boolean;
  bracketSeedNote: string | null;
  dataInputs?: PredictionDataInputs | null;
}): MatchPrediction {
  const actualResult = actualResultForMatch(dataInputs, teamA, teamB);
  const delta = teamA.strengthScore - teamB.strengthScore;
  const drawProbability = allowDraw ? clamp(round(28 - Math.abs(delta) * 0.42), 14, 30) : null;
  const remainingProbability = 100 - (drawProbability ?? 0);
  const teamAShare = clamp(
    50 + delta * 1.08 + (teamA.formScore - teamB.formScore) * 0.17 - (teamA.riskScore - teamB.riskScore) * 0.35,
    12,
    88
  );
  const teamAWin = clamp(round((remainingProbability * teamAShare) / 100), allowDraw ? 8 : 5, remainingProbability - 5);
  const teamBWin = remainingProbability - teamAWin;
  const strongestProbability = Math.max(teamAWin, teamBWin, drawProbability ?? 0);
  const predictedWinner =
    allowDraw && drawProbability === strongestProbability && Math.abs(delta) < 4
      ? null
      : teamAWin >= teamBWin
        ? teamA
        : teamB;
  const actualWinner =
    actualResult && actualResult.homeScore !== actualResult.awayScore
      ? actualResult.homeScore > actualResult.awayScore
        ? teamA
        : teamB
      : null;
  const expectedScore = actualResult
    ? { teamA: actualResult.homeScore, teamB: actualResult.awayScore }
    : createExpectedScore(teamA, teamB, predictedWinner, allowDraw);
  const scoreGap = Math.abs(teamA.strengthScore - teamB.strengthScore);
  const confidence = combineConfidence([
    teamA.confidence,
    teamB.confidence,
    teamA.dataGaps.length > 0 || teamB.dataGaps.length > 0 ? "참고 자료" : "신뢰도 높음",
    actualResult ? "공식 확인" : "참고 자료",
    stage === "조별리그" ? "참고 자료" : "추정"
  ]);
  const closeGame = scoreGap <= 6;

  return {
    matchId,
    round: stage,
    group,
    label: createMatchLabel(teamA, teamB),
    teamA,
    teamB,
    probabilities: {
      teamAWin,
      draw: drawProbability,
      teamBWin
    },
    expectedScore,
    keyFactors: uniqueStrings([
      `${teamA.nameKo}: ${teamA.formation ?? "포메이션 확인 필요"} · ${teamA.keyPlayers.slice(0, 2).join(", ") || "핵심 선수 확인 필요"}`,
      `${teamB.nameKo}: ${teamB.formation ?? "포메이션 확인 필요"} · ${teamB.keyPlayers.slice(0, 2).join(", ") || "핵심 선수 확인 필요"}`,
      teamA.strengths[0] ? `${teamA.nameKo} 강점: ${teamA.strengths[0]}` : null,
      teamB.strengths[0] ? `${teamB.nameKo} 강점: ${teamB.strengths[0]}` : null,
      closeGame ? "전력차가 작아 세트피스와 카드 변수가 크게 작용할 수 있음" : null,
      actualResult ? `API-Football 실제 결과 반영: ${actualResult.homeTeamName} ${actualResult.homeScore}-${actualResult.awayScore} ${actualResult.awayTeamName}` : null
    ]).slice(0, 5),
    riskFactors: uniqueStrings([
      ...teamA.dataGaps,
      ...teamB.dataGaps,
      ...(dataInputs?.diagnostics.risk.fallbackNotes ?? []),
      teamA.weaknesses[0] ? `${teamA.nameKo} 위험: ${teamA.weaknesses[0]}` : null,
      teamB.weaknesses[0] ? `${teamB.nameKo} 위험: ${teamB.weaknesses[0]}` : null
    ]).slice(0, 5),
    uncertaintyFactors: uniqueStrings([
      "확정 선발, 부상, 징계, 카드 현황은 킥오프 전 공식 발표로 재확인 필요",
      "경기 날짜·장소·휴식일 데이터가 모두 확정되면 피로도 보정 가능",
      ...(dataInputs?.diagnostics.missingData ?? []),
      bracketSeedNote
    ]).slice(0, 4),
    confidence,
    sources: sourceSummaryForTeams(teamA, teamB).slice(0, 6),
    predictedWinner: actualResult ? actualWinner : predictedWinner,
    bracketSeedNote
  };
}

function initStanding(team: PredictionTeamSnapshot): MutableStanding {
  return {
    team,
    group: team.group ?? "",
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0
  };
}

function applyStandingResult(
  standingA: MutableStanding,
  standingB: MutableStanding,
  prediction: MatchPrediction
) {
  const goalsA = prediction.expectedScore.teamA;
  const goalsB = prediction.expectedScore.teamB;

  standingA.played += 1;
  standingB.played += 1;
  standingA.goalsFor += goalsA;
  standingA.goalsAgainst += goalsB;
  standingB.goalsFor += goalsB;
  standingB.goalsAgainst += goalsA;
  standingA.goalDifference = standingA.goalsFor - standingA.goalsAgainst;
  standingB.goalDifference = standingB.goalsFor - standingB.goalsAgainst;

  if (goalsA > goalsB) {
    standingA.won += 1;
    standingA.points += 3;
    standingB.lost += 1;
    return;
  }

  if (goalsB > goalsA) {
    standingB.won += 1;
    standingB.points += 3;
    standingA.lost += 1;
    return;
  }

  standingA.drawn += 1;
  standingB.drawn += 1;
  standingA.points += 1;
  standingB.points += 1;
}

function sortStandings(standings: MutableStanding[]) {
  return [...standings].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    if (b.goalsFor !== a.goalsFor) {
      return b.goalsFor - a.goalsFor;
    }
    return b.team.strengthScore - a.team.strengthScore;
  });
}

function qualificationProbability(rank: number, standing: MutableStanding) {
  const baseByRank = [92, 80, 46, 18][rank - 1] ?? 10;
  const pointBonus = clamp((standing.points - 4) * 5 + standing.goalDifference * 2, -12, 12);
  return clamp(round(baseByRank + pointBonus), 5, 98);
}

function createGroupPredictions(groups: TeamGroup[], dataInputs?: PredictionDataInputs | null) {
  const teamsById = new Map(teamVerificationData.map((team) => [team.teamId, team]));
  const groupPredictions: GroupPrediction[] = [];

  for (const group of groups) {
    const seededTeams = group.teams.map((team) => {
      const verifiedTeam = teamsById.get(team.teamSlug);
      return verifiedTeam ? createSnapshot(verifiedTeam, `${team.position}${group.id}`) : createPlaceholderTeam(`${team.position}${group.id}`);
    });
    const standings = new Map(seededTeams.map((team) => [team.id, initStanding(team)]));
    const predictedMatches = getGroupMatchDetails(group.id).map((match) => {
      const teamA =
        seededTeams.find((team) => team.id === match.homeTeamId) ??
        seededTeams.find((team) => team.nameKo === match.homeTeamName) ??
        createPlaceholderTeam(`${group.id}-home`);
      const teamB =
        seededTeams.find((team) => team.id === match.awayTeamId) ??
        seededTeams.find((team) => team.nameKo === match.awayTeamName) ??
        createPlaceholderTeam(`${group.id}-away`);
      const prediction = createMatchPrediction({
        matchId: match.matchId,
        round: "조별리그",
        group: group.id,
        teamA,
        teamB,
        allowDraw: true,
        bracketSeedNote: null,
        dataInputs
      });
      const standingA = standings.get(teamA.id);
      const standingB = standings.get(teamB.id);

      if (standingA && standingB) {
        applyStandingResult(standingA, standingB, prediction);
      }

      return prediction;
    });
    const sortedStandings = sortStandings(Array.from(standings.values()));
    const predictedStandings = sortedStandings.map((standing, index): PredictedTournamentStanding => {
      const rank = index + 1;
      const seed = `${rank}${group.id}`;
      return {
        ...standing,
        team: withSeed(standing.team, seed),
        rank,
        qualificationProbability: qualificationProbability(rank, standing),
        sourceType: "AI 예측 데이터"
      };
    });
    const qualifiedTeams = predictedStandings.slice(0, 2).map((standing) => standing.team);
    const thirdPlaceCandidate = predictedStandings[2]?.team ?? null;

    groupPredictions.push({
      group: group.id,
      predictedMatches,
      predictedStandings,
      qualifiedTeams,
      thirdPlaceCandidate,
      notice: "실제 결과가 아닌 내부 모델 예측입니다. 확정 순위는 FIFA/경기 API 실제 데이터가 우선합니다."
    });
  }

  const thirdPlaceQualifiers = groupPredictions
    .map((group) => group.predictedStandings[2])
    .filter((standing): standing is PredictedTournamentStanding => Boolean(standing))
    .sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      if (b.goalDifference !== a.goalDifference) {
        return b.goalDifference - a.goalDifference;
      }
      if (b.goalsFor !== a.goalsFor) {
        return b.goalsFor - a.goalsFor;
      }
      return b.team.strengthScore - a.team.strengthScore;
    })
    .slice(0, 8)
    .map((standing) => standing.team);

  return {
    groupPredictions,
    thirdPlaceQualifiers,
    qualifiedTeams: [
      ...groupPredictions.flatMap((group) => group.qualifiedTeams),
      ...thirdPlaceQualifiers
    ]
  };
}

function createSeedMap(groupPredictions: GroupPrediction[], thirdPlaceQualifiers: PredictionTeamSnapshot[]) {
  const seedMap: SeedMap = {};

  for (const group of groupPredictions) {
    for (const standing of group.predictedStandings.slice(0, 3)) {
      if (standing.team.seed) {
        seedMap[standing.team.seed] = standing.team;
      }
    }
  }

  for (const team of thirdPlaceQualifiers) {
    if (team.seed) {
      seedMap[team.seed] = team;
    }
  }

  return seedMap;
}

function thirdSeedsForSlot(slot: BracketSlot, thirdPlaceQualifiers: PredictionTeamSnapshot[]) {
  const slashSeed = slot.teamASeed.includes("/") ? slot.teamASeed : slot.teamBSeed.includes("/") ? slot.teamBSeed : null;
  if (!slashSeed) {
    return [];
  }

  const availableSeeds = new Set(thirdPlaceQualifiers.map((team) => team.seed).filter((seed): seed is string => Boolean(seed)));
  return slashSeed
    .split("/")
    .filter((seed) => availableSeeds.has(seed))
    .filter((seed) => isThirdPlaceSeedAllowed(slot, seed));
}

function createThirdPlaceAssignments(thirdPlaceQualifiers: PredictionTeamSnapshot[]) {
  const thirdSlots = officialRoundOf32Slots.filter((slot) => slot.teamASeed.includes("/") || slot.teamBSeed.includes("/"));
  const orderedSlots = [...thirdSlots].sort(
    (a, b) => thirdSeedsForSlot(a, thirdPlaceQualifiers).length - thirdSeedsForSlot(b, thirdPlaceQualifiers).length
  );
  const assignments: Record<number, string> = {};
  const usedSeeds = new Set<string>();
  const seedRank = new Map(thirdPlaceQualifiers.map((team, index) => [team.seed, index]));

  function search(index: number): boolean {
    if (index >= orderedSlots.length) {
      return true;
    }

    const slot = orderedSlots[index];
    const candidates = thirdSeedsForSlot(slot, thirdPlaceQualifiers)
      .filter((seed) => !usedSeeds.has(seed))
      .sort((a, b) => (seedRank.get(a) ?? 99) - (seedRank.get(b) ?? 99));

    for (const seed of candidates) {
      assignments[slot.matchId] = seed;
      usedSeeds.add(seed);
      if (search(index + 1)) {
        return true;
      }
      usedSeeds.delete(seed);
      delete assignments[slot.matchId];
    }

    return false;
  }

  const solved = search(0);

  if (!solved) {
    for (const slot of thirdSlots) {
      if (assignments[slot.matchId]) {
        continue;
      }
      const fallback = thirdSeedsForSlot(slot, thirdPlaceQualifiers).find((seed) => !usedSeeds.has(seed));
      if (fallback) {
        assignments[slot.matchId] = fallback;
        usedSeeds.add(fallback);
      }
    }
  }

  return assignments;
}

function resolveSeed(
  seed: string,
  slot: BracketSlot,
  seedMap: SeedMap,
  outcomes: OutcomeMap,
  thirdPlaceAssignments: Record<number, string>
) {
  if (/^[WL]\d+$/.test(seed)) {
    const matchId = Number(seed.slice(1));
    const outcome = outcomes[matchId];
    return seed.startsWith("W") ? outcome?.winner ?? null : outcome?.loser ?? null;
  }

  if (!seed.includes("/")) {
    return seedMap[seed] ?? null;
  }

  const assignedSeed = thirdPlaceAssignments[slot.matchId];
  return assignedSeed ? seedMap[assignedSeed] ?? null : null;
}

function seedNoteForSlot(slot: BracketSlot, thirdPlaceAssignments: Record<number, string>) {
  if (!slot.teamASeed.includes("/") && !slot.teamBSeed.includes("/")) {
    return null;
  }

  const assignedSeed = thirdPlaceAssignments[slot.matchId];
  const assignedText = assignedSeed ? `${assignedSeed} 임시 배정` : "3위 팀 임시 배정 필요";
  return `${getThirdPlaceNotice()} 현재 화면은 슬롯별 허용 조 목록을 지킨 ${assignedText}으로 예측합니다.`;
}

function simulateSlot(
  slot: BracketSlot,
  seedMap: SeedMap,
  outcomes: OutcomeMap,
  thirdPlaceAssignments: Record<number, string>,
  dataInputs?: PredictionDataInputs | null
) {
  const teamA =
    resolveSeed(slot.teamASeed, slot, seedMap, outcomes, thirdPlaceAssignments) ?? createPlaceholderTeam(slot.teamASeed);
  const teamB =
    resolveSeed(slot.teamBSeed, slot, seedMap, outcomes, thirdPlaceAssignments) ?? createPlaceholderTeam(slot.teamBSeed);
  const prediction = createMatchPrediction({
    matchId: slot.matchId,
    round: slot.round,
    group: null,
    teamA,
    teamB,
    allowDraw: false,
    bracketSeedNote: seedNoteForSlot(slot, thirdPlaceAssignments),
    dataInputs
  });
  const winner = prediction.predictedWinner ?? (prediction.probabilities.teamAWin >= prediction.probabilities.teamBWin ? teamA : teamB);
  const loser = winner.id === teamA.id ? teamB : teamA;
  const completedPrediction = {
    ...prediction,
    predictedWinner: winner
  };

  outcomes[slot.matchId] = { winner, loser };

  return completedPrediction;
}

function simulateRound(
  round: TournamentRoundPrediction["round"],
  slots: BracketSlot[],
  seedMap: SeedMap,
  outcomes: OutcomeMap,
  thirdPlaceAssignments: Record<number, string>,
  notice: string | null = null,
  dataInputs?: PredictionDataInputs | null
): TournamentRoundPrediction {
  return {
    round,
    matches: slots.map((slot) => simulateSlot(slot, seedMap, outcomes, thirdPlaceAssignments, dataInputs)),
    notice
  };
}

function createDataCards(teamProfiles: PredictionTeamSnapshot[], groupCount: number, dataInputs?: PredictionDataInputs | null): PredictionDataCard[] {
  const totalPlayers = teamVerificationData.reduce((sum, team) => sum + team.players.length, 0);
  const keyPlayers = teamVerificationData.reduce((sum, team) => sum + team.players.filter((player) => player.isKeyPlayer).length, 0);
  const sourceCount = countUniqueSources(teamVerificationData.flatMap((team) => team.sources));
  const completeRosters = teamVerificationData.filter((team) => team.players.length >= 23).length;
  const officialMatchCount = dataInputs?.diagnostics.schedule.officialStructureMatches ?? matchDetails.length;
  const apiFixtureCount = dataInputs?.diagnostics.schedule.apiFixtureMatches ?? 0;
  const scheduleKnown = dataInputs?.diagnostics.schedule.datedMatches ?? matchDetails.filter((match) => match.dateTime).length;
  const venueKnown = dataInputs?.diagnostics.schedule.venueMatches ?? matchDetails.filter((match) => match.stadium).length;
  const restKnown = dataInputs?.diagnostics.schedule.restComputableMatches ?? 0;
  const apiCardEvents = dataInputs?.diagnostics.risk.apiCardEvents ?? 0;
  const cardRecords = dataInputs?.diagnostics.risk.cardRecords ?? 0;
  const injuries = dataInputs?.diagnostics.risk.injuries ?? 0;
  const lineups = dataInputs?.diagnostics.risk.lineups ?? 0;
  const statistics = dataInputs?.diagnostics.risk.statistics ?? 0;
  const apiPredictions = dataInputs?.diagnostics.risk.predictions ?? 0;
  const bracketSlots = allOfficialBracketSlots.length;
  const apiResourceSources = dataInputs?.resourceDiagnostics.map((item) => `${item.label}: ${item.source} (${item.count})`) ?? [];
  const scheduleValue =
    apiFixtureCount > 0
      ? `${scheduleKnown}/${apiFixtureCount} 일정 · ${venueKnown}/${apiFixtureCount} 경기장`
      : `${officialMatchCount}/${officialMatchCount} 구조 확인`;
  const scheduleDetails = [
    `공식 경기 구조: ${officialMatchCount}/${officialMatchCount}`,
    `API-Football fixtures: ${apiFixtureCount}건`,
    `킥오프 시간 확인: ${scheduleKnown}건`,
    `경기장 확인: ${venueKnown}건`,
    `휴식일 계산 가능: ${restKnown}건`
  ];
  const riskDetails = [
    `API-Football card events: ${apiCardEvents}건`,
    `카드/징계 표시 레코드: ${cardRecords}건`,
    `API-Football injuries: ${injuries}건`,
    `API-Football lineups: ${lineups}건`,
    `API-Football statistics: ${statistics}건`,
    `API-Football predictions: ${apiPredictions}건`
  ];

  return [
    {
      id: "groups",
      title: "공식 조 편성",
      value: `${groupCount}개 조 · ${teamProfiles.length}팀`,
      confidence: "공식 확인",
      description: "FIFA 경기 일정의 조 편성 구조를 기준으로 예측 시드를 만듭니다.",
      sourceCount: 1,
      items: ["A~L조 48팀", "팀 국기/코드 연결", "실제 결과 데이터와 분리"],
      details: [`API-Football fixtures 연결: ${apiFixtureCount}건`, `예측 입력 팀: ${teamProfiles.length}팀`],
      dataSources: ["FIFA official group structure", "API-Football fixtures when available"]
    },
    {
      id: "team-strength",
      title: "팀 전력 지표",
      value: `${teamProfiles.length}팀 산출`,
      confidence: "참고 자료",
      description: "파워 인덱스, 최근 성과, 감독, 포메이션, 선수층, 전술 키워드를 점수화합니다.",
      sourceCount,
      items: ["공격/수비/폼/리스크 점수", "개최국 이점 보정", "대륙별 경쟁력 보정"],
      details: dataInputs?.diagnostics.reflectedData.slice(0, 4),
      missingReasons: dataInputs?.diagnostics.missingData.slice(0, 3)
    },
    {
      id: "rosters",
      title: "선수 명단·핵심 선수",
      value: `${totalPlayers}명 · 핵심 ${keyPlayers}명`,
      confidence: completeRosters === teamProfiles.length ? "신뢰도 높음" : "참고 자료",
      description: "팀 상세 페이지의 선수 명단, 핵심 선수, 예상 포메이션을 예측 변수로 사용합니다.",
      sourceCount,
      items: [`23명 이상 연결 ${completeRosters}팀`, "감독/전술 출처 포함", "확정 선발은 경기 전 재확인"],
      details: [`전체 선수 입력 ${totalPlayers}명`, `핵심 선수 입력 ${keyPlayers}명`, `완성 로스터 ${completeRosters}/${teamProfiles.length}팀`]
    },
    {
      id: "schedule",
      title: "일정·경기장·휴식일",
      value: scheduleValue,
      confidence: apiFixtureCount > 0 && scheduleKnown > 0 ? "공식 확인" : "참고 자료",
      description: "API-Football fixtures의 날짜·경기장 값을 우선 사용하고, 없을 때는 공식 104경기 구조를 fallback으로 유지합니다.",
      sourceCount: apiResourceSources.length || 1,
      items: scheduleDetails.slice(0, 3),
      details: scheduleDetails,
      missingReasons: dataInputs?.diagnostics.schedule.fallbackNotes,
      dataSources: ["API-Football fixtures", "football-data.org fallback", "official static bracket/group structure"]
    },
    {
      id: "risk",
      title: "부상·징계·카드·체력",
      value: `카드 ${cardRecords}건 · 부상 ${injuries}건`,
      confidence: apiCardEvents > 0 || injuries > 0 ? "참고 자료" : "확인 필요",
      description: "API-Football events/injuries/lineups/statistics/predictions를 예측 입력 진단에 연결하고, 부족한 항목은 fallback 사유를 표시합니다.",
      sourceCount: apiResourceSources.length || sourceCount,
      items: riskDetails.slice(0, 3),
      details: riskDetails,
      missingReasons: dataInputs?.diagnostics.risk.fallbackNotes,
      dataSources: ["API-Football events", "API-Football injuries", "API-Football lineups/statistics/predictions", "static player risk fallback"]
    },
    {
      id: "bracket",
      title: "공식 브래킷 구조",
      value: `73~104번 · ${bracketSlots}경기`,
      confidence: "공식 확인",
      description: "FIFA 브래킷 경기 번호와 라운드 연결은 고정하고 팀만 예측으로 채웁니다.",
      sourceCount: 1,
      items: ["32강 16경기", "16강~결승 연결", "3위 배정표는 임시 배치 배지 표시"],
      details: dataInputs?.diagnostics.resources.map((item) => `${item.resource}: ${item.count}건 · ${item.source}`),
      dataSources: apiResourceSources
    }
  ];
}

function createLegacyMatch(prediction: MatchPrediction): PredictedMatch {
  const confidenceMap: Record<PredictionDataConfidence, PredictedMatch["confidence"]> = {
    "공식 확인": "높음",
    "신뢰도 높음": "높음",
    "참고 자료": "보통",
    추정: "낮음",
    "확인 필요": "확인 필요"
  };

  return {
    matchId: String(prediction.matchId),
    group: prediction.group,
    homeTeam: prediction.teamA.nameKo,
    awayTeam: prediction.teamB.nameKo,
    homeScore: prediction.expectedScore.teamA,
    awayScore: prediction.expectedScore.teamB,
    confidence: confidenceMap[prediction.confidence],
    uncertaintyFactors: prediction.uncertaintyFactors
  };
}

export function createLegacyGroupSimulation(prediction: FullTournamentPrediction): GroupSimulationData {
  const groupPredictions = prediction.groupStage.flatMap((group) => group.predictedMatches.map(createLegacyMatch));
  const predictedStandings: PredictedStanding[] = prediction.groupStage.flatMap((group) =>
    group.predictedStandings.map((standing) => ({
      team: standing.team.nameKo,
      group: standing.group,
      points: standing.points,
      goalsFor: standing.goalsFor,
      goalsAgainst: standing.goalsAgainst,
      goalDifference: standing.goalDifference,
      winProbability: standing.rank === 1 ? standing.qualificationProbability : null,
      qualificationProbability: standing.qualificationProbability,
      sourceType: "AI 예측 데이터"
    }))
  );

  return {
    groupPredictions,
    matchPredictions: groupPredictions,
    predictedStandings,
    predictedQualifiedTeams: prediction.qualifiedTeams.map(toBracketTeam),
    predictedKnockoutResults: createLegacyBracketMatches(prediction),
    lastSimulatedAt: prediction.generatedAt,
    source: "AI 시뮬레이션",
    notice: prediction.notice
  };
}

export function createLegacyBracketMatches(prediction: FullTournamentPrediction): BracketMatch[] {
  const predictions = [
    ...prediction.roundOf32.matches,
    ...prediction.roundOf16.matches,
    ...prediction.quarterFinals.matches,
    ...prediction.semiFinals.matches,
    ...(prediction.thirdPlaceMatch ? [prediction.thirdPlaceMatch] : []),
    ...(prediction.final ? [prediction.final] : [])
  ];
  const predictionByMatchId = new Map(predictions.map((match) => [Number(match.matchId), match]));

  return allOfficialBracketSlots.map((slot) => {
    const match = predictionByMatchId.get(slot.matchId);

    return {
      ...slot,
      teamA: match ? toBracketTeam(match.teamA) : null,
      teamB: match ? toBracketTeam(match.teamB) : null,
      winner: match?.predictedWinner ? toBracketTeam(match.predictedWinner) : null,
      lockedByApiResult: false,
      unresolvedReason: match?.bracketSeedNote ?? null
    };
  });
}

export function createLegacyTournamentSimulation(prediction: FullTournamentPrediction) {
  const bracket = createLegacyBracketMatches(prediction);
  const duplicateTeams: string[] = [];
  const validation: TournamentValidation = {
    canStart: prediction.qualifiedTeams.length === 32,
    reason: prediction.qualifiedTeams.length === 32 ? null : "32강 진출팀이 32팀이 아닙니다.",
    count: prediction.qualifiedTeams.length,
    duplicateTeams,
    qualifiedTeams: prediction.qualifiedTeams.map(toBracketTeam)
  };

  return {
    ok: true,
    source: "AI 시뮬레이션",
    lastSimulatedAt: prediction.generatedAt,
    notice: prediction.notice,
    validation,
    bracket,
    champion: prediction.champion ? toBracketTeam(prediction.champion) : null
  };
}

function sourceSummaryForDataInputs(dataInputs?: PredictionDataInputs | null): PredictionSourceSummary[] {
  if (!dataInputs) {
    return [];
  }

  return dataInputs.resourceDiagnostics.map((resource) => ({
    sourceName: `${resource.label} (${resource.source})`,
    sourceUrl: resource.source === "api-football" ? "https://www.api-football.com/documentation-v3" : null,
    lastUpdated: resource.lastUpdated,
    confidence: resource.source === "api-football" || resource.source === "cache" ? "참고 자료" : "확인 필요",
    notes:
      resource.message ??
      `${resource.resource} ${resource.count}건, fixture coverage ${resource.fixtureCoverage}건, fallback chain ${resource.fallbackChain.join(" > ") || "none"}`
  }));
}

export function createFullTournamentPrediction(groups: TeamGroup[] = getBaseGroups(), dataInputs?: PredictionDataInputs | null): FullTournamentPrediction {
  const { groupPredictions, qualifiedTeams, thirdPlaceQualifiers } = createGroupPredictions(groups, dataInputs);
  const seedMap = createSeedMap(groupPredictions, thirdPlaceQualifiers);
  const thirdPlaceAssignments = createThirdPlaceAssignments(thirdPlaceQualifiers);
  const outcomes: OutcomeMap = {};
  const teamProfiles = teamVerificationData.map((team) => createSnapshot(team, `${team.groupPosition}${team.groupId}`));
  const roundOf32 = simulateRound(
    "32강",
    officialRoundOf32Slots,
    seedMap,
    outcomes,
    thirdPlaceAssignments,
    getThirdPlaceNotice(),
    dataInputs
  );
  const roundOf16 = simulateRound("16강", officialRoundOf16Slots, seedMap, outcomes, thirdPlaceAssignments, null, dataInputs);
  const quarterFinals = simulateRound("8강", officialQuarterFinalSlots, seedMap, outcomes, thirdPlaceAssignments, null, dataInputs);
  const semiFinals = simulateRound("4강", officialSemiFinalSlots, seedMap, outcomes, thirdPlaceAssignments, null, dataInputs);
  const thirdPlaceMatch = simulateSlot(officialThirdPlaceMatch, seedMap, outcomes, thirdPlaceAssignments, dataInputs);
  const final = simulateSlot(officialFinalMatch, seedMap, outcomes, thirdPlaceAssignments, dataInputs);
  const allSources = [...sourceSummaryForDataInputs(dataInputs), ...summarizeSources(teamVerificationData.flatMap((team) => team.sources))];

  return {
    generatedAt: new Date().toISOString(),
    source: "AI 시뮬레이션",
    modelVersion,
    confidence: "참고 자료",
    notice:
      "이 예측은 공식 결과가 아니며, 공식 조 편성·팀 상세 데이터·브래킷 구조를 내부 규칙 모델로 계산한 참고용 시뮬레이션입니다. 실제 결과와 경기 전 공식 발표가 확인되면 해당 데이터가 우선합니다.",
    refreshStatus: {
      stable: Boolean(dataInputs),
      message:
        dataInputs
          ? `서버 Route에서 API-Football fixtures/events/lineups/injuries/statistics/predictions 입력을 수집했습니다. 호출 제한 보호를 위해 상세 fixture는 ${dataInputs.resourceDiagnostics.find((item) => item.resource === "events")?.fixtureCoverage ?? 0}경기 범위로 샘플링하고, 부족한 데이터는 fallback 사유를 함께 표시합니다.`
          : "자동 새로고침은 현재 안정적으로 지원하지 않습니다. 외부 경기 API와 경기 직전 부상/징계 데이터는 응답 형식과 제공 시점이 달라질 수 있어, 안정화 전까지 새로고침 버튼을 추가하지 않았습니다."
    },
    dataCards: createDataCards(teamProfiles, groupIds.length, dataInputs),
    dataDiagnostics: dataInputs?.diagnostics,
    sourceSummary: allSources,
    teamProfiles,
    groupStage: groupPredictions,
    qualifiedTeams,
    thirdPlaceQualifiers,
    roundOf32,
    roundOf16,
    quarterFinals,
    semiFinals,
    thirdPlaceMatch,
    final,
    champion: final.predictedWinner,
    runnerUp: outcomes[104]?.loser ?? null,
    thirdPlace: thirdPlaceMatch.predictedWinner,
    uncertaintyFactors: [
      "3위 팀 공식 배정표가 확정되지 않아 허용 조 목록 기반 임시 배치를 사용합니다.",
      "경기별 확정 선발, 부상, 징계, 카드 현황은 경기 전 공식 발표로 재확인해야 합니다.",
      "일정·경기장·휴식일이 모두 채워지면 피로도와 이동 변수를 추가 보정할 수 있습니다.",
      ...(dataInputs?.diagnostics.fallbackExplanations ?? []),
      "AI/API 키가 없어도 내부 규칙 모델로 실행되며, 외부 API 오류가 예측 탭을 비우지 않습니다."
    ]
  };
}

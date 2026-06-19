import { getGroupMatchDetails } from "@/data/matchDetails";
import { toBracketTeam } from "@/lib/scenario";
import type { BracketTeam } from "@/types/bracket";
import type { FootballMatch, StandingRow, TeamGroup, TeamRef } from "@/types/football";
import type { SourcedFootballInfo } from "@/types/freshInfo";
import type { ScenarioMatchInput, ScenarioStandingRow } from "@/types/simulation";

type ScorePair = {
  home: number;
  away: number;
};

const finishedStatusKeywords = ["FINISHED", "AWARDED", "AFTER_EXTRA_TIME", "PENALTY_SHOOTOUT", "종료", "경기종료", "FT"];

function normalizeName(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9가-힣]+/g, " ")
    .trim();
}

function findTeam(group: TeamGroup, teamId: string | null | undefined, teamName: string | null | undefined): TeamRef | null {
  const normalizedTeamName = normalizeName(teamName);

  return (
    group.teams.find((team) => team.teamSlug === teamId || team.id === teamId) ??
    group.teams.find((team) => normalizeName(team.nameKo) === normalizedTeamName || normalizeName(team.nameEn) === normalizedTeamName) ??
    null
  );
}

function scoreToResult(home: number | null, away: number | null): ScenarioMatchInput["selectedResult"] {
  if (home === null || away === null) return null;
  if (home > away) return "home";
  if (home < away) return "away";
  return "draw";
}

export function createInitialScenarioMatchInputs(groups: TeamGroup[]): ScenarioMatchInput[] {
  return groups.flatMap((group) =>
    getGroupMatchDetails(group.id).map((match) => {
      const homeTeam = findTeam(group, match.homeTeamId, match.homeTeamName);
      const awayTeam = findTeam(group, match.awayTeamId, match.awayTeamName);
      const homeScore = match.score.home;
      const awayScore = match.score.away;

      return {
        matchId: String(match.matchId),
        groupId: group.id,
        homeTeamId: homeTeam?.id ?? `${group.id}-home-${match.matchId}`,
        awayTeamId: awayTeam?.id ?? `${group.id}-away-${match.matchId}`,
        homeTeamName: homeTeam?.nameKo ?? match.homeTeamName ?? "홈팀 확인 필요",
        awayTeamName: awayTeam?.nameKo ?? match.awayTeamName ?? "원정팀 확인 필요",
        homeScore,
        awayScore,
        selectedResult: scoreToResult(homeScore, awayScore),
        locked: homeScore !== null && awayScore !== null,
        status: homeScore !== null && awayScore !== null ? "actual" : "pending",
        source: "static",
        sourceLabel: "공식 대진 구조",
        updatedAt: match.lastUpdated
      };
    })
  );
}

function createStandingRow(groupId: string, team: TeamRef, source: ScenarioStandingRow["source"]): ScenarioStandingRow {
  return {
    groupId,
    teamId: team.id,
    teamName: team.nameKo,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    rank: team.position,
    source
  };
}

export function calculateScenarioStandings(
  groups: TeamGroup[],
  inputs: ScenarioMatchInput[],
  source: ScenarioStandingRow["source"] = "simulation"
) {
  const result: Record<string, ScenarioStandingRow[]> = {};

  for (const group of groups) {
    const rows = new Map(group.teams.map((team) => [team.id, createStandingRow(group.id, team, source)]));
    const order = new Map(group.teams.map((team, index) => [team.id, index]));

    for (const input of inputs.filter((item) => item.groupId === group.id)) {
      if (input.homeScore === null || input.awayScore === null) {
        continue;
      }

      const home = rows.get(input.homeTeamId);
      const away = rows.get(input.awayTeamId);
      if (!home || !away) {
        continue;
      }

      home.played += 1;
      away.played += 1;
      home.goalsFor += input.homeScore;
      home.goalsAgainst += input.awayScore;
      away.goalsFor += input.awayScore;
      away.goalsAgainst += input.homeScore;

      if (input.homeScore > input.awayScore) {
        home.won += 1;
        home.points += 3;
        away.lost += 1;
      } else if (input.homeScore < input.awayScore) {
        away.won += 1;
        away.points += 3;
        home.lost += 1;
      } else {
        home.drawn += 1;
        away.drawn += 1;
        home.points += 1;
        away.points += 1;
      }

      home.goalDifference = home.goalsFor - home.goalsAgainst;
      away.goalDifference = away.goalsFor - away.goalsAgainst;
    }

    result[group.id] = Array.from(rows.values())
      .sort(
        (a, b) =>
          b.points - a.points ||
          b.goalDifference - a.goalDifference ||
          b.goalsFor - a.goalsFor ||
          a.goalsAgainst - b.goalsAgainst ||
          (order.get(a.teamId) ?? 999) - (order.get(b.teamId) ?? 999)
      )
      .map((row, index) => ({ ...row, rank: index + 1 }));
  }

  return result;
}

export function standingsToGroupRankings(groups: TeamGroup[], standingsByGroup: Record<string, ScenarioStandingRow[]>) {
  return Object.fromEntries(
    groups.map((group) => {
      const rows = standingsByGroup[group.id] ?? [];
      return [
        group.id,
        rows.map((row, index) => {
          const team = group.teams.find((item) => item.id === row.teamId);
          return team
            ? toBracketTeam(team, `${index + 1}${group.id}`)
            : ({
                id: row.teamId,
                nameKo: row.teamName,
                group: group.id,
                seed: `${index + 1}${group.id}`,
                sourceType: "경우의 수 계산기 데이터"
              } satisfies BracketTeam);
        })
      ];
    })
  ) as Record<string, BracketTeam[]>;
}

export function selectThirdPlaceQualifiers(groups: TeamGroup[], standingsByGroup: Record<string, ScenarioStandingRow[]>) {
  return groups
    .map((group) => {
      const row = standingsByGroup[group.id]?.[2];
      const team = row ? group.teams.find((item) => item.id === row.teamId) : null;
      return row && team ? { row, team: toBracketTeam(team, `3${group.id}`) } : null;
    })
    .filter((item): item is { row: ScenarioStandingRow; team: BracketTeam } => Boolean(item))
    .sort(
      (a, b) =>
        b.row.points - a.row.points ||
        b.row.goalDifference - a.row.goalDifference ||
        b.row.goalsFor - a.row.goalsFor ||
        a.row.goalsAgainst - b.row.goalsAgainst ||
        a.row.groupId.localeCompare(b.row.groupId)
    )
    .slice(0, 8)
    .map((item) => item.team);
}

export function isFinishedFootballMatch(match: FootballMatch) {
  return (
    match.score.home !== null &&
    match.score.away !== null &&
    (match.locked || finishedStatusKeywords.some((keyword) => match.status.toUpperCase().includes(keyword.toUpperCase())))
  );
}

function namesMatch(a: string | null | undefined, b: string | null | undefined) {
  const left = normalizeName(a);
  const right = normalizeName(b);
  return Boolean(left && right && (left.includes(right) || right.includes(left)));
}

function findStoredMatch(input: ScenarioMatchInput, matches: FootballMatch[]) {
  return (
    matches.find((match) => String(match.id) === input.matchId) ??
    matches.find((match) => {
      const sameDirection = namesMatch(match.homeTeam, input.homeTeamName) && namesMatch(match.awayTeam, input.awayTeamName);
      const swapped = namesMatch(match.homeTeam, input.awayTeamName) && namesMatch(match.awayTeam, input.homeTeamName);
      return sameDirection || swapped;
    }) ??
    null
  );
}

function extractScoreFromText(text: string): ScorePair | null {
  const score = text.match(/(\d{1,2})\s*[-:]\s*(\d{1,2})/);
  if (!score) return null;

  const home = Number(score[1]);
  const away = Number(score[2]);
  if (!Number.isFinite(home) || !Number.isFinite(away)) return null;

  return { home, away };
}

function findSearchScore(input: ScenarioMatchInput, sourcedItems: SourcedFootballInfo[]) {
  const item = sourcedItems.find((info) => {
    if (info.targetType !== "match" || info.category !== "match_result") return false;
    if (String(info.targetId) === input.matchId || String(info.matchId) === input.matchId) return true;
    const text = `${info.targetName} ${info.title} ${info.summary}`;
    return namesMatch(text, input.homeTeamName) && namesMatch(text, input.awayTeamName);
  });

  if (!item) return null;
  const score = extractScoreFromText(`${item.value ?? ""} ${item.title} ${item.summary}`);
  return score ? { score, item } : null;
}

export function applyStoredActualResultsToInputs(
  inputs: ScenarioMatchInput[],
  matches: FootballMatch[],
  sourcedItems: SourcedFootballInfo[]
) {
  let appliedCount = 0;
  const updated = inputs.map((input) => {
    const storedMatch = findStoredMatch(input, matches);
    if (storedMatch && storedMatch.score.home !== null && storedMatch.score.away !== null) {
      appliedCount += 1;
      const sameDirection = namesMatch(storedMatch.homeTeam, input.homeTeamName);
      const home = sameDirection ? storedMatch.score.home : storedMatch.score.away;
      const away = sameDirection ? storedMatch.score.away : storedMatch.score.home;

      return {
        ...input,
        homeScore: home,
        awayScore: away,
        selectedResult: scoreToResult(home, away),
        locked: isFinishedFootballMatch(storedMatch),
        status: "actual" as const,
        source: storedMatch.sourceType === "API 실제 데이터" ? ("api" as const) : ("football-data.org" as const),
        sourceLabel: `${storedMatch.sourceType} 반영`,
        updatedAt: storedMatch.lastUpdated ?? new Date().toISOString()
      };
    }

    const searchScore = findSearchScore(input, sourcedItems);
    if (searchScore) {
      appliedCount += 1;
      return {
        ...input,
        homeScore: searchScore.score.home,
        awayScore: searchScore.score.away,
        selectedResult: scoreToResult(searchScore.score.home, searchScore.score.away),
        locked: true,
        status: "actual" as const,
        source: "search" as const,
        sourceLabel: "검색 출처 기반 실제 데이터 반영",
        updatedAt: searchScore.item.updatedAt
      };
    }

    return input;
  });

  return { inputs: updated, appliedCount };
}

export function toActualStandingsFromStoredData(
  groups: TeamGroup[],
  apiStandings: StandingRow[],
  apiMatches: FootballMatch[],
  sourcedItems: SourcedFootballInfo[]
) {
  if (apiStandings.length > 0) {
    const grouped: Record<string, ScenarioStandingRow[]> = {};

    for (const group of groups) {
      const rows = apiStandings
        .filter((row) => row.group === group.id)
        .map((row, index): ScenarioStandingRow => {
          const team = group.teams.find((item) => namesMatch(item.nameKo, row.team) || namesMatch(item.nameEn, row.team));
          return {
            groupId: group.id,
            teamId: team?.id ?? `${group.id}-${row.team}`,
            teamName: team?.nameKo ?? row.team,
            played: row.played,
            won: row.won,
            drawn: row.drawn,
            lost: row.lost,
            goalsFor: row.goalsFor,
            goalsAgainst: row.goalsAgainst,
            goalDifference: row.goalDifference,
            points: row.points,
            rank: index + 1,
            source: "actual"
          };
        });
      grouped[group.id] = rows;
    }

    return grouped;
  }

  const initial = createInitialScenarioMatchInputs(groups);
  const actual = applyStoredActualResultsToInputs(initial, apiMatches, sourcedItems).inputs.filter((input) => input.status === "actual");
  return calculateScenarioStandings(groups, actual, "actual");
}

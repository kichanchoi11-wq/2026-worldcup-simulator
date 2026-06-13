import type { FootballMatch, StandingRow } from "@/types/football";

const finishedStatuses = new Set(["FINISHED", "AWARDED", "AFTER_EXTRA_TIME", "PENALTY_SHOOTOUT"]);

export function isFinishedMatch(match: Pick<FootballMatch, "status" | "score">) {
  return finishedStatuses.has(match.status) && match.score.home !== null && match.score.away !== null;
}

function createRow(team: string, group: string): StandingRow {
  return {
    team,
    group,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    sourceType: "API 실제 데이터"
  };
}

export function calculateStandings(matches: FootballMatch[]) {
  const table = new Map<string, StandingRow>();

  for (const match of matches) {
    if (!isFinishedMatch(match) || !match.group) {
      continue;
    }

    const homeKey = `${match.group}:${match.homeTeam}`;
    const awayKey = `${match.group}:${match.awayTeam}`;
    const home = table.get(homeKey) ?? createRow(match.homeTeam, match.group);
    const away = table.get(awayKey) ?? createRow(match.awayTeam, match.group);
    const homeScore = match.score.home ?? 0;
    const awayScore = match.score.away ?? 0;

    home.played += 1;
    away.played += 1;
    home.goalsFor += homeScore;
    home.goalsAgainst += awayScore;
    away.goalsFor += awayScore;
    away.goalsAgainst += homeScore;

    if (homeScore > awayScore) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
    } else if (homeScore < awayScore) {
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
    table.set(homeKey, home);
    table.set(awayKey, away);
  }

  return Array.from(table.values()).sort((a, b) => {
    if (a.group !== b.group) {
      return a.group.localeCompare(b.group);
    }
    return (
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      a.team.localeCompare(b.team)
    );
  });
}

export function mergeProjectedMatches(apiMatches: FootballMatch[], projectedMatches: FootballMatch[]) {
  const projectedById = new Map(projectedMatches.map((match) => [match.id, match]));

  return apiMatches.map((apiMatch) => {
    if (isFinishedMatch(apiMatch)) {
      return apiMatch;
    }

    return projectedById.get(apiMatch.id) ?? apiMatch;
  });
}

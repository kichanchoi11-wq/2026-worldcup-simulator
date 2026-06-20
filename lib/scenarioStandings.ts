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

const teamAliasGroups: string[][] = [
  ["mexico", "멕시코", "mex", "mx"],
  ["south africa", "남아프리카공화국", "남아공", "rsa"],
  ["south korea", "korea republic", "대한민국", "한국", "kor", "korea-republic"],
  ["czech republic", "czechia", "체코", "cze"],
  ["canada", "캐나다", "can"],
  ["bosnia and herzegovina", "bosnia", "보스니아 헤르체고비나", "보스니아", "bih"],
  ["qatar", "카타르", "qat"],
  ["switzerland", "스위스", "sui"],
  ["brazil", "브라질", "bra"],
  ["morocco", "모로코", "mar"],
  ["haiti", "아이티", "hai"],
  ["scotland", "스코틀랜드", "sco"],
  ["united states", "usa", "미국", "united-states"],
  ["paraguay", "파라과이", "par"],
  ["australia", "호주", "aus"],
  ["turkey", "turkiye", "튀르키예", "tur"],
  ["germany", "독일", "ger"],
  ["curacao", "퀴라소", "cuw"],
  ["ivory coast", "cote d ivoire", "코트디부아르", "civ"],
  ["ecuador", "에콰도르", "ecu"],
  ["netherlands", "네덜란드", "ned"],
  ["japan", "일본", "jpn"],
  ["sweden", "스웨덴", "swe"],
  ["tunisia", "튀니지", "tun"],
  ["belgium", "벨기에", "bel"],
  ["egypt", "이집트", "egy"],
  ["iran", "이란", "irn"],
  ["new zealand", "뉴질랜드", "nzl"],
  ["spain", "스페인", "esp"],
  ["cape verde", "카보베르데", "cpv"],
  ["saudi arabia", "사우디아라비아", "ksa"],
  ["uruguay", "우루과이", "uru"],
  ["france", "프랑스", "fra"],
  ["senegal", "세네갈", "sen"],
  ["iraq", "이라크", "irq"],
  ["norway", "노르웨이", "nor"],
  ["argentina", "아르헨티나", "arg"],
  ["algeria", "알제리", "alg"],
  ["austria", "오스트리아", "aut"],
  ["jordan", "요르단", "jor"],
  ["portugal", "포르투갈", "por"],
  ["dr congo", "congo dr", "콩고민주공화국", "dr콩고", "cod"],
  ["uzbekistan", "우즈베키스탄", "uzb"],
  ["colombia", "콜롬비아", "col"],
  ["england", "잉글랜드", "eng"],
  ["croatia", "크로아티아", "cro"],
  ["ghana", "가나", "gha"],
  ["panama", "파나마", "pan"]
];

function normalizeName(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9가-힣]+/g, " ")
    .trim();
}

function aliasesFor(...values: Array<string | null | undefined>) {
  const aliases = new Set(values.map(normalizeName).filter(Boolean));

  for (const group of teamAliasGroups) {
    const normalizedGroup = group.map(normalizeName).filter(Boolean);
    if (normalizedGroup.some((alias) => aliases.has(alias))) {
      normalizedGroup.forEach((alias) => aliases.add(alias));
    }
  }

  return Array.from(aliases);
}

function findTeam(group: TeamGroup, teamId: string | null | undefined, teamName: string | null | undefined): TeamRef | null {
  const normalizedTeamName = normalizeName(teamName);

  return (
    group.teams.find((team) => team.teamSlug === teamId || team.id === teamId) ??
    group.teams.find(
      (team) =>
        normalizeName(team.nameKo) === normalizedTeamName ||
        normalizeName(team.nameEn) === normalizedTeamName ||
        normalizeName(team.teamCode) === normalizedTeamName ||
        aliasesFor(team.nameKo, team.nameEn, team.teamCode, team.teamSlug, team.id).some((alias) => aliasesFor(teamName, teamId).includes(alias))
    ) ??
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
  const leftAliases = aliasesFor(a);
  const rightAliases = aliasesFor(b);
  return leftAliases.some((left) => rightAliases.some((right) => left === right || left.includes(right) || right.includes(left)));
}

function inputTeamMatchesText(text: string, teamName: string, teamId: string) {
  const normalizedText = normalizeName(text);
  return aliasesFor(teamName, teamId).some((alias) => normalizedText.includes(alias));
}

function groupMatches(a: string | null | undefined, b: string | null | undefined) {
  const left = normalizeName(a);
  const right = normalizeName(b);
  if (!left || !right) return false;
  return left === right || left === `group ${right}` || left === `${right}조` || left.includes(` ${right} `) || left.endsWith(` ${right}`);
}

function findStoredMatch(input: ScenarioMatchInput, matches: FootballMatch[]) {
  return (
    matches.find((match) => String(match.id) === input.matchId || String(match.matchNumber) === input.matchId) ??
    matches.find((match) => {
      if (match.group && !groupMatches(match.group, input.groupId)) return false;
      const sameDirection =
        inputTeamMatchesText(match.homeTeam, input.homeTeamName, input.homeTeamId) &&
        inputTeamMatchesText(match.awayTeam, input.awayTeamName, input.awayTeamId);
      const swapped =
        inputTeamMatchesText(match.homeTeam, input.awayTeamName, input.awayTeamId) &&
        inputTeamMatchesText(match.awayTeam, input.homeTeamName, input.homeTeamId);
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

function teamIndexInText(text: string, teamName: string, teamId: string) {
  const normalizedText = normalizeName(text);
  const aliases = aliasesFor(teamName, teamId);
  if (!normalizedText || aliases.length === 0) return -1;
  const indexes = aliases.map((alias) => normalizedText.indexOf(alias)).filter((index) => index >= 0);
  return indexes.length > 0 ? Math.min(...indexes) : -1;
}

function orientScoreForInput(input: ScenarioMatchInput, text: string, score: ScorePair): ScorePair {
  const homeIndex = teamIndexInText(text, input.homeTeamName, input.homeTeamId);
  const awayIndex = teamIndexInText(text, input.awayTeamName, input.awayTeamId);

  if (homeIndex >= 0 && awayIndex >= 0 && awayIndex < homeIndex) {
    return { home: score.away, away: score.home };
  }

  return score;
}

function sourcedInfoText(info: SourcedFootballInfo) {
  return [
    info.targetName,
    info.teamName,
    info.title,
    info.summary,
    info.value,
    ...info.sources.map((source) => `${source.title} ${source.url ?? ""}`)
  ]
    .filter(Boolean)
    .join(" ");
}

function findSearchScore(input: ScenarioMatchInput, sourcedItems: SourcedFootballInfo[]) {
  const item = sourcedItems.find((info) => {
    if (info.targetType !== "match" || !["match_result", "match_status", "match_review"].includes(info.category)) return false;
    if (String(info.targetId) === input.matchId || String(info.matchId) === input.matchId) return true;
    const text = sourcedInfoText(info);
    return inputTeamMatchesText(text, input.homeTeamName, input.homeTeamId) && inputTeamMatchesText(text, input.awayTeamName, input.awayTeamId);
  });

  if (!item) return null;
  const text = sourcedInfoText(item);
  const score = extractScoreFromText(text);
  return score ? { score: orientScoreForInput(input, text, score), item } : null;
}

function standingRowsHaveUsableResults(rows: StandingRow[]) {
  return rows.some(
    (row) =>
      row.played > 0 ||
      row.won > 0 ||
      row.drawn > 0 ||
      row.lost > 0 ||
      row.goalsFor > 0 ||
      row.goalsAgainst > 0 ||
      row.goalDifference !== 0 ||
      row.points > 0
  );
}

function mapApiStandingsWithMissingTeams(groups: TeamGroup[], apiStandings: StandingRow[]) {
  const grouped = calculateScenarioStandings(groups, [], "actual");

  for (const group of groups) {
    const order = new Map(group.teams.map((team, index) => [team.id, index]));
    const rows = [...(grouped[group.id] ?? [])];

    for (const apiRow of apiStandings.filter((row) => groupMatches(row.group, group.id))) {
      const team = group.teams.find((item) => namesMatch(item.nameKo, apiRow.team) || namesMatch(item.nameEn, apiRow.team));
      const teamId = team?.id ?? `${group.id}-${apiRow.team}`;
      const nextRow: ScenarioStandingRow = {
        groupId: group.id,
        teamId,
        teamName: team?.nameKo ?? apiRow.team,
        played: apiRow.played,
        won: apiRow.won,
        drawn: apiRow.drawn,
        lost: apiRow.lost,
        goalsFor: apiRow.goalsFor,
        goalsAgainst: apiRow.goalsAgainst,
        goalDifference: apiRow.goalDifference,
        points: apiRow.points,
        rank: 0,
        source: "actual"
      };
      const currentIndex = rows.findIndex((row) => row.teamId === teamId || namesMatch(row.teamName, apiRow.team));
      if (currentIndex >= 0) {
        rows[currentIndex] = nextRow;
      } else {
        rows.push(nextRow);
      }
    }

    grouped[group.id] = rows
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

  return grouped;
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
      const sameDirection = inputTeamMatchesText(storedMatch.homeTeam, input.homeTeamName, input.homeTeamId);
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
  const initial = createInitialScenarioMatchInputs(groups);
  const { inputs, appliedCount } = applyStoredActualResultsToInputs(initial, apiMatches, sourcedItems);
  const calculatedFromMatches = calculateScenarioStandings(groups, inputs, "actual");
  const apiBased = standingRowsHaveUsableResults(apiStandings) ? mapApiStandingsWithMissingTeams(groups, apiStandings) : null;

  if (appliedCount > 0) {
    if (!apiBased) return calculatedFromMatches;

    return Object.fromEntries(
      groups.map((group) => {
        const matchRows = calculatedFromMatches[group.id] ?? [];
        const apiRows = apiBased[group.id] ?? [];
        const matchPlayed = matchRows.reduce((sum, row) => sum + row.played, 0);
        const apiPlayed = apiRows.reduce((sum, row) => sum + row.played, 0);
        return [group.id, matchPlayed >= apiPlayed ? matchRows : apiRows];
      })
    ) as Record<string, ScenarioStandingRow[]>;
  }

  if (apiBased) {
    return apiBased;
  }

  return calculateScenarioStandings(groups, [], "actual");
}

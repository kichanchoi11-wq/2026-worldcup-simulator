import { matchDetails } from "@/data/matchDetails";
import { teamVerificationData } from "@/data/teamVerificationData";
import { buildCardRecords } from "@/lib/cardRecordService";
import { fetchFootballData, normalizeMatches } from "@/lib/footballApi";
import type { CardRecord } from "@/types/card";
import type { FootballApiEnvelope, FootballApiProvider, FootballDataQuality, FootballMatch } from "@/types/football";
import type { PredictionDataDiagnostics, PredictionResourceDiagnostic } from "@/types/simulation";

type ApiEnvelope = FootballApiEnvelope<unknown>;

export type ActualPredictionResult = {
  source: string;
  matchId: string;
  apiId: number | null;
  status: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  dateTime: string | null;
  venue: string | null;
  lastUpdated: string | null;
};

export type PredictionDataInputs = {
  fetchedAt: string;
  matches: FootballMatch[];
  actualResultsByPair: Record<string, ActualPredictionResult>;
  cardRecords: CardRecord[];
  eventRows: unknown[];
  injuryRows: unknown[];
  lineupRows: unknown[];
  statisticRows: unknown[];
  apiPredictionRows: unknown[];
  resourceDiagnostics: PredictionResourceDiagnostic[];
  diagnostics: PredictionDataDiagnostics;
};

type ResourceFetchResult = {
  rows: unknown[];
  diagnostic: PredictionResourceDiagnostic;
};

const detailFixtureLimit = Number(process.env.API_FOOTBALL_PREDICTION_DETAIL_FIXTURE_LIMIT ?? 1);

function apiResponseRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const response = (payload as { response?: unknown }).response;
    if (Array.isArray(response)) {
      return response;
    }
  }

  return [];
}

function normalizeName(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function teamAliases(teamId: string) {
  const team = teamVerificationData.find((item) => item.teamId === teamId);
  if (!team) {
    return [];
  }

  return [team.teamName, team.teamNameEn, team.teamCode, team.teamId]
    .filter((value): value is string => Boolean(value))
    .map(normalizeName)
    .filter(Boolean);
}

function teamIdFromName(name: string | null | undefined) {
  const normalized = normalizeName(name);
  if (!normalized) {
    return null;
  }

  const direct = teamVerificationData.find((team) =>
    [team.teamName, team.teamNameEn, team.teamCode, team.teamId].some((alias) => normalizeName(alias).includes(normalized) || normalized.includes(normalizeName(alias)))
  );

  return direct?.teamId ?? null;
}

export function predictionPairKey(teamAId: string | null | undefined, teamBId: string | null | undefined) {
  return `${teamAId ?? "unknown"}::${teamBId ?? "unknown"}`;
}

function matchMentionsTeam(match: FootballMatch, teamId: string) {
  const aliases = teamAliases(teamId);
  const names = [match.homeTeam, match.awayTeam].map(normalizeName);

  return aliases.some((alias) => names.some((name) => name.includes(alias) || alias.includes(name)));
}

function isFinished(match: FootballMatch) {
  const status = normalizeName(match.status);
  return match.locked || ["ft", "aet", "pen", "finished", "match finished", "complete", "completed"].some((token) => status.includes(token));
}

function selectDetailFixtureIds(matches: FootballMatch[]) {
  const withFixtureIds = matches.filter((match) => typeof match.apiId === "number");
  const selected = [...withFixtureIds].sort((a, b) => {
    const finishedDelta = Number(isFinished(b)) - Number(isFinished(a));
    if (finishedDelta !== 0) return finishedDelta;

    const koreaDelta = Number(matchMentionsTeam(b, "korea-republic")) - Number(matchMentionsTeam(a, "korea-republic"));
    if (koreaDelta !== 0) return koreaDelta;

    return new Date(a.utcDate ?? "9999-12-31").getTime() - new Date(b.utcDate ?? "9999-12-31").getTime();
  });

  return Array.from(new Set(selected.map((match) => match.apiId).filter((id): id is number => typeof id === "number"))).slice(
    0,
    Math.max(0, Math.min(detailFixtureLimit, 12))
  );
}

function bestSource(envelopes: ApiEnvelope[]): FootballApiProvider | "not-requested" {
  if (envelopes.length === 0) return "not-requested";
  if (envelopes.some((item) => item.source === "api-football")) return "api-football";
  if (envelopes.some((item) => item.source === "cache")) return "cache";
  if (envelopes.some((item) => item.source === "football-data.org")) return "football-data.org";
  return envelopes[0]?.source ?? "not-requested";
}

function bestQuality(envelopes: ApiEnvelope[]): FootballDataQuality | "not-requested" {
  if (envelopes.length === 0) return "not-requested";
  if (envelopes.some((item) => item.dataQuality === "live")) return "live";
  if (envelopes.some((item) => item.dataQuality === "fresh-cache")) return "fresh-cache";
  if (envelopes.some((item) => item.dataQuality === "stale-cache")) return "stale-cache";
  if (envelopes.some((item) => item.dataQuality === "fallback")) return "fallback";
  return envelopes[0]?.dataQuality ?? "unavailable";
}

function summarizeResource(
  resource: PredictionResourceDiagnostic["resource"],
  label: string,
  envelopes: ApiEnvelope[],
  rows: unknown[],
  fixtureCoverage: number
): PredictionResourceDiagnostic {
  const message = envelopes.map((item) => item.message).find((item): item is string => Boolean(item)) ?? null;
  const fallbackChain = Array.from(new Set(envelopes.flatMap((item) => item.fallbackChain ?? [])));

  return {
    resource,
    label,
    source: bestSource(envelopes),
    count: rows.length,
    dataQuality: bestQuality(envelopes),
    message,
    fallbackChain,
    lastUpdated: envelopes[0]?.lastUpdated ?? null,
    fixtureCoverage
  };
}

async function fetchFixtureResource(
  resource: PredictionResourceDiagnostic["resource"],
  label: string,
  fixtureIds: number[],
  pathForFixture: (fixtureId: number) => string
): Promise<ResourceFetchResult> {
  const rows: unknown[] = [];
  const envelopes: ApiEnvelope[] = [];
  let fixtureCoverage = 0;

  for (const fixtureId of fixtureIds) {
    const envelope = await fetchFootballData<unknown>(pathForFixture(fixtureId), { response: [] });
    const responseRows = apiResponseRows(envelope.data).map((row) => {
      if (row && typeof row === "object" && !("fixture" in row)) {
        return {
          fixture: { id: fixtureId },
          ...(row as Record<string, unknown>)
        };
      }

      return row;
    });

    if (responseRows.length > 0) {
      fixtureCoverage += 1;
    }

    rows.push(...responseRows);
    envelopes.push(envelope);
  }

  return {
    rows,
    diagnostic: summarizeResource(resource, label, envelopes, rows, fixtureCoverage)
  };
}

async function fetchLeagueInjuries() {
  const league = process.env.API_FOOTBALL_LEAGUE_ID ?? "1";
  const season = process.env.API_FOOTBALL_SEASON ?? "2026";
  const envelope = await fetchFootballData<unknown>(`/api-football/injuries?league=${league}&season=${season}`, { response: [] });
  const rows = apiResponseRows(envelope.data);

  return {
    rows,
    diagnostic: summarizeResource("injuries", "API-Football injuries", [envelope], rows, rows.length > 0 ? 1 : 0)
  };
}

function createFixtureDiagnostic(envelope: ApiEnvelope, matches: FootballMatch[]): PredictionResourceDiagnostic {
  return {
    resource: "fixtures",
    label: "API-Football fixtures",
    source: envelope.source,
    count: matches.length,
    dataQuality: envelope.dataQuality ?? "unavailable",
    message: envelope.message,
    fallbackChain: envelope.fallbackChain ?? [],
    lastUpdated: envelope.lastUpdated,
    fixtureCoverage: matches.length
  };
}

function countRestComputable(matches: FootballMatch[]) {
  const byTeam = new Map<string, string[]>();

  for (const match of matches) {
    if (!match.utcDate) {
      continue;
    }

    for (const teamName of [match.homeTeam, match.awayTeam]) {
      const teamId = teamIdFromName(teamName) ?? normalizeName(teamName);
      if (!teamId) continue;
      byTeam.set(teamId, [...(byTeam.get(teamId) ?? []), match.utcDate]);
    }
  }

  const teamsWithMultipleDates = new Set(Array.from(byTeam.entries()).filter(([, dates]) => dates.length >= 2).map(([teamId]) => teamId));

  return matches.filter((match) => {
    const homeId = teamIdFromName(match.homeTeam) ?? normalizeName(match.homeTeam);
    const awayId = teamIdFromName(match.awayTeam) ?? normalizeName(match.awayTeam);
    return Boolean(match.utcDate && teamsWithMultipleDates.has(homeId) && teamsWithMultipleDates.has(awayId));
  }).length;
}

function actualResults(matches: FootballMatch[]) {
  return matches.reduce<Record<string, ActualPredictionResult>>((results, match) => {
    if (!isFinished(match) || match.score.home === null || match.score.away === null) {
      return results;
    }

    const homeTeamId = teamIdFromName(match.homeTeam);
    const awayTeamId = teamIdFromName(match.awayTeam);
    const key = predictionPairKey(homeTeamId, awayTeamId);

    results[key] = {
      source: match.sourceType,
      matchId: match.id,
      apiId: match.apiId ?? null,
      status: match.status,
      homeTeamId,
      awayTeamId,
      homeTeamName: match.homeTeam,
      awayTeamName: match.awayTeam,
      homeScore: match.score.home,
      awayScore: match.score.away,
      dateTime: match.utcDate,
      venue: match.venue,
      lastUpdated: match.lastUpdated
    };

    return results;
  }, {});
}

function cardEventCount(events: unknown[]) {
  return events.filter((event) => event && typeof event === "object" && String((event as { type?: unknown }).type ?? "").toLowerCase() === "card").length;
}

function buildDiagnostics(input: {
  fetchedAt: string;
  matches: FootballMatch[];
  events: unknown[];
  injuries: unknown[];
  lineups: unknown[];
  statistics: unknown[];
  predictions: unknown[];
  cardRecords: CardRecord[];
  resourceDiagnostics: PredictionResourceDiagnostic[];
}): PredictionDataDiagnostics {
  const totalMatches = matchDetails.length;
  const datedMatches = input.matches.filter((match) => Boolean(match.utcDate)).length;
  const venueMatches = input.matches.filter((match) => Boolean(match.venue)).length;
  const restComputableMatches = countRestComputable(input.matches);
  const apiCardEvents = cardEventCount(input.events);
  const fixtureDiagnostic = input.resourceDiagnostics.find((item) => item.resource === "fixtures");
  const fixtureSource = fixtureDiagnostic?.source ?? "static";
  const fixtureSourceLabel =
    fixtureSource === "api-football"
      ? "API-Football fixtures"
      : fixtureSource === "football-data.org"
        ? "football-data.org fallback fixtures"
        : fixtureSource === "cache"
          ? "cached fixture data"
          : "official static fixture structure";
  const detailSource =
    input.resourceDiagnostics.some((item) => item.resource !== "fixtures" && item.source === "api-football")
      ? "API-Football detail endpoints"
      : input.cardRecords.some((item) => item.sourceName === "API-Football")
        ? "API-Football events"
        : "static/cache fallback";
  const fallbackExplanations = [
    input.matches.length === 0
      ? "API-Football fixtures returned no usable rows, so the official 104-match bracket/group structure remains the schedule fallback."
      : null,
    datedMatches === 0
      ? "Exact kickoff times are not available in the current fixture response, so rest-day calculations stay source-limited instead of being shown as empty."
      : null,
    venueMatches === 0 ? "Venue data is missing from current fixtures; venue impact is marked as fixture-venue fallback, not blank." : null,
    apiCardEvents === 0
      ? "No API-Football card events were returned for the sampled fixtures; static card-risk records are shown as fallback."
      : null,
    input.injuries.length === 0 ? "API-Football injuries had no rows for the league/season request; roster risk notes remain as fallback." : null
  ].filter((item): item is string => Boolean(item));

  return {
    schedule: {
      officialStructureMatches: totalMatches,
      apiFixtureMatches: input.matches.length,
      datedMatches,
      venueMatches,
      restComputableMatches,
      source: fixtureSourceLabel,
      fallbackNotes: fallbackExplanations.filter((item) => item.includes("fixtures") || item.includes("Venue") || item.includes("kickoff"))
    },
    risk: {
      cardRecords: input.cardRecords.length,
      apiCardEvents,
      injuries: input.injuries.length,
      lineups: input.lineups.length,
      statistics: input.statistics.length,
      predictions: input.predictions.length,
      source: detailSource,
      fallbackNotes: fallbackExplanations.filter((item) => item.includes("card") || item.includes("injur") || item.includes("risk"))
    },
    resources: input.resourceDiagnostics,
    reflectedData: [
      `${totalMatches} official match slots are always present in the prediction model.`,
      `${input.matches.length} ${fixtureSourceLabel} rows are connected to schedule/result diagnostics.`,
      `${Object.keys(actualResults(input.matches)).length} finished API result rows can override prediction scores when team pairs match.`,
      `${input.cardRecords.length} card/risk records are passed into the prediction data cards.`,
      `${input.lineups.length} lineup rows, ${input.statistics.length} statistics rows and ${input.predictions.length} API prediction rows are reported as model inputs.`
    ],
    missingData: [
      datedMatches < totalMatches ? `Kickoff timestamps missing for ${totalMatches - datedMatches} of ${totalMatches} official slots.` : null,
      venueMatches < totalMatches ? `Venue names missing for ${totalMatches - venueMatches} of ${totalMatches} official slots.` : null,
      apiCardEvents === 0 ? "Fixture card events are not available yet for the sampled fixtures." : null,
      input.injuries.length === 0 ? "League/season injury rows are not available from the current API response." : null
    ].filter((item): item is string => Boolean(item)),
    fallbackExplanations
  };
}

export async function fetchPredictionDataInputs(): Promise<PredictionDataInputs> {
  const fetchedAt = new Date().toISOString();
  const fixtureEnvelope = await fetchFootballData<unknown>("/competitions/WC/matches", { matches: [] });
  const matches = normalizeMatches(fixtureEnvelope.data);
  const fixtureIds = selectDetailFixtureIds(matches);
  const [events, lineups, injuries, statistics, predictions] = await Promise.all([
    fetchFixtureResource("events", "API-Football fixture events", fixtureIds, (fixtureId) => `/api-football/fixtures/events?fixture=${fixtureId}`),
    fetchFixtureResource("lineups", "API-Football fixture lineups", fixtureIds, (fixtureId) => `/api-football/fixtures/lineups?fixture=${fixtureId}`),
    fetchLeagueInjuries(),
    fetchFixtureResource("statistics", "API-Football fixture statistics", fixtureIds, (fixtureId) => `/api-football/fixtures/statistics?fixture=${fixtureId}`),
    fetchFixtureResource("predictions", "API-Football predictions", fixtureIds, (fixtureId) => `/api-football/predictions?fixture=${fixtureId}`)
  ]);
  const resourceDiagnostics = [
    createFixtureDiagnostic(fixtureEnvelope, matches),
    events.diagnostic,
    lineups.diagnostic,
    injuries.diagnostic,
    statistics.diagnostic,
    predictions.diagnostic
  ];
  const cardRecords = buildCardRecords({
    apiEvents: events.rows,
    matches,
    refreshedAt: fetchedAt
  });
  const diagnostics = buildDiagnostics({
    fetchedAt,
    matches,
    events: events.rows,
    injuries: injuries.rows,
    lineups: lineups.rows,
    statistics: statistics.rows,
    predictions: predictions.rows,
    cardRecords,
    resourceDiagnostics
  });

  return {
    fetchedAt,
    matches,
    actualResultsByPair: actualResults(matches),
    cardRecords,
    eventRows: events.rows,
    injuryRows: injuries.rows,
    lineupRows: lineups.rows,
    statisticRows: statistics.rows,
    apiPredictionRows: predictions.rows,
    resourceDiagnostics,
    diagnostics
  };
}

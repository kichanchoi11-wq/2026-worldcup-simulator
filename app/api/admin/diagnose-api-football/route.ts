import { NextResponse } from "next/server";
import { createAdminUnauthorizedResponse, isAdminRequest } from "@/lib/adminAuth";
import {
  getApiFootballSeasonAccessStatus,
  getFootballProviderStatus,
  markApiFootballSeasonAccessLimited,
  normalizeMatches,
  normalizeStandings,
  normalizeTeams
} from "@/lib/footballApi";
import { matchDetails } from "@/data/matchDetails";
import { teamVerificationData } from "@/data/teamVerificationData";
import type {
  ApiFootballDiagnosis,
  ApiFootballDiagnosticCall,
  ApiFootballEndpointStatus,
  ApiFootballFallbackStrategy,
  MatchIdMapping
} from "@/types/diagnostics";

export const dynamic = "force-dynamic";

const apiFootballBaseUrl = "https://v3.football.api-sports.io";
const aliases = ["API_FOOTBALL_KEY", "VITE_API_FOOTBALL_KEY", "RAPIDAPI_KEY", "X_RAPIDAPI_KEY"] as const;
const planLimitPattern = /Free plans do not have access to this season|try from 2022 to 2024/i;

function nowIso() {
  return new Date().toISOString();
}

function getLeague() {
  return process.env.API_FOOTBALL_LEAGUE_ID ?? "1";
}

function getSeason() {
  return process.env.API_FOOTBALL_SEASON ?? "2026";
}

function responseRows(payload: unknown): Array<Record<string, unknown>> {
  if (payload && typeof payload === "object") {
    const response = (payload as { response?: unknown }).response;
    if (Array.isArray(response)) {
      return response.filter((row): row is Record<string, unknown> => Boolean(row && typeof row === "object"));
    }
    if (response && typeof response === "object") {
      return [response as Record<string, unknown>];
    }
  }

  return [];
}

function errorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const errors = (payload as { errors?: unknown }).errors;
  if (!errors) {
    return null;
  }

  if (Array.isArray(errors)) {
    return errors.filter(Boolean).join(" ");
  }

  if (typeof errors === "object") {
    return Object.values(errors as Record<string, unknown>).filter(Boolean).join(" ");
  }

  return String(errors);
}

function isPlanLimitMessage(value: string | null | undefined) {
  return Boolean(value && planLimitPattern.test(value));
}

function classifyCall(input: {
  ok: boolean;
  skipped?: boolean;
  status: number | null;
  responseCount: number;
  normalizedCount: number;
  error: string | null;
}): ApiFootballEndpointStatus {
  if (input.skipped) return input.error?.includes("fixtureId") || input.error?.includes("fixture id") ? "mapping-failed" : "skipped";
  if (isPlanLimitMessage(input.error)) return "plan-limited";
  if (input.ok) return "success";
  if (input.status !== null && input.responseCount === 0 && input.normalizedCount === 0) return "empty";
  return "failed";
}

function normalizedCount(endpoint: string, payload: unknown) {
  if (endpoint === "fixtures") return normalizeMatches(payload).length;
  if (endpoint === "standings") return normalizeStandings(payload).length;
  if (endpoint === "teams") return normalizeTeams(payload).length;
  return responseRows(payload).length;
}

function compactSample(row: Record<string, unknown>) {
  const fixture = row.fixture as Record<string, unknown> | undefined;
  const teams = row.teams as Record<string, Record<string, unknown> | undefined> | undefined;
  const team = row.team as Record<string, unknown> | undefined;
  const player = row.player as Record<string, unknown> | undefined;
  const league = row.league as Record<string, unknown> | undefined;

  return {
    fixtureId: fixture?.id ?? (row.fixture && typeof row.fixture === "object" ? (row.fixture as { id?: unknown }).id : null),
    homeTeamId: teams?.home?.id ?? null,
    awayTeamId: teams?.away?.id ?? null,
    teamId: team?.id ?? null,
    date: fixture?.date ?? null,
    status: (fixture?.status as Record<string, unknown> | undefined)?.short ?? (fixture?.status as Record<string, unknown> | undefined)?.long ?? null,
    home: teams?.home?.name ?? null,
    away: teams?.away?.name ?? null,
    team: team?.name ?? null,
    player: player?.name ?? null,
    type: row.type ?? null,
    detail: row.detail ?? null,
    leagueRound: league?.round ?? null
  };
}

async function callApiFootball(endpoint: string, path: string, apiKey: string | undefined, season?: number | null): Promise<ApiFootballDiagnosticCall> {
  const startedAt = nowIso();
  const url = `${apiFootballBaseUrl}/${path}`;

  if (!apiKey) {
    return {
      endpoint,
      url,
      ok: false,
      skipped: true,
      status: null,
      responseLength: 0,
      responseCount: 0,
      normalizedCount: 0,
      classification: "skipped",
      season: season ?? null,
      error: "API_FOOTBALL_KEY가 서버 환경변수에 없어 호출을 건너뛰었습니다.",
      fallbackReason: "서버에 API_FOOTBALL_KEY가 없어 외부 호출을 하지 않았습니다.",
      replacementStrategy: "football-data.org, 캐시, 정적 기본 데이터 순서로 표시합니다.",
      sample: [],
      startedAt,
      finishedAt: nowIso()
    };
  }

  try {
    const response = await fetch(url, {
      headers: {
        "x-apisports-key": apiKey
      },
      cache: "no-store"
    });
    const text = await response.text();
    let payload: unknown = null;

    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = null;
    }

    const rows = responseRows(payload);
    const apiError = errorMessage(payload);
    const count = normalizedCount(endpoint, payload);
    const ok = response.ok && rows.length > 0 && !apiError;
    const error = apiError ?? (response.ok ? (rows.length === 0 ? "response 배열이 비어 있습니다." : null) : `HTTP ${response.status}`);
    const classification = classifyCall({
      ok,
      status: response.status,
      responseCount: rows.length,
      normalizedCount: count,
      error
    });
    const planLimited = classification === "plan-limited";

    return {
      endpoint,
      url,
      ok,
      status: response.status,
      responseLength: text.length,
      responseCount: rows.length,
      normalizedCount: count,
      classification,
      season: season ?? null,
      error,
      fallbackReason: planLimited
        ? "API-Football 무료 플랜에서 해당 시즌 데이터 접근이 제한되어 응답 배열이 비었습니다."
        : classification === "empty"
          ? "HTTP 응답은 성공했지만 response 배열이 비어 있어 화면에 반영할 데이터가 없습니다."
          : null,
      replacementStrategy: planLimited
        ? "2026 북중미 월드컵 데이터만 반영합니다. API-Football 2026 접근이 제한되면 football-data.org 또는 정적 공식 대진 fallback을 사용하고, 과거 시즌 데이터는 호출하거나 반영하지 않습니다."
        : classification === "empty"
          ? "캐시, football-data.org, 정적 fallback 또는 내부 계산 결과를 표시합니다."
          : null,
      sample: rows.slice(0, 3).map(compactSample),
      startedAt,
      finishedAt: nowIso()
    };
  } catch (error) {
    return {
      endpoint,
      url,
      ok: false,
      status: null,
      responseLength: 0,
      responseCount: 0,
      normalizedCount: 0,
      classification: "failed",
      season: season ?? null,
      error: error instanceof Error ? error.message : "API-Football 네트워크 호출 실패",
      fallbackReason: "API-Football 네트워크 요청이 완료되지 않았습니다.",
      replacementStrategy: "저장 캐시 또는 정적 fallback을 유지합니다.",
      sample: [],
      startedAt,
      finishedAt: nowIso()
    };
  }
}

function normalizeName(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function teamIdFromApiName(name: unknown) {
  const normalized = normalizeName(name);
  if (!normalized) return null;

  const team = teamVerificationData.find((item) =>
    [item.teamName, item.teamNameEn, item.teamCode, item.teamId].some((alias) => {
      const normalizedAlias = normalizeName(alias);
      return normalizedAlias && (normalized.includes(normalizedAlias) || normalizedAlias.includes(normalized));
    })
  );

  return team?.teamId ?? null;
}

function groupFromRound(round: unknown) {
  const match = String(round ?? "").match(/Group\s+([A-L])/i);
  return match?.[1]?.toUpperCase() ?? null;
}

function buildMappings(fixturesCall: ApiFootballDiagnosticCall): MatchIdMapping[] {
  const mappedSamples = fixturesCall.sample.slice(0, 12);
  const updatedAt = nowIso();

  if (mappedSamples.length === 0) {
    return [
      {
        internalMatchId: "unknown",
        apiFootballFixtureId: null,
        footballDataMatchId: null,
        homeTeamId: null,
        awayTeamId: null,
        apiFootballHomeTeamId: null,
        apiFootballAwayTeamId: null,
        confidence: "매칭 실패",
        source: "API-Football",
        lastUpdated: updatedAt,
        reason: fixturesCall.error ?? "fixtures response가 비어 있어 내부 match id와 fixture id를 연결할 수 없습니다."
      }
    ];
  }

  return mappedSamples.map((sample) => {
    const row = sample as Record<string, unknown>;
    const homeTeamId = teamIdFromApiName(row.home);
    const awayTeamId = teamIdFromApiName(row.away);
    const groupId = groupFromRound(row.leagueRound);
    const internal = matchDetails.find((match) => {
      const sameTeams =
        homeTeamId &&
        awayTeamId &&
        ((match.homeTeamId === homeTeamId && match.awayTeamId === awayTeamId) ||
          (match.homeTeamId === awayTeamId && match.awayTeamId === homeTeamId));
      const sameGroup = !groupId || match.groupId === groupId;
      return sameTeams && sameGroup;
    });

    return {
      internalMatchId: internal?.matchId ?? "매칭 실패",
      apiFootballFixtureId: typeof row.fixtureId === "number" ? row.fixtureId : null,
      footballDataMatchId: null,
      homeTeamId,
      awayTeamId,
      apiFootballHomeTeamId: null,
      apiFootballAwayTeamId: null,
      confidence: internal ? "팀/날짜 기준 매칭" : "매칭 실패",
      source: "API-Football",
      lastUpdated: updatedAt,
      reason: internal
        ? "API-Football fixture 팀명과 내부 조별리그 팀 슬롯을 연결했습니다."
        : "API-Football 팀명/조 정보가 내부 matchId와 일치하지 않아 events/lineups/statistics 연결이 제한됩니다."
    };
  });
}

function skippedDetailCall(endpoint: string, path: string, reason: string, season?: number | null): ApiFootballDiagnosticCall {
  const timestamp = nowIso();
  return {
    endpoint,
    url: `${apiFootballBaseUrl}/${path}`,
    ok: false,
    skipped: true,
    status: null,
    responseLength: 0,
    responseCount: 0,
    normalizedCount: 0,
    classification: reason.includes("fixtureId") || reason.includes("fixture id") ? "mapping-failed" : "skipped",
    season: season ?? null,
    error: reason,
    fallbackReason: reason,
    replacementStrategy:
      "API-Football fixtureId가 없으면 해당 세부 endpoint를 호출하지 않고, football-data.org 실제 결과와 정적 카드/징계 안내, 체력 내부 계산, AI/fallback 설명을 사용합니다.",
    sample: [],
    startedAt: timestamp,
    finishedAt: timestamp
  };
}

function skippedSeasonLimitedCall(endpoint: string, path: string, reason: string, season?: number | null): ApiFootballDiagnosticCall {
  const timestamp = nowIso();
  return {
    endpoint,
    url: `${apiFootballBaseUrl}/${path}`,
    ok: false,
    skipped: true,
    status: null,
    responseLength: 0,
    responseCount: 0,
    normalizedCount: 0,
    classification: "plan-limited",
    season: season ?? null,
    error: reason,
    fallbackReason: reason,
    replacementStrategy:
      "API-Football 2026 시즌 접근 제한이 확인되어 이 endpoint는 반복 호출하지 않습니다. football-data.org, 캐시, 정적 공식 대진, AI 최신 정보 fallback으로 전환합니다.",
    sample: [],
    startedAt: timestamp,
    finishedAt: timestamp
  };
}

function numberFromSample(sample: unknown, key: string) {
  const value = sample && typeof sample === "object" ? (sample as Record<string, unknown>)[key] : null;
  return typeof value === "number" ? value : null;
}

function fixtureIdFromCall(call: ApiFootballDiagnosticCall) {
  return call.sample.map((sample) => numberFromSample(sample, "fixtureId")).find((value): value is number => typeof value === "number") ?? null;
}

function teamIdFromCall(call: ApiFootballDiagnosticCall) {
  return (
    call.sample
      .flatMap((sample) => [numberFromSample(sample, "teamId"), numberFromSample(sample, "homeTeamId"), numberFromSample(sample, "awayTeamId")])
      .find((value): value is number => typeof value === "number") ?? null
  );
}

function createFallbackStrategy(params: {
  targetSeason: string;
  planLimited: boolean;
  planLimitMessage: string | null;
  fixtureId: number | null;
}): ApiFootballFallbackStrategy {
  const targetIs2026 = params.targetSeason === "2026";
  const limited = params.planLimited && targetIs2026;

  return {
    seasonAccessLimited: limited,
    responseMessage: limited ? "API-Football 무료 플랜에서 2026 시즌 접근 제한을 반환했습니다." : params.planLimitMessage,
    actual2026Source: limited ? "football-data.org fallback" : params.fixtureId ? "api-football" : "static official bracket fallback",
    worldCup2026Only: true,
    apiFootballUsagePolicy: "2026 북중미 월드컵 데이터만 반영합니다. API-Football 응답이 과거 시즌을 안내해도 과거 시즌 데이터는 호출·저장·화면 반영하지 않습니다.",
    skippedDetailReason: params.fixtureId
      ? null
      : limited
        ? "API-Football 무료 플랜에서 2026 fixtures 접근이 막혀 2026 fixtureId를 확보하지 못했습니다."
        : "API-Football fixtureId를 확보하지 못했습니다.",
    cardsFallback:
      "API-Football 2026 events가 불가능하면 football-data.org 제공 범위를 확인하고, 없으면 정적 카드 확인 대상과 공식 경기 보고서 확인 안내를 표시합니다. 없는 카드 기록을 만들지 않습니다.",
    injuriesFallback:
      "API-Football 2026 injuries가 불가능하면 최신 부상은 공식 데이터 미제공으로 표시하고, 정적/관리자 입력 공간과 AI 설명 보강으로 빈 화면을 막습니다.",
    disciplineFallback:
      "공식 카드 이벤트가 없으면 확정 징계를 단정하지 않고, 레드카드/경고 누적 위험 구조와 공식 보고서 확인 필요 상태를 표시합니다.",
    fitnessFallback:
      "체력은 API 데이터가 없어도 경기 일정 기반 휴식일, 경기 간격, 일정 밀도, 이동/경기장 확인 여부를 내부 계산으로 표시합니다.",
    screenMessage: limited
      ? "API-Football 2026 시즌 접근 제한을 감지했습니다. 2026 실제 경기/순위는 football-data.org 또는 정적 공식 대진 fallback만 사용하고, 과거 시즌 데이터는 절대 반영하지 않습니다."
      : "API-Football 2026 직접 접근 제한은 이번 진단에서 확정되지 않았습니다. 사용할 수 없는 endpoint는 캐시/fallback 사유를 함께 표시합니다."
  };
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return createAdminUnauthorizedResponse();
  }

  const apiKey = process.env.API_FOOTBALL_KEY;
  const league = getLeague();
  const season = getSeason();
  const calls: ApiFootballDiagnosticCall[] = [];

  const numericSeason = Number(season);
  const seasonForCalls = Number.isFinite(numericSeason) ? numericSeason : null;
  const connection = await callApiFootball("connection", "status", apiKey, null);
  calls.push(connection);

  const knownSeasonAccessLimit = getApiFootballSeasonAccessStatus(league, season);
  const seasonLimitReason =
    knownSeasonAccessLimit && !knownSeasonAccessLimit.accessible
      ? knownSeasonAccessLimit.reason
      : "API-Football 2026 시즌 접근 제한이 확인되어 반복 호출을 중단했습니다.";
  const fixtures =
    knownSeasonAccessLimit && !knownSeasonAccessLimit.accessible
      ? skippedSeasonLimitedCall("fixtures", `fixtures?league=${league}&season=${season}`, seasonLimitReason, seasonForCalls)
      : await callApiFootball("fixtures", `fixtures?league=${league}&season=${season}`, apiKey, seasonForCalls);
  calls.push(fixtures);

  if (fixtures.classification === "plan-limited" && fixtures.error) {
    markApiFootballSeasonAccessLimited({ league, season, reason: fixtures.error, endpoint: fixtures.url });
  }

  const planLimitedAfterFixtures = fixtures.classification === "plan-limited" || Boolean(getApiFootballSeasonAccessStatus(league, season));
  const repeatedCallSkipReason =
    fixtures.error ??
    getApiFootballSeasonAccessStatus(league, season)?.reason ??
    "API-Football 2026 시즌 접근 제한이 확인되어 같은 시즌 endpoint를 반복 호출하지 않습니다.";
  const standings = planLimitedAfterFixtures
    ? skippedSeasonLimitedCall("standings", `standings?league=${league}&season=${season}`, repeatedCallSkipReason, seasonForCalls)
    : await callApiFootball("standings", `standings?league=${league}&season=${season}`, apiKey, seasonForCalls);
  calls.push(standings);

  const teams = planLimitedAfterFixtures
    ? skippedSeasonLimitedCall("teams", `teams?league=${league}&season=${season}`, repeatedCallSkipReason, seasonForCalls)
    : await callApiFootball("teams", `teams?league=${league}&season=${season}`, apiKey, seasonForCalls);
  calls.push(teams);
  calls.push(
    planLimitedAfterFixtures
      ? skippedSeasonLimitedCall("players", `players?league=${league}&season=${season}&page=1`, repeatedCallSkipReason, seasonForCalls)
      : await callApiFootball("players", `players?league=${league}&season=${season}&page=1`, apiKey, seasonForCalls)
  );

  const teamId = teamIdFromCall(teams);
  if (planLimitedAfterFixtures) {
    calls.push(skippedSeasonLimitedCall("coaches", "coachs?team={teamId}", repeatedCallSkipReason, seasonForCalls));
  } else if (teamId) {
    calls.push(await callApiFootball("coaches", `coachs?team=${teamId}`, apiKey, seasonForCalls));
  } else {
    calls.push(skippedDetailCall("coaches", "coachs?team={teamId}", "API-Football 2026 teamId가 없어 coaches endpoint를 호출하지 않았습니다.", seasonForCalls));
  }

  const fixtureId = fixtureIdFromCall(fixtures);

  if (planLimitedAfterFixtures) {
    calls.push(skippedSeasonLimitedCall("events", "fixtures/events?fixture={fixtureId}", repeatedCallSkipReason, seasonForCalls));
    calls.push(skippedSeasonLimitedCall("lineups", "fixtures/lineups?fixture={fixtureId}", repeatedCallSkipReason, seasonForCalls));
    calls.push(skippedSeasonLimitedCall("injuries", `injuries?league=${league}&season=${season}`, repeatedCallSkipReason, seasonForCalls));
    calls.push(skippedSeasonLimitedCall("statistics", "fixtures/statistics?fixture={fixtureId}", repeatedCallSkipReason, seasonForCalls));
    calls.push(skippedSeasonLimitedCall("predictions", "predictions?fixture={fixtureId}", repeatedCallSkipReason, seasonForCalls));
  } else if (fixtureId) {
    calls.push(await callApiFootball("events", `fixtures/events?fixture=${fixtureId}`, apiKey, seasonForCalls));
    calls.push(await callApiFootball("lineups", `fixtures/lineups?fixture=${fixtureId}`, apiKey, seasonForCalls));
    calls.push(await callApiFootball("injuries", `injuries?fixture=${fixtureId}`, apiKey, seasonForCalls));
    calls.push(await callApiFootball("statistics", `fixtures/statistics?fixture=${fixtureId}`, apiKey, seasonForCalls));
    calls.push(await callApiFootball("predictions", `predictions?fixture=${fixtureId}`, apiKey, seasonForCalls));
  } else {
    const reason = fixtures.error ?? "API-Football fixture id가 없어 detail endpoint를 호출할 수 없습니다.";
    calls.push(skippedDetailCall("events", "fixtures/events?fixture={fixtureId}", reason, seasonForCalls));
    calls.push(skippedDetailCall("lineups", "fixtures/lineups?fixture={fixtureId}", reason, seasonForCalls));
    calls.push(await callApiFootball("injuries", `injuries?league=${league}&season=${season}`, apiKey, seasonForCalls));
    calls.push(skippedDetailCall("statistics", "fixtures/statistics?fixture={fixtureId}", reason, seasonForCalls));
    calls.push(skippedDetailCall("predictions", "predictions?fixture={fixtureId}", reason, seasonForCalls));
  }

  const currentPlanLimitMessage = calls.find((call) => call.classification === "plan-limited")?.error ?? null;
  const fallbackStrategy = createFallbackStrategy({
    targetSeason: season,
    planLimited: Boolean(currentPlanLimitMessage),
    planLimitMessage: currentPlanLimitMessage,
    fixtureId
  });
  const latestProviderStatus = getFootballProviderStatus();
  const matchMappings = buildMappings(fixtures);
  const apiSuccesses = calls.filter((call) => call.ok).length;
  const diagnosis = [
    apiKey ? "API_FOOTBALL_KEY는 서버 환경변수에서 읽혔습니다." : "API_FOOTBALL_KEY가 없습니다. 이 환경에서는 API-Football 대신 fallback만 사용할 수 있습니다.",
    "요청은 API-SPORTS direct 방식(x-apisports-key 헤더)으로만 수행했습니다. RapidAPI 헤더는 사용하지 않습니다.",
    fixtures.ok
      ? `fixtures 응답 ${fixtures.responseCount}개, 정규화 ${fixtures.normalizedCount}개를 확인했습니다.`
      : `fixtures 실패/빈 응답: ${fixtures.error ?? "원인 미상"}`,
    matchMappings.some((mapping) => mapping.confidence !== "매칭 실패")
      ? "일부 API fixture id를 내부 match id와 연결했습니다."
      : "내부 matchId와 API-Football fixture id 매칭에 실패했습니다. detail events/lineups/statistics 화면 반영이 제한됩니다.",
    calls.some((call) => call.error?.includes("Free plans"))
      ? "API-Football 2026 시즌 접근 제한 감지: 현재 무료 플랜은 league=1, season=2026 데이터를 직접 수집할 수 없습니다."
      : "무료 플랜 제한 메시지는 이번 진단 응답에서 직접 감지되지 않았습니다.",
    fallbackStrategy.screenMessage,
    "과거 시즌 자동 탐색과 화면 반영은 비활성화했습니다. 관리자 화면과 저장소에는 2026 북중미 월드컵 데이터만 사용합니다.",
    latestProviderStatus.apiFootball.blocked
      ? "오늘 API-Football soft limit에 도달해 추가 호출이 차단됩니다."
      : `오늘 호출량은 ${latestProviderStatus.apiFootball.used}/${latestProviderStatus.apiFootball.limit}회입니다.`
  ];
  const reflectedCount = calls.reduce((sum, call) => sum + call.normalizedCount, 0);
  const payload: ApiFootballDiagnosis = {
    ok: Boolean(apiKey) && apiSuccesses > 0,
    provider: "API-Football",
    keyConfigured: Boolean(apiKey),
    keyEnvName: apiKey ? "API_FOOTBALL_KEY" : null,
    checkedAliases: aliases.map((envName) => ({
      envName,
      configured: Boolean(process.env[envName]),
      usedByApp: envName === "API_FOOTBALL_KEY"
    })),
    runtime: {
      nodeEnv: process.env.NODE_ENV ?? null,
      vercelEnv: process.env.VERCEL_ENV ?? null,
      isVercel: Boolean(process.env.VERCEL)
    },
    usage: {
      used: latestProviderStatus.apiFootball.used,
      limit: latestProviderStatus.apiFootball.limit,
      remaining: latestProviderStatus.apiFootball.remaining,
      blocked: latestProviderStatus.apiFootball.blocked
    },
    baseUrl: apiFootballBaseUrl,
    requestMode: "API-SPORTS direct",
    targetLeague: league,
    targetSeason: season,
    seasonAccessStatus: latestProviderStatus.seasonAccessStatus,
    calls,
    fallbackStrategy,
    matchMappings,
    dataReflection: {
      rawCollection: apiSuccesses > 0 ? "success" : fallbackStrategy.seasonAccessLimited ? "partial" : Boolean(apiKey) ? "failed" : "skipped",
      normalization: reflectedCount > 0 ? "success" : fallbackStrategy.seasonAccessLimited ? "partial" : "failed",
      storage: "partial",
      visibleData: reflectedCount > 0 || fallbackStrategy.seasonAccessLimited ? "partial" : "failed",
      reflectedCount,
      lastReflectedAt: nowIso(),
      message: fallbackStrategy.seasonAccessLimited
        ? "2026 API-Football 제한을 감지했고, 관리자 패널이 2026 전용 fallback 전략을 저장해 화면에 표시합니다. 과거 시즌 데이터는 저장하거나 반영하지 않습니다."
        : "이 진단 Route는 원본 수집/정규화 상태를 반환하며, 관리자 패널이 결과를 localStorage에 저장해 화면에 표시합니다."
    },
    diagnosis,
    testedAt: nowIso()
  };

  return NextResponse.json(payload, { status: payload.ok ? 200 : 207 });
}

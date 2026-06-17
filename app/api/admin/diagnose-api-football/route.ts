import { NextResponse } from "next/server";
import { createAdminUnauthorizedResponse, isAdminRequest } from "@/lib/adminAuth";
import { getFootballProviderStatus, normalizeMatches, normalizeStandings, normalizeTeams } from "@/lib/footballApi";
import { matchDetails } from "@/data/matchDetails";
import { teamVerificationData } from "@/data/teamVerificationData";
import type { ApiFootballDiagnosis, ApiFootballDiagnosticCall, MatchIdMapping } from "@/types/diagnostics";

export const dynamic = "force-dynamic";

const apiFootballBaseUrl = "https://v3.football.api-sports.io";
const aliases = ["API_FOOTBALL_KEY", "VITE_API_FOOTBALL_KEY", "RAPIDAPI_KEY", "X_RAPIDAPI_KEY"] as const;

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

async function callApiFootball(endpoint: string, path: string, apiKey: string | undefined): Promise<ApiFootballDiagnosticCall> {
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
      error: "API_FOOTBALL_KEY가 서버 환경변수에 없어 호출을 건너뛰었습니다.",
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

    return {
      endpoint,
      url,
      ok: response.ok && rows.length > 0 && !apiError,
      status: response.status,
      responseLength: text.length,
      responseCount: rows.length,
      normalizedCount: normalizedCount(endpoint, payload),
      error: apiError ?? (response.ok ? (rows.length === 0 ? "response 배열이 비어 있습니다." : null) : `HTTP ${response.status}`),
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
      error: error instanceof Error ? error.message : "API-Football 네트워크 호출 실패",
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

function skippedDetailCall(endpoint: string, path: string, reason: string): ApiFootballDiagnosticCall {
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
    error: reason,
    sample: [],
    startedAt: timestamp,
    finishedAt: timestamp
  };
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return createAdminUnauthorizedResponse();
  }

  const apiKey = process.env.API_FOOTBALL_KEY;
  const league = getLeague();
  const season = getSeason();
  const providerStatus = getFootballProviderStatus();
  const calls: ApiFootballDiagnosticCall[] = [];

  const connection = await callApiFootball("connection", "status", apiKey);
  calls.push(connection);

  const fixtures = await callApiFootball("fixtures", `fixtures?league=${league}&season=${season}`, apiKey);
  calls.push(fixtures);

  const standings = await callApiFootball("standings", `standings?league=${league}&season=${season}`, apiKey);
  calls.push(standings);

  const teams = await callApiFootball("teams", `teams?league=${league}&season=${season}`, apiKey);
  calls.push(teams);

  const fixtureId = fixtures.sample
    .map((sample) => (sample as { fixtureId?: unknown }).fixtureId)
    .find((value): value is number => typeof value === "number");

  if (fixtureId) {
    calls.push(await callApiFootball("events", `fixtures/events?fixture=${fixtureId}`, apiKey));
    calls.push(await callApiFootball("lineups", `fixtures/lineups?fixture=${fixtureId}`, apiKey));
    calls.push(await callApiFootball("injuries", `injuries?fixture=${fixtureId}`, apiKey));
    calls.push(await callApiFootball("statistics", `fixtures/statistics?fixture=${fixtureId}`, apiKey));
    calls.push(await callApiFootball("predictions", `predictions?fixture=${fixtureId}`, apiKey));
  } else {
    const reason = fixtures.error ?? "API-Football fixture id가 없어 detail endpoint를 호출할 수 없습니다.";
    calls.push(skippedDetailCall("events", "fixtures/events?fixture={fixtureId}", reason));
    calls.push(skippedDetailCall("lineups", "fixtures/lineups?fixture={fixtureId}", reason));
    calls.push(await callApiFootball("injuries", `injuries?league=${league}&season=${season}`, apiKey));
    calls.push(skippedDetailCall("statistics", "fixtures/statistics?fixture={fixtureId}", reason));
    calls.push(skippedDetailCall("predictions", "predictions?fixture={fixtureId}", reason));
  }

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
      ? "API-Football 무료 플랜/시즌 접근 제한 메시지가 감지되었습니다. 이 경우 football-data.org fallback을 사용해야 합니다."
      : "무료 플랜 제한 메시지는 이번 진단 응답에서 직접 감지되지 않았습니다.",
    providerStatus.apiFootball.blocked
      ? "오늘 API-Football soft limit에 도달해 추가 호출이 차단됩니다."
      : `오늘 호출량은 ${providerStatus.apiFootball.used}/${providerStatus.apiFootball.limit}회입니다.`
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
      used: providerStatus.apiFootball.used,
      limit: providerStatus.apiFootball.limit,
      remaining: providerStatus.apiFootball.remaining,
      blocked: providerStatus.apiFootball.blocked
    },
    calls,
    matchMappings,
    dataReflection: {
      rawCollection: apiSuccesses > 0 ? "success" : Boolean(apiKey) ? "failed" : "skipped",
      normalization: reflectedCount > 0 ? "success" : "failed",
      storage: "partial",
      visibleData: reflectedCount > 0 ? "partial" : "failed",
      reflectedCount,
      lastReflectedAt: nowIso(),
      message: "이 진단 Route는 원본 수집/정규화 상태를 반환하며, 관리자 패널이 결과를 localStorage에 저장해 화면에 표시합니다."
    },
    diagnosis,
    testedAt: nowIso()
  };

  return NextResponse.json(payload, { status: payload.ok ? 200 : 207 });
}

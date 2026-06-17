import type {
  ApiFootballSeasonAccessStatus,
  ApiFootballSyncLog,
  ApiFootballTeamRecord,
  ApiFootballUsageLog,
  ApiFootballUsageSnapshot,
  FootballApiEnvelope,
  FootballApiProvider,
  FootballDataQuality,
  FootballMatch,
  StandingRow
} from "@/types/football";

const apiFootballBaseUrl = "https://v3.football.api-sports.io";
const footballDataBaseUrl = "https://api.football-data.org/v4";
const defaultApiFootballDailyLimit = 100;
const defaultApiFootballSoftLimit = 95;
const planLimitPattern = /Free plans do not have access to this season|try from 2022 to 2024/i;

type FootballResource =
  | "competitions"
  | "fixtures"
  | "standings"
  | "teams"
  | "players"
  | "coaches"
  | "lineups"
  | "events"
  | "injuries"
  | "statistics"
  | "predictions";

type EndpointConfig = {
  resource: FootballResource;
  label: string;
  apiFootballPath: string;
  footballDataPath: string | null;
  cacheTtlMs: number;
};

type CachedProviderData = {
  provider: Exclude<FootballApiProvider, "static">;
  resource: FootballResource;
  data: unknown;
  rawData: unknown;
  updatedAt: string;
  expiresAt: string;
  message: string | null;
};

type ApiState = {
  cache: Map<string, CachedProviderData>;
  seasonAccess: Map<string, ApiFootballSeasonAccessStatus>;
  usage: {
    dateKey: string;
    used: number;
    logs: ApiFootballUsageLog[];
    syncLogs: ApiFootballSyncLog[];
  };
};

type ProviderResult = {
  ok: boolean;
  provider: FootballApiProvider;
  data: unknown;
  rawData: unknown;
  message: string | null;
  dataQuality: FootballDataQuality;
  cacheExpiresAt: string | null;
  isFallbackData: boolean;
  cachedProvider?: FootballApiProvider | null;
};

declare global {
  var __worldCupFootballApiState: ApiState | undefined;
}

function getApiFootballLeagueId() {
  return process.env.API_FOOTBALL_LEAGUE_ID ?? "1";
}

function getApiFootballSeason() {
  return process.env.API_FOOTBALL_SEASON ?? "2026";
}

function getApiFootballKey() {
  return process.env.API_FOOTBALL_KEY;
}

function getFootballDataKey() {
  return process.env.FOOTBALL_DATA_ORG_KEY ?? process.env.FOOTBALL_DATA_API_KEY;
}

function numberFromEnv(key: string, fallback: number) {
  const value = Number(process.env[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getDailyLimit() {
  return numberFromEnv("API_FOOTBALL_DAILY_LIMIT", defaultApiFootballDailyLimit);
}

function getSoftLimit() {
  const hardLimit = getDailyLimit();
  return Math.min(numberFromEnv("API_FOOTBALL_DAILY_SOFT_LIMIT", defaultApiFootballSoftLimit), hardLimit);
}

function nowIso() {
  return new Date().toISOString();
}

function utcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function nextUtcResetIso(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1, 0, 0, 0, 0)).toISOString();
}

function getState(): ApiState {
  const dateKey = utcDateKey();

  if (!globalThis.__worldCupFootballApiState) {
    globalThis.__worldCupFootballApiState = {
      cache: new Map(),
      seasonAccess: new Map(),
      usage: {
        dateKey,
        used: 0,
        logs: [],
        syncLogs: []
      }
    };
  }

  if (globalThis.__worldCupFootballApiState.usage.dateKey !== dateKey) {
    globalThis.__worldCupFootballApiState.usage = {
      dateKey,
      used: 0,
      logs: [],
      syncLogs: []
    };
  }

  return globalThis.__worldCupFootballApiState;
}

function seasonAccessKey(league = getApiFootballLeagueId(), season = getApiFootballSeason()) {
  return `${league}:${season}`;
}

function parseSuggestedSeasons(message: string | null) {
  void message;
  return undefined;
}

function isApiFootball2026SeasonAccessLimited(message: string | null | undefined) {
  return Boolean(message && planLimitPattern.test(message));
}

export function markApiFootballSeasonAccessLimited(input: {
  league?: string | number;
  season?: string | number;
  reason: string;
  endpoint: string;
}) {
  const league = input.league ?? getApiFootballLeagueId();
  const season = input.season ?? getApiFootballSeason();
  const seasonNumber = Number(season);
  const key = seasonAccessKey(String(league), String(season));
  const existing = getState().seasonAccess.get(key);
  const affectedEndpoints = Array.from(new Set([...(existing?.affectedEndpoints ?? []), input.endpoint]));

  getState().seasonAccess.set(key, {
    season: Number.isFinite(seasonNumber) ? seasonNumber : 2026,
    league,
    accessible: false,
    reason: input.reason,
    detectedAt: existing?.detectedAt ?? nowIso(),
    suggestedSeasons: parseSuggestedSeasons(input.reason),
    affectedEndpoints
  });
}

export function getApiFootballSeasonAccessStatus(league = getApiFootballLeagueId(), season = getApiFootballSeason()) {
  return getState().seasonAccess.get(seasonAccessKey(league, season)) ?? null;
}

function shouldSkipApiFootball(config: EndpointConfig) {
  const status = getApiFootballSeasonAccessStatus();
  return Boolean(status && !status.accessible && config.apiFootballPath.includes(`season=${status.season}`));
}

function cacheKey(provider: FootballApiProvider, endpoint: string) {
  return `${provider}:${endpoint}`;
}

function isCacheFresh(record: CachedProviderData) {
  return new Date(record.expiresAt).getTime() > Date.now();
}

function setCache(provider: Exclude<FootballApiProvider, "static">, endpoint: string, config: EndpointConfig, data: unknown, message: string | null) {
  const updatedAt = nowIso();
  const expiresAt = new Date(Date.now() + config.cacheTtlMs).toISOString();
  getState().cache.set(cacheKey(provider, endpoint), {
    provider,
    resource: config.resource,
    data,
    rawData: data,
    updatedAt,
    expiresAt,
    message
  });
}

function readCache(provider: Exclude<FootballApiProvider, "static">, endpoint: string, freshOnly: boolean) {
  const record = getState().cache.get(cacheKey(provider, endpoint));

  if (!record) {
    return null;
  }

  if (freshOnly && !isCacheFresh(record)) {
    return null;
  }

  return record;
}

function rememberUsage(log: ApiFootballUsageLog) {
  const usage = getState().usage;
  usage.logs = [log, ...usage.logs].slice(0, 80);
}

function rememberSync(log: ApiFootballSyncLog) {
  const usage = getState().usage;
  usage.syncLogs = [log, ...usage.syncLogs].slice(0, 80);
}

function usageSnapshot(): ApiFootballUsageSnapshot {
  const usage = getState().usage;
  const limit = getDailyLimit();
  const softLimit = getSoftLimit();
  const remaining = Math.max(0, limit - usage.used);
  const blocked = usage.used >= softLimit;

  return {
    dateKey: usage.dateKey,
    used: usage.used,
    limit,
    softLimit,
    remaining,
    resetAt: nextUtcResetIso(),
    blocked,
    warning: blocked
      ? `API-Football 무료 플랜 보호를 위해 오늘 ${usage.used}/${limit}회 사용 시점에서 추가 호출을 중단했습니다.`
      : remaining <= 10
        ? `API-Football 남은 호출이 ${remaining}회입니다. 캐시 데이터를 우선 사용하세요.`
        : null
  };
}

export function getFootballProviderStatus() {
  const state = getState();

  return {
    providerOrder: ["api-football", "football-data.org", "cache", "static"] as const,
    apiFootball: usageSnapshot(),
    seasonAccessStatus: getApiFootballSeasonAccessStatus(),
    cacheEntries: Array.from(state.cache.values()).map((entry) => ({
      provider: entry.provider,
      resource: entry.resource,
      updatedAt: entry.updatedAt,
      expiresAt: entry.expiresAt,
      fresh: isCacheFresh(entry)
    })),
    usageLogs: state.usage.logs,
    syncLogs: state.usage.syncLogs
  };
}

function ttl(resource: FootballResource) {
  const hour = 60 * 60 * 1000;
  const minute = 60 * 1000;
  const values: Record<FootballResource, number> = {
    competitions: 24 * hour,
    fixtures: 6 * hour,
    standings: 3 * hour,
    teams: 12 * hour,
    players: 24 * hour,
    coaches: 24 * hour,
    lineups: 30 * minute,
    events: 10 * minute,
    injuries: 6 * hour,
    statistics: 2 * hour,
    predictions: 6 * hour
  };

  return values[resource];
}

function endpointForPath(path: string): EndpointConfig {
  const league = getApiFootballLeagueId();
  const season = getApiFootballSeason();

  if (path === "/competitions/WC/matches") {
    return {
      resource: "fixtures",
      label: "경기 일정/결과",
      apiFootballPath: `fixtures?league=${league}&season=${season}`,
      footballDataPath: path,
      cacheTtlMs: ttl("fixtures")
    };
  }

  if (path === "/competitions/WC/standings") {
    return {
      resource: "standings",
      label: "조별 순위",
      apiFootballPath: `standings?league=${league}&season=${season}`,
      footballDataPath: path,
      cacheTtlMs: ttl("standings")
    };
  }

  if (path === "/competitions/WC") {
    return {
      resource: "competitions",
      label: "대회 정보",
      apiFootballPath: `leagues?id=${league}&season=${season}`,
      footballDataPath: path,
      cacheTtlMs: ttl("competitions")
    };
  }

  if (path === "/teams") {
    return {
      resource: "teams",
      label: "팀 정보",
      apiFootballPath: `teams?league=${league}&season=${season}`,
      footballDataPath: null,
      cacheTtlMs: ttl("teams")
    };
  }

  if (path.startsWith("/api-football/")) {
    const apiFootballPath = path.replace(/^\/api-football\//, "");
    const resource = inferResource(apiFootballPath);

    return {
      resource,
      label: resource,
      apiFootballPath,
      footballDataPath: null,
      cacheTtlMs: ttl(resource)
    };
  }

  return {
    resource: "competitions",
    label: "대회 정보",
    apiFootballPath: `leagues?id=${league}&season=${season}`,
    footballDataPath: path,
    cacheTtlMs: ttl("competitions")
  };
}

function inferResource(path: string): FootballResource {
  if (path.startsWith("fixtures/events")) return "events";
  if (path.startsWith("fixtures/lineups")) return "lineups";
  if (path.startsWith("fixtures/statistics")) return "statistics";
  if (path.startsWith("predictions")) return "predictions";
  if (path.startsWith("injuries")) return "injuries";
  if (path.startsWith("players")) return "players";
  if (path.startsWith("coachs") || path.startsWith("coaches")) return "coaches";
  if (path.startsWith("teams")) return "teams";
  if (path.startsWith("standings")) return "standings";
  if (path.startsWith("fixtures")) return "fixtures";
  return "competitions";
}

function hasApiFootballErrors(payload: unknown) {
  const errors = (payload as { errors?: unknown }).errors;

  if (Array.isArray(errors)) {
    return errors.length > 0;
  }

  return Boolean(errors && typeof errors === "object" && Object.keys(errors).length > 0);
}

function responseCount(payload: unknown) {
  const response = (payload as { response?: unknown }).response;

  if (Array.isArray(response)) {
    return response.length;
  }

  return 0;
}

function hasUsefulApiFootballData(payload: unknown) {
  return !hasApiFootballErrors(payload) && responseCount(payload) > 0;
}

function safeMessageFromErrors(payload: unknown) {
  const errors = (payload as { errors?: unknown }).errors;

  if (!errors) {
    return null;
  }

  if (Array.isArray(errors)) {
    return errors.join(" ");
  }

  if (typeof errors === "object") {
    return Object.values(errors as Record<string, unknown>).join(" ");
  }

  return String(errors);
}

async function fetchApiFootball(config: EndpointConfig): Promise<ProviderResult> {
  const cached = readCache("api-football", config.apiFootballPath, true);

  if (cached) {
    rememberUsage({
      id: crypto.randomUUID(),
      provider: "api-football",
      endpoint: config.apiFootballPath,
      resource: config.resource,
      counted: false,
      status: "cache-hit",
      httpStatus: null,
      message: `${config.label} API-Football 캐시를 사용했습니다.`,
      createdAt: nowIso()
    });

    return {
      ok: true,
      provider: "api-football",
      data: cached.data,
      rawData: cached.rawData,
      message: cached.message,
      dataQuality: "fresh-cache",
      cacheExpiresAt: cached.expiresAt,
      isFallbackData: false
    };
  }

  const apiKey = getApiFootballKey();
  const usage = usageSnapshot();
  const seasonAccess = getApiFootballSeasonAccessStatus();

  if (shouldSkipApiFootball(config)) {
    const message =
      seasonAccess?.reason ??
      "API-Football 2026 시즌 접근 제한이 이미 감지되어 같은 시즌 endpoint 반복 호출을 중단했습니다.";
    rememberUsage({
      id: crypto.randomUUID(),
      provider: "api-football",
      endpoint: config.apiFootballPath,
      resource: config.resource,
      counted: false,
      status: "blocked",
      httpStatus: null,
      message: `${message} football-data.org/캐시/정적 fallback으로 전환합니다.`,
      createdAt: nowIso()
    });

    return {
      ok: false,
      provider: "api-football",
      data: null,
      rawData: null,
      message: "API-Football 2026 접근 제한 감지 상태라 반복 호출하지 않고 fallback 데이터를 확인합니다.",
      dataQuality: "unavailable",
      cacheExpiresAt: null,
      isFallbackData: false
    };
  }

  if (!apiKey) {
    rememberUsage({
      id: crypto.randomUUID(),
      provider: "api-football",
      endpoint: config.apiFootballPath,
      resource: config.resource,
      counted: false,
      status: "blocked",
      httpStatus: null,
      message: "API_FOOTBALL_KEY가 없어 API-Football 호출을 건너뛰었습니다.",
      createdAt: nowIso()
    });

    return {
      ok: false,
      provider: "api-football",
      data: null,
      rawData: null,
      message: "API_FOOTBALL_KEY가 설정되지 않아 API-Football 대신 fallback 데이터를 확인합니다.",
      dataQuality: "unavailable",
      cacheExpiresAt: null,
      isFallbackData: false
    };
  }

  if (usage.blocked) {
    rememberUsage({
      id: crypto.randomUUID(),
      provider: "api-football",
      endpoint: config.apiFootballPath,
      resource: config.resource,
      counted: false,
      status: "blocked",
      httpStatus: null,
      message: usage.warning ?? "API-Football 일일 호출 제한 보호로 호출을 중단했습니다.",
      createdAt: nowIso()
    });

    return {
      ok: false,
      provider: "api-football",
      data: null,
      rawData: null,
      message: usage.warning ?? "API-Football 호출 제한 보호로 fallback 데이터를 확인합니다.",
      dataQuality: "unavailable",
      cacheExpiresAt: null,
      isFallbackData: false
    };
  }

  getState().usage.used += 1;

  try {
    const response = await fetch(`${apiFootballBaseUrl}/${config.apiFootballPath}`, {
      headers: {
        "x-apisports-key": apiKey
      },
      next: { revalidate: Math.floor(config.cacheTtlMs / 1000) }
    });
    const payload = (await response.json()) as unknown;
    const errorMessage = safeMessageFromErrors(payload);

    if (!response.ok || !hasUsefulApiFootballData(payload)) {
      const message =
        errorMessage ??
        (response.ok
          ? `API-Football ${config.label} 응답이 비어 있어 fallback 데이터를 확인합니다.`
          : `API-Football ${config.label} 요청이 HTTP ${response.status}로 실패했습니다.`);

      if (isApiFootball2026SeasonAccessLimited(message)) {
        markApiFootballSeasonAccessLimited({
          reason: message,
          endpoint: config.apiFootballPath
        });
      }

      rememberUsage({
        id: crypto.randomUUID(),
        provider: "api-football",
        endpoint: config.apiFootballPath,
        resource: config.resource,
        counted: true,
        status: "failed",
        httpStatus: response.status,
        message,
        createdAt: nowIso()
      });

      return {
        ok: false,
        provider: "api-football",
        data: payload,
        rawData: payload,
        message,
        dataQuality: "unavailable",
        cacheExpiresAt: null,
        isFallbackData: false
      };
    }

    setCache("api-football", config.apiFootballPath, config, payload, null);
    rememberUsage({
      id: crypto.randomUUID(),
      provider: "api-football",
      endpoint: config.apiFootballPath,
      resource: config.resource,
      counted: true,
      status: "success",
      httpStatus: response.status,
      message: `API-Football ${config.label} 데이터를 갱신했습니다.`,
      createdAt: nowIso()
    });

    return {
      ok: true,
      provider: "api-football",
      data: payload,
      rawData: payload,
      message: null,
      dataQuality: "live",
      cacheExpiresAt: new Date(Date.now() + config.cacheTtlMs).toISOString(),
      isFallbackData: false
    };
  } catch {
    const message = `API-Football ${config.label} 네트워크 요청에 실패했습니다. fallback 데이터를 확인합니다.`;
    rememberUsage({
      id: crypto.randomUUID(),
      provider: "api-football",
      endpoint: config.apiFootballPath,
      resource: config.resource,
      counted: true,
      status: "failed",
      httpStatus: null,
      message,
      createdAt: nowIso()
    });

    return {
      ok: false,
      provider: "api-football",
      data: null,
      rawData: null,
      message,
      dataQuality: "unavailable",
      cacheExpiresAt: null,
      isFallbackData: false
    };
  }
}

async function fetchFootballDataOrg(config: EndpointConfig, fallback: unknown): Promise<ProviderResult> {
  if (!config.footballDataPath) {
    return {
      ok: false,
      provider: "football-data.org",
      data: fallback,
      rawData: fallback,
      message: `${config.label}은 football-data.org fallback 경로가 없어 캐시 또는 정적 데이터를 사용합니다.`,
      dataQuality: "unavailable",
      cacheExpiresAt: null,
      isFallbackData: true
    };
  }

  const cached = readCache("football-data.org", config.footballDataPath, true);

  if (cached) {
    rememberUsage({
      id: crypto.randomUUID(),
      provider: "football-data.org",
      endpoint: config.footballDataPath,
      resource: config.resource,
      counted: false,
      status: "cache-hit",
      httpStatus: null,
      message: `${config.label} football-data.org 캐시를 사용했습니다.`,
      createdAt: nowIso()
    });

    return {
      ok: true,
      provider: "football-data.org",
      data: cached.data,
      rawData: cached.rawData,
      message: cached.message,
      dataQuality: "fallback",
      cacheExpiresAt: cached.expiresAt,
      isFallbackData: true
    };
  }

  const apiKey = getFootballDataKey();

  if (!apiKey) {
    return {
      ok: false,
      provider: "football-data.org",
      data: fallback,
      rawData: fallback,
      message: "FOOTBALL_DATA_ORG_KEY가 없어 football-data.org fallback 호출을 건너뛰었습니다.",
      dataQuality: "unavailable",
      cacheExpiresAt: null,
      isFallbackData: true
    };
  }

  try {
    const response = await fetch(`${footballDataBaseUrl}${config.footballDataPath}`, {
      headers: {
        "X-Auth-Token": apiKey
      },
      next: { revalidate: Math.floor(config.cacheTtlMs / 1000) }
    });

    if (!response.ok) {
      return {
        ok: false,
        provider: "football-data.org",
        data: fallback,
        rawData: fallback,
        message: `football-data.org fallback 요청이 HTTP ${response.status}로 실패했습니다.`,
        dataQuality: "unavailable",
        cacheExpiresAt: null,
        isFallbackData: true
      };
    }

    const payload = (await response.json()) as unknown;
    setCache("football-data.org", config.footballDataPath, config, payload, "football-data.org fallback 데이터를 사용했습니다.");

    return {
      ok: true,
      provider: "football-data.org",
      data: payload,
      rawData: payload,
      message: "API-Football 대신 football-data.org fallback 데이터를 사용했습니다.",
      dataQuality: "fallback",
      cacheExpiresAt: new Date(Date.now() + config.cacheTtlMs).toISOString(),
      isFallbackData: true
    };
  } catch {
    return {
      ok: false,
      provider: "football-data.org",
      data: fallback,
      rawData: fallback,
      message: "football-data.org fallback에도 연결하지 못했습니다.",
      dataQuality: "unavailable",
      cacheExpiresAt: null,
      isFallbackData: true
    };
  }
}

function staleCacheResult(config: EndpointConfig): ProviderResult | null {
  const apiFootballCache = readCache("api-football", config.apiFootballPath, false);

  if (apiFootballCache) {
    return {
      ok: true,
      provider: "cache",
      data: apiFootballCache.data,
      rawData: apiFootballCache.rawData,
      message: "API-Football 최신 호출이 불가해 저장된 API-Football 캐시 데이터를 표시합니다.",
      dataQuality: "stale-cache",
      cacheExpiresAt: apiFootballCache.expiresAt,
      isFallbackData: true,
      cachedProvider: "api-football"
    };
  }

  if (config.footballDataPath) {
    const footballDataCache = readCache("football-data.org", config.footballDataPath, false);

    if (footballDataCache) {
      return {
        ok: true,
        provider: "cache",
        data: footballDataCache.data,
        rawData: footballDataCache.rawData,
        message: "외부 API 호출이 불가해 저장된 football-data.org 캐시 데이터를 표시합니다.",
        dataQuality: "stale-cache",
        cacheExpiresAt: footballDataCache.expiresAt,
        isFallbackData: true,
        cachedProvider: "football-data.org"
      };
    }
  }

  return null;
}

function createEnvelope<T>(config: EndpointConfig, result: ProviderResult, data: T, fallbackChain: string[]): FootballApiEnvelope<T> {
  rememberSync({
    id: crypto.randomUUID(),
    resource: config.resource,
    preferredProvider: "api-football",
    resolvedProvider: result.provider,
    status: result.provider === "api-football" ? "success" : result.provider === "cache" ? "cache" : result.provider === "static" ? "static" : "fallback",
    count: Array.isArray(data) ? data.length : responseCount(data),
    message: result.message ?? `${config.label} 데이터를 ${result.provider}에서 확인했습니다.`,
    createdAt: nowIso()
  });

  return {
    ok: result.ok,
    source: result.provider,
    lastUpdated: nowIso(),
    cacheExpiresAt: result.cacheExpiresAt,
    isFallbackData: result.isFallbackData,
    dataQuality: result.dataQuality,
    cachedProvider: result.cachedProvider ?? null,
    fallbackChain,
    usage: usageSnapshot(),
    rawData: result.rawData,
    message: result.message,
    data
  };
}

export async function fetchFootballData<T>(path: string, fallback: T): Promise<FootballApiEnvelope<T>> {
  const config = endpointForPath(path);
  const fallbackChain: string[] = [];
  const apiFootball = await fetchApiFootball(config);

  if (apiFootball.ok) {
    return createEnvelope(config, apiFootball, apiFootball.data as T, ["api-football"]);
  }

  fallbackChain.push(apiFootball.message ?? "API-Football 데이터를 사용할 수 없습니다.");
  const footballData = await fetchFootballDataOrg(config, fallback);

  if (footballData.ok) {
    return createEnvelope(config, footballData, footballData.data as T, [...fallbackChain, "football-data.org"]);
  }

  fallbackChain.push(footballData.message ?? "football-data.org fallback 데이터를 사용할 수 없습니다.");
  const cached = staleCacheResult(config);

  if (cached) {
    return createEnvelope(config, cached, cached.data as T, [...fallbackChain, "cache"]);
  }

  return createEnvelope(
    config,
    {
      ok: false,
      provider: "static",
      data: fallback,
      rawData: fallback,
      message: "API-Football, football-data.org, 캐시 데이터를 모두 사용할 수 없어 정적 기본 데이터를 표시합니다.",
      dataQuality: "static-default",
      cacheExpiresAt: null,
      isFallbackData: true
    },
    fallback,
    [...fallbackChain, "static"]
  );
}

function apiFootballResponse(payload: unknown): Array<Record<string, unknown>> {
  const response = (payload as { response?: unknown }).response;
  return Array.isArray(response) ? (response as Array<Record<string, unknown>>) : [];
}

function extractGroup(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const match = value.match(/Group\s+([A-L])/i);
  return match ? `${match[1].toUpperCase()}조` : value;
}

export function normalizeMatches(payload: unknown): FootballMatch[] {
  const apiFootballRows = apiFootballResponse(payload);

  if (apiFootballRows.some((row) => row.fixture && row.teams)) {
    return apiFootballRows.map((row) => {
      const fixture = row.fixture as Record<string, unknown> | undefined;
      const league = row.league as Record<string, unknown> | undefined;
      const teams = row.teams as Record<string, Record<string, unknown> | undefined> | undefined;
      const goals = row.goals as Record<string, number | null> | undefined;
      const score = row.score as Record<string, Record<string, number | null> | undefined> | undefined;
      const venue = fixture?.venue as Record<string, unknown> | undefined;
      const status = fixture?.status as Record<string, unknown> | undefined;
      const homeTeam = teams?.home;
      const awayTeam = teams?.away;
      const homeWinner = homeTeam?.winner === true;
      const awayWinner = awayTeam?.winner === true;
      const fixtureId = typeof fixture?.id === "number" ? fixture.id : null;
      const homeScore = goals?.home ?? score?.fulltime?.home ?? null;
      const awayScore = goals?.away ?? score?.fulltime?.away ?? null;

      return {
        id: fixtureId ? `api-football-${fixtureId}` : `${homeTeam?.name ?? "home"}-${awayTeam?.name ?? "away"}-${fixture?.date ?? ""}`,
        apiId: fixtureId ?? undefined,
        matchNumber: null,
        stage: String(league?.round ?? "World Cup"),
        group: extractGroup(league?.round),
        utcDate: typeof fixture?.date === "string" ? fixture.date : null,
        status: String(status?.long ?? status?.short ?? "확인 필요"),
        venue: typeof venue?.name === "string" ? venue.name : null,
        homeTeam: String(homeTeam?.name ?? "홈팀 확인 필요"),
        awayTeam: String(awayTeam?.name ?? "원정팀 확인 필요"),
        score: {
          home: homeScore,
          away: awayScore
        },
        winner: homeWinner ? String(homeTeam?.name) : awayWinner ? String(awayTeam?.name) : null,
        sourceType: "API 실제 데이터",
        locked: String(status?.short ?? "").toUpperCase() === "FT",
        lastUpdated: nowIso()
      };
    });
  }

  const matches = (payload as { matches?: Array<Record<string, unknown>> }).matches ?? [];

  return matches.map((match) => {
    const homeTeam = match.homeTeam as Record<string, unknown> | undefined;
    const awayTeam = match.awayTeam as Record<string, unknown> | undefined;
    const score = match.score as Record<string, Record<string, number | null> | undefined> | undefined;
    const fullTime = score?.fullTime;
    const status = String(match.status ?? "확인 필요");

    return {
      id: String(match.id ?? `${homeTeam?.name ?? "home"}-${awayTeam?.name ?? "away"}-${match.utcDate ?? ""}`),
      apiId: typeof match.id === "number" ? match.id : undefined,
      matchNumber: typeof match.matchday === "number" ? match.matchday : null,
      stage: String(match.stage ?? "GROUP_STAGE"),
      group: typeof match.group === "string" ? match.group : null,
      utcDate: typeof match.utcDate === "string" ? match.utcDate : null,
      status,
      venue: typeof match.venue === "string" ? match.venue : null,
      homeTeam: String(homeTeam?.name ?? "홈팀 확인 필요"),
      awayTeam: String(awayTeam?.name ?? "원정팀 확인 필요"),
      score: {
        home: fullTime?.home ?? null,
        away: fullTime?.away ?? null
      },
      winner: typeof score?.winner === "string" ? score.winner : null,
      sourceType: "API 실제 데이터",
      locked: status === "FINISHED",
      lastUpdated: nowIso()
    };
  });
}

export function normalizeStandings(payload: unknown): StandingRow[] {
  const apiFootballRows = apiFootballResponse(payload);

  if (apiFootballRows.some((row) => row.league)) {
    return apiFootballRows.flatMap((row) => {
      const league = row.league as { standings?: Array<Array<Record<string, unknown>>> } | undefined;
      const tables = league?.standings ?? [];

      return tables.flatMap((table) =>
        table.map((standing) => {
          const team = standing.team as Record<string, unknown> | undefined;
          const all = standing.all as Record<string, unknown> | undefined;
          const goals = all?.goals as Record<string, number | undefined> | undefined;
          const goalsFor = Number(goals?.for ?? 0);
          const goalsAgainst = Number(goals?.against ?? 0);

          return {
            team: String(team?.name ?? "팀명 확인 필요"),
            group: String(standing.group ?? "조 확인 필요"),
            played: Number(all?.played ?? 0),
            won: Number(all?.win ?? 0),
            drawn: Number(all?.draw ?? 0),
            lost: Number(all?.lose ?? 0),
            goalsFor,
            goalsAgainst,
            goalDifference: Number(standing.goalsDiff ?? goalsFor - goalsAgainst),
            points: Number(standing.points ?? 0),
            sourceType: "API 실제 데이터"
          };
        })
      );
    });
  }

  const standings = (payload as { standings?: Array<{ group?: string; table?: Array<Record<string, unknown>> }> }).standings ?? [];

  return standings.flatMap((standing) =>
    (standing.table ?? []).map((row) => {
      const team = row.team as Record<string, unknown> | undefined;
      const goalsFor = Number(row.goalsFor ?? 0);
      const goalsAgainst = Number(row.goalsAgainst ?? 0);

      return {
        team: String(team?.name ?? "팀명 확인 필요"),
        group: String(standing.group ?? "조 확인 필요"),
        played: Number(row.playedGames ?? 0),
        won: Number(row.won ?? 0),
        drawn: Number(row.draw ?? 0),
        lost: Number(row.lost ?? 0),
        goalsFor,
        goalsAgainst,
        goalDifference: Number(row.goalDifference ?? goalsFor - goalsAgainst),
        points: Number(row.points ?? 0),
        sourceType: "API 실제 데이터"
      };
    })
  );
}

export function normalizeTeams(payload: unknown): ApiFootballTeamRecord[] {
  return apiFootballResponse(payload)
    .map((row) => {
      const team = row.team as Record<string, unknown> | undefined;

      return {
        id: typeof team?.id === "number" ? team.id : null,
        name: String(team?.name ?? "팀명 확인 필요"),
        code: typeof team?.code === "string" ? team.code : null,
        country: typeof team?.country === "string" ? team.country : null,
        logo: typeof team?.logo === "string" ? team.logo : null,
        source: "api-football" as const,
        lastUpdated: nowIso()
      };
    })
    .filter((team) => team.name !== "팀명 확인 필요");
}

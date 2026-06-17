import type { GeminiProviderStatus } from "@/types/gemini";
import type { ApiFootballSeasonAccessStatus } from "@/types/football";

export type DiagnosticStatus = "success" | "partial" | "failed" | "skipped";
export type ApiFootballEndpointStatus = DiagnosticStatus | "empty" | "plan-limited" | "mapping-failed";

export type ApiFootballDiagnosticCall = {
  endpoint: string;
  url: string;
  ok: boolean;
  skipped?: boolean;
  status: number | null;
  responseLength: number;
  responseCount: number;
  normalizedCount: number;
  classification: ApiFootballEndpointStatus;
  season?: number | null;
  error: string | null;
  fallbackReason?: string | null;
  replacementStrategy?: string | null;
  sample: unknown[];
  startedAt: string;
  finishedAt: string;
};

export type ApiFootballFallbackStrategy = {
  seasonAccessLimited: boolean;
  responseMessage: string | null;
  actual2026Source: "api-football" | "football-data.org fallback" | "static official bracket fallback";
  worldCup2026Only: boolean;
  apiFootballUsagePolicy: string;
  skippedDetailReason: string | null;
  cardsFallback: string;
  injuriesFallback: string;
  disciplineFallback: string;
  fitnessFallback: string;
  screenMessage: string;
};

export type MatchIdMapping = {
  internalMatchId: string | number;
  apiFootballFixtureId: number | null;
  footballDataMatchId: string | number | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  apiFootballHomeTeamId: number | null;
  apiFootballAwayTeamId: number | null;
  confidence: "정확" | "팀/날짜 기준 매칭" | "추정" | "매칭 실패";
  source: "API-Football" | "football-data.org" | "manual" | "static";
  lastUpdated: string;
  reason: string;
};

export type ApiFootballDiagnosis = {
  ok: boolean;
  provider: "API-Football";
  keyConfigured: boolean;
  keyEnvName: "API_FOOTBALL_KEY" | null;
  checkedAliases: Array<{
    envName: string;
    configured: boolean;
    usedByApp: boolean;
  }>;
  runtime: {
    nodeEnv: string | null;
    vercelEnv: string | null;
    isVercel: boolean;
  };
  usage: {
    used: number;
    limit: number;
    remaining: number;
    blocked: boolean;
  };
  baseUrl: string;
  requestMode: "API-SPORTS direct";
  targetLeague: string;
  targetSeason: string;
  seasonAccessStatus?: ApiFootballSeasonAccessStatus | null;
  calls: ApiFootballDiagnosticCall[];
  fallbackStrategy: ApiFootballFallbackStrategy;
  matchMappings: MatchIdMapping[];
  dataReflection: {
    rawCollection: DiagnosticStatus;
    normalization: DiagnosticStatus;
    storage: DiagnosticStatus;
    visibleData: DiagnosticStatus;
    reflectedCount: number;
    lastReflectedAt: string;
    message: string;
  };
  diagnosis: string[];
  testedAt: string;
};

export type GeminiDiagnosis = {
  ok: boolean;
  keyConfigured: boolean;
  modelSelection: string;
  selectedModel: string;
  fallbackModel: string;
  timeoutMs: number;
  call: {
    ok: boolean;
    status: number | null;
    responseLength: number;
    error: string | null;
    startedAt: string;
    finishedAt: string;
  } | null;
  providerStatus: GeminiProviderStatus;
  diagnosis: string[];
  testedAt: string;
};

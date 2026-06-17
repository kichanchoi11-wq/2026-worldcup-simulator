import type { GeminiProviderStatus } from "@/types/gemini";

export type DiagnosticStatus = "success" | "partial" | "failed" | "skipped";

export type ApiFootballDiagnosticCall = {
  endpoint: string;
  url: string;
  ok: boolean;
  skipped?: boolean;
  status: number | null;
  responseLength: number;
  responseCount: number;
  normalizedCount: number;
  error: string | null;
  sample: unknown[];
  startedAt: string;
  finishedAt: string;
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
  calls: ApiFootballDiagnosticCall[];
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

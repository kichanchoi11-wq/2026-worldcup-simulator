export type GeminiAnalysisKind =
  | "refresh-summary"
  | "coach-tactics"
  | "formation"
  | "risk-summary"
  | "match-review";

export type GeminiAnalysisStatus = "success" | "fallback" | "cache" | "failed";

export type GeminiAnalysisRecord = {
  id: string;
  kind: GeminiAnalysisKind;
  title: string;
  status: GeminiAnalysisStatus;
  usedGemini: boolean;
  usedCache: boolean;
  generatedAt: string;
  model: string | null;
  summary: string;
  bulletPoints: string[];
  dataGaps: string[];
  sources: string[];
  message: string;
  rawText?: string | null;
};

export type GeminiAnalysisLog = {
  id: string;
  kind: GeminiAnalysisKind;
  status: GeminiAnalysisStatus;
  usedGemini: boolean;
  usedCache: boolean;
  target: string;
  message: string;
  createdAt: string;
  model?: string | null;
  httpStatus?: number | null;
  retryCount?: number;
  payloadBytes?: number | null;
  fallbackUsed?: boolean;
  rawText?: string | null;
};

export type GeminiActiveJob = {
  id: string;
  kind: GeminiAnalysisKind;
  target: string;
  model: string | null;
  startedAt: string;
};

export type GeminiProviderStatus = {
  enabled: boolean;
  model: string;
  fallbackModel: string;
  callCount: number;
  cacheHitCount: number;
  failureCount: number;
  timeoutCount: number;
  fallbackCount: number;
  activeJobCount: number;
  staleJobCount: number;
  lastCallAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastFailureMessage: string | null;
  lastHttpStatus: number | null;
  lastPayloadBytes: number | null;
  resultSaveSuccess: boolean;
  screenReflectionStatus: "저장됨" | "fallback 저장됨" | "아직 없음";
  activeJobs: GeminiActiveJob[];
  logs: GeminiAnalysisLog[];
  message: string;
};

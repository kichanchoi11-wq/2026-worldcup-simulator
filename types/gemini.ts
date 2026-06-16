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
};

export type GeminiProviderStatus = {
  enabled: boolean;
  model: string;
  fallbackModel: string;
  callCount: number;
  cacheHitCount: number;
  failureCount: number;
  lastCallAt: string | null;
  lastSuccessAt: string | null;
  logs: GeminiAnalysisLog[];
  message: string;
};

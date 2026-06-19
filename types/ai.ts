export type AIAnalysisKind =
  | "refresh-summary"
  | "coach-tactics"
  | "formation"
  | "risk-summary"
  | "match-review";

export type AIAnalysisStatus = "success" | "partial" | "fallback" | "cache" | "failed";
export type AIProviderName = "groq" | "openrouter" | "cache" | "rule-based";
export type RuntimeProviderName = "groq" | "openrouter" | "tavily" | "exa";
export type ProviderRuntimeStatus = "available" | "cooling_down" | "quota_exceeded" | "disabled";

export type AIErrorType =
  | "payload_too_large_before_request"
  | "provider_quota_exceeded"
  | "provider_rate_limited"
  | "provider_timeout"
  | "provider_network_error"
  | "provider_auth_error"
  | "model_not_found"
  | "invalid_response"
  | "fallback_success"
  | "unknown";

export type AIResultPersistenceStatus = {
  savedToCache: boolean;
  savedToStore: boolean;
  savedToLocalStorage: boolean;
  visibleDataUpdated: boolean;
  uiRefreshTriggered: boolean;
};

export type AIChunkResult = {
  chunkId: string;
  status: "success" | "fallback" | "failed";
  providerUsed: "groq" | "openrouter" | "internal-fallback";
  outputSaved: boolean;
  error?: string | null;
};

export type AIProviderRuntimeState = {
  provider: RuntimeProviderName;
  status: ProviderRuntimeStatus;
  model: string;
  enabled: boolean;
  usedToday: number;
  dailySoftLimit: number | null;
  rpmSoftLimit: number | null;
  cooldownUntil: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastFailureMessage: string | null;
};

export type AIAnalysisRecord = {
  id: string;
  kind: AIAnalysisKind;
  title: string;
  status: AIAnalysisStatus;
  usedAI: boolean;
  aiProvider?: AIProviderName;
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

export type AIAnalysisLog = {
  id: string;
  kind: AIAnalysisKind;
  status: AIAnalysisStatus;
  usedAI: boolean;
  usedCache: boolean;
  target: string;
  message: string;
  createdAt: string;
  model?: string | null;
  provider?: AIProviderName;
  httpStatus?: number | null;
  retryCount?: number;
  payloadBytes?: number | null;
  originalPayloadBytes?: number | null;
  compactPayloadBytes?: number | null;
  chunkCount?: number;
  providerUsed?: AIProviderName | "internal-fallback" | null;
  openRouterAttempted?: boolean;
  internalFallbackUsed?: boolean;
  resultSaved?: boolean;
  visibleDataUpdated?: boolean;
  errorType?: AIErrorType;
  finalStatusLabel?: string;
  chunkResults?: AIChunkResult[];
  fallbackUsed?: boolean;
  timeout?: boolean;
  fallbackResultSaved?: boolean;
  screenReflectionStatus?: "저장됨" | "fallback 저장됨" | "아직 없음";
  persistence?: AIResultPersistenceStatus;
  rawText?: string | null;
};

export type AIActiveJob = {
  id: string;
  kind: AIAnalysisKind;
  target: string;
  model: string | null;
  startedAt: string;
};

export type AIProviderStatus = {
  enabled: boolean;
  mainProvider: "groq";
  fallbackProvider: "openrouter";
  providerStates: AIProviderRuntimeState[];
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
  activeJobs: AIActiveJob[];
  logs: AIAnalysisLog[];
  modelSelectionMessage: string;
  modelSelectionError: string | null;
  message: string;
};

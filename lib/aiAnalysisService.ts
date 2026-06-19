import type { MatchPageData, MatchReview } from "@/types/match";
import { createMatchReview, createMatchReviewCacheKey, createRulesReviewMetadata } from "@/lib/matchReviewService";
import { generateAIText, getAIProviderTimeoutMs, getFallbackAIModel, getPrimaryAIModel } from "@/lib/aiProviderRouter";
import { getRuntimeProviderState, providerStatusMessage } from "@/lib/providerRuntimeState";
import type { AIActiveJob, AIAnalysisKind, AIAnalysisLog, AIAnalysisRecord, AIProviderStatus } from "@/types/ai";

type AIReviewJson = {
  matchSummary?: unknown;
  keyMoments?: unknown;
  tacticalReview?: {
    homeTeam?: unknown;
    awayTeam?: unknown;
  };
  formationChanges?: unknown;
  substitutionImpact?: unknown;
  playerHighlights?: unknown;
  cardAndDisciplineImpact?: unknown;
  injuryImpact?: unknown;
  fatigueImpact?: unknown;
  predictionComparisonNotes?: unknown;
  nextMatchImpact?: unknown;
  koreaPerspectiveReview?: unknown;
};

export type AIMatchReviewResult = {
  ok: boolean;
  usedAI: boolean;
  message: string;
  review: MatchReview | null;
};

const aiReviewCache = new Map<string, AIMatchReviewResult>();

type AIState = {
  analysisCache: Map<string, AIAnalysisRecord>;
  activeJobs: Map<string, AIActiveJob>;
  callCount: number;
  cacheHitCount: number;
  failureCount: number;
  timeoutCount: number;
  fallbackCount: number;
  lastCallAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastFailureMessage: string | null;
  lastHttpStatus: number | null;
  lastPayloadBytes: number | null;
  resultSaveSuccess: boolean;
  logs: AIAnalysisLog[];
};

type AIAnalysisJson = {
  summary?: unknown;
  bulletPoints?: unknown;
  dataGaps?: unknown;
  sources?: unknown;
};

type AIAnalysisInput = {
  kind: AIAnalysisKind;
  title: string;
  cacheKey: string;
  instruction: string;
  input: unknown;
  fallbackSummary: string;
  fallbackBullets?: string[];
  fallbackDataGaps?: string[];
  sources?: string[];
};

declare global {
  var __worldCupAIAnalysisState: AIState | undefined;
}

function getAIState(): AIState {
  if (!globalThis.__worldCupAIAnalysisState) {
    globalThis.__worldCupAIAnalysisState = {
      analysisCache: new Map(),
      activeJobs: new Map(),
      callCount: 0,
      cacheHitCount: 0,
      failureCount: 0,
      timeoutCount: 0,
      fallbackCount: 0,
      lastCallAt: null,
      lastSuccessAt: null,
      lastFailureAt: null,
      lastFailureMessage: null,
      lastHttpStatus: null,
      lastPayloadBytes: null,
      resultSaveSuccess: false,
      logs: []
    };
  }

  return globalThis.__worldCupAIAnalysisState;
}

function logAIEvent(event: Omit<AIAnalysisLog, "id" | "createdAt">) {
  const state = getAIState();
  state.logs = [
    {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...event
    },
    ...state.logs
  ].slice(0, 40);
}

function rememberAIFailure(kind: AIAnalysisKind, target: string, message: string, details: Partial<AIAnalysisLog> = {}) {
  const state = getAIState();
  state.failureCount += 1;
  state.lastFailureAt = new Date().toISOString();
  state.lastFailureMessage = message;
  state.lastHttpStatus = details.httpStatus ?? null;
  state.lastPayloadBytes = details.payloadBytes ?? null;
  if (details.fallbackUsed) {
    state.fallbackCount += 1;
  }
  logAIEvent({
    kind,
    target,
    status: "failed",
    usedAI: false,
    usedCache: false,
    message,
    ...details
  });
}

function startAIJob(kind: AIAnalysisKind, target: string, model: string | null) {
  const state = getAIState();
  const job: AIActiveJob = {
    id: crypto.randomUUID(),
    kind,
    target,
    model,
    startedAt: new Date().toISOString()
  };

  state.activeJobs.set(job.id, job);
  return job.id;
}

function finishAIJob(jobId: string | null) {
  if (!jobId) {
    return;
  }

  getAIState().activeJobs.delete(jobId);
}

export function cleanupStaleAIJobs(maxAgeMs = 60_000) {
  const state = getAIState();
  const now = Date.now();
  let cleaned = 0;

  for (const [jobId, job] of state.activeJobs.entries()) {
    if (now - new Date(job.startedAt).getTime() > maxAgeMs) {
      cleaned += 1;
      state.activeJobs.delete(jobId);
      rememberAIFailure(job.kind, job.target, "1분 이상 실행 중으로 남은 AI 작업을 자동 정리했습니다.", {
        model: job.model,
        fallbackUsed: true
      });
    }
  }

  return cleaned;
}

function parseJsonObject<T>(text: string): T | null {
  const trimmed = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");

    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
  }

  return null;
}

function getAIModelSelectionMessage() {
  return "Groq를 메인 AI Provider로 사용하고, 실패/429/quota/timeout 시 OpenRouter로 한 번만 fallback합니다.";
}

export function getAITimeoutMs() {
  return Math.max(getAIProviderTimeoutMs("groq"), getAIProviderTimeoutMs("openrouter"));
}

async function callAIText(prompt: string, context: { kind: AIAnalysisKind; target: string }): Promise<
  | { ok: true; provider: string; model: string; text: string; payloadBytes: number; fallbackUsed: boolean; retryCount: number; timeout: boolean }
  | { ok: false; provider: string; model: string | null; message: string; httpStatus: number | null; payloadBytes: number; fallbackUsed: boolean; retryCount: number; timeout: boolean }
> {
  const state = getAIState();
  const jobId = startAIJob(context.kind, context.target, getPrimaryAIModel());
  const result = await generateAIText(prompt);
  const callCount = result.provider === "rule-based" || result.provider === "cache" ? 0 : result.retryCount + 1;
  state.callCount += callCount;
  state.lastCallAt = callCount > 0 ? new Date().toISOString() : state.lastCallAt;
  state.lastHttpStatus = result.httpStatus;
  state.lastPayloadBytes = result.payloadBytes;
  if (result.timeout) {
    state.timeoutCount += 1;
  }
  finishAIJob(jobId);

  if (result.ok) {
    return {
      ok: true,
      provider: result.provider,
      model: result.model,
      text: result.text,
      payloadBytes: result.payloadBytes,
      fallbackUsed: result.fallbackUsed,
      retryCount: result.retryCount,
      timeout: result.timeout
    };
  }

  return {
    ok: false,
    provider: result.provider,
    model: result.model,
    message: result.message,
    httpStatus: result.httpStatus,
    payloadBytes: result.payloadBytes,
    fallbackUsed: result.fallbackUsed,
    retryCount: result.retryCount,
    timeout: result.timeout
  };
}

function createFallbackAnalysis(input: AIAnalysisInput, status: AIAnalysisRecord["status"], message: string): AIAnalysisRecord {
  return {
    id: `${input.kind}-${input.cacheKey}`,
    kind: input.kind,
    title: input.title,
    status,
    usedAI: false,
    aiProvider: "rule-based",
    usedCache: false,
    generatedAt: new Date().toISOString(),
    model: null,
    summary: input.fallbackSummary,
    bulletPoints: input.fallbackBullets ?? [],
    dataGaps: input.fallbackDataGaps ?? [],
    sources: input.sources ?? [],
    message,
    rawText: null
  };
}

function buildGenericAIPrompt(input: AIAnalysisInput) {
  return [
    "너는 2026 FIFA 월드컵 데이터 검증 보조 분석가다.",
    "아래 JSON으로 제공된 API-Football, football-data.org fallback, 캐시, 정적 데이터 안에서만 분석한다.",
    "없는 감독명, 선수명, 카드, 부상, 포메이션, 경기 이벤트를 새로 만들지 말고 데이터가 부족하면 '추가 확인 필요'라고 명확히 적는다.",
    "모든 설명은 한국어로 작성한다.",
    "마크다운 없이 JSON 객체 하나만 반환한다.",
    "반환 필드: summary(string), bulletPoints(string[]), dataGaps(string[]), sources(string[]).",
    `분석 대상: ${input.title}`,
    input.instruction,
    JSON.stringify(input.input)
  ].join("\n\n");
}

function applyAIAnalysisPayload(input: AIAnalysisInput, payload: AIAnalysisJson, model: string, provider: "groq" | "openrouter"): AIAnalysisRecord {
  return {
    id: `${input.kind}-${input.cacheKey}`,
    kind: input.kind,
    title: input.title,
    status: "success",
    usedAI: true,
    aiProvider: provider,
    usedCache: false,
    generatedAt: new Date().toISOString(),
    model,
    summary: asString(payload.summary, input.fallbackSummary),
    bulletPoints: asStringArray(payload.bulletPoints, input.fallbackBullets ?? []),
    dataGaps: asStringArray(payload.dataGaps, input.fallbackDataGaps ?? []),
    sources: asStringArray(payload.sources, input.sources ?? []),
    message: "AI API 분석을 완료했습니다."
  };
}

export function getAIProviderStatus(): AIProviderStatus {
  cleanupStaleAIJobs();
  const state = getAIState();
  const model = getPrimaryAIModel();
  const fallbackModel = getFallbackAIModel();
  const providerStates = [getRuntimeProviderState("groq"), getRuntimeProviderState("openrouter")];
  const enabled = providerStates.some((provider) => provider.enabled);
  const activeJobs = Array.from(state.activeJobs.values());
  const staleJobCount = activeJobs.filter((job) => Date.now() - new Date(job.startedAt).getTime() > 60_000).length;

  return {
    enabled,
    mainProvider: "groq",
    fallbackProvider: "openrouter",
    providerStates,
    model,
    fallbackModel,
    callCount: state.callCount,
    cacheHitCount: state.cacheHitCount,
    failureCount: state.failureCount,
    timeoutCount: state.timeoutCount,
    fallbackCount: state.fallbackCount,
    activeJobCount: activeJobs.length,
    staleJobCount,
    lastCallAt: state.lastCallAt,
    lastSuccessAt: state.lastSuccessAt,
    lastFailureAt: state.lastFailureAt,
    lastFailureMessage: state.lastFailureMessage,
    lastHttpStatus: state.lastHttpStatus,
    lastPayloadBytes: state.lastPayloadBytes,
    resultSaveSuccess: state.resultSaveSuccess,
    screenReflectionStatus: state.resultSaveSuccess ? "저장됨" : state.fallbackCount > 0 ? "fallback 저장됨" : "아직 없음",
    activeJobs,
    logs: state.logs,
    modelSelectionMessage: getAIModelSelectionMessage(),
    modelSelectionError: null,
    message: enabled
      ? `${providerStatusMessage()} AI API 키는 서버 Route에서만 사용합니다.`
      : "GROQ_API_KEY/OPENROUTER_API_KEY가 없어 내부 규칙 기반 분석으로 fallback합니다."
  };
}

export async function createAIAnalysis(input: AIAnalysisInput): Promise<AIAnalysisRecord> {
  const state = getAIState();
  const cached = state.analysisCache.get(input.cacheKey);

  if (cached) {
    state.cacheHitCount += 1;
    state.resultSaveSuccess = true;
    logAIEvent({
      kind: input.kind,
      target: input.title,
      status: "cache",
      usedAI: cached.usedAI,
      usedCache: true,
      message: "저장된 AI 분석 캐시를 사용했습니다."
    });

    return {
      ...cached,
      status: "cache",
      usedCache: true,
      message: "저장된 AI 분석 캐시를 사용했습니다."
    };
  }

  const ai = await callAIText(buildGenericAIPrompt(input), { kind: input.kind, target: input.title });

  if (!ai.ok) {
    const fallback = createFallbackAnalysis(input, "fallback", `${ai.message} 내부 규칙 기반 분석을 사용했습니다.`);
    state.analysisCache.set(input.cacheKey, fallback);
    state.resultSaveSuccess = true;
    rememberAIFailure(input.kind, input.title, fallback.message, {
      model: ai.model,
      httpStatus: ai.httpStatus,
      retryCount: ai.retryCount,
      payloadBytes: ai.payloadBytes,
      fallbackUsed: true,
      timeout: ai.timeout,
      fallbackResultSaved: true,
      screenReflectionStatus: "fallback 저장됨"
    });
    return fallback;
  }

  const parsed = parseJsonObject<AIAnalysisJson>(ai.text);

  if (!parsed) {
    const fallback = {
      ...createFallbackAnalysis(input, "fallback", "AI 응답 JSON 파싱에 실패해 원문 일부를 저장하고 내부 규칙 기반 분석을 사용했습니다."),
      rawText: ai.text.slice(0, 1200),
      dataGaps: [...(input.fallbackDataGaps ?? []), "AI 응답이 JSON 형식이 아니어서 원문 일부만 저장했습니다."]
    };
    state.analysisCache.set(input.cacheKey, fallback);
    state.resultSaveSuccess = true;
    rememberAIFailure(input.kind, input.title, fallback.message, {
      model: ai.model,
      httpStatus: null,
      retryCount: ai.retryCount,
      payloadBytes: ai.payloadBytes,
      fallbackUsed: true,
      timeout: false,
      fallbackResultSaved: true,
      screenReflectionStatus: "fallback 저장됨",
      rawText: fallback.rawText
    });
    return fallback;
  }

  const result = applyAIAnalysisPayload(input, parsed, ai.model, ai.provider === "openrouter" ? "openrouter" : "groq");
  state.analysisCache.set(input.cacheKey, result);
  state.lastSuccessAt = result.generatedAt;
  state.resultSaveSuccess = true;
  logAIEvent({
    kind: input.kind,
    target: input.title,
    status: "success",
    usedAI: true,
    provider: ai.provider === "openrouter" ? "openrouter" : "groq",
    usedCache: false,
    message: ai.fallbackUsed ? `${result.message} fallback 모델(${ai.model})을 사용했습니다.` : result.message,
    model: ai.model,
    retryCount: ai.retryCount,
    payloadBytes: ai.payloadBytes,
    fallbackUsed: ai.fallbackUsed,
    timeout: false,
    fallbackResultSaved: true,
    screenReflectionStatus: "저장됨"
  });
  return result;
}

function asString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function asStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
  return items.length > 0 ? items : fallback;
}

function parseAIJson(text: string): AIReviewJson | null {
  return parseJsonObject<AIReviewJson>(text);
}

function compactPageData(pageData: MatchPageData, fallbackReview: MatchReview) {
  return {
    match: {
      matchId: pageData.detail.matchId,
      round: pageData.detail.round,
      groupId: pageData.detail.groupId,
      homeTeamName: pageData.detail.homeTeamName,
      awayTeamName: pageData.detail.awayTeamName,
      status: pageData.detail.status,
      score: pageData.detail.score,
      dateTime: pageData.detail.dateTime,
      stadium: pageData.detail.stadium
    },
    formations: {
      home: {
        teamName: pageData.homeFormation.teamName,
        formation: pageData.homeFormation.formation,
        notes: pageData.homeFormation.notes
      },
      away: {
        teamName: pageData.awayFormation.teamName,
        formation: pageData.awayFormation.formation,
        notes: pageData.awayFormation.notes
      }
    },
    expectedPlayers: pageData.expectedPlayers.map((player) => ({
      teamId: player.teamId,
      playerName: player.playerName,
      position: player.position,
      availability: player.availability,
      expectedStarter: player.expectedStarter,
      suspensionStatus: player.suspensionStatus,
      injuryStatus: player.injuryStatus,
      yellowCards: player.yellowCards,
      redCards: player.redCards,
      fatigueRisk: player.fatigueRisk
    })),
    cardStatuses: pageData.cardStatuses.map((item) => ({
      playerName: item.playerName,
      teamId: item.teamId,
      yellowCards: item.yellowCards,
      redCards: item.redCards,
      status: item.status,
      evidenceStatus: item.evidenceStatus,
      missingReason: item.missingReason
    })),
    cardEvents: pageData.matchCardEvents,
    suspensions: pageData.suspensionStatuses.map((item) => ({
      playerName: item.playerName,
      teamId: item.teamId,
      status: item.status,
      appliesToMatch: item.appliesToMatch,
      missingReason: item.missingReason
    })),
    injuries: pageData.injuryStatuses.map((item) => ({
      playerName: item.playerName,
      teamId: item.teamId,
      status: item.status,
      availability: item.availability,
      missingReason: item.missingReason
    })),
    fitness: pageData.teamFitnessProfiles.map((item) => ({
      teamName: item.teamName,
      restDays: item.restDays,
      fatigueLevel: item.fatigueLevel,
      travelLoad: item.travelLoad,
      overloadedPlayers: item.overloadedPlayers.map((player) => player.playerName),
      missingReason: item.missingReason
    })),
    prediction: pageData.prediction,
    koreaAnalysis: pageData.koreaAnalysis,
    dataGaps: pageData.dataGaps,
    fallbackReview: {
      matchSummary: fallbackReview.matchSummary,
      tacticalReview: fallbackReview.tacticalReview,
      cardAndDisciplineImpact: fallbackReview.cardAndDisciplineImpact,
      injuryImpact: fallbackReview.injuryImpact,
      fatigueImpact: fallbackReview.fatigueImpact,
      predictionComparison: fallbackReview.predictionComparison
    }
  };
}

function buildAIPrompt(pageData: MatchPageData, fallbackReview: MatchReview) {
  const compact = compactPageData(pageData, fallbackReview);

  return [
    "너는 2026 FIFA 월드컵 경기 리뷰를 작성하는 한국어 축구 데이터 분석가다.",
    "아래 JSON에 포함된 사실 데이터만 사용한다. 명단, 카드, 부상, 징계, 교체, 득점 장면을 추측하거나 새로 만들지 마라.",
    "부족한 데이터는 반드시 어떤 출처가 필요한지 함께 적어라.",
    "전술 분석 문장은 가능하지만, 사실처럼 단정하지 말고 저장된 포메이션/전술/결측 사유에 근거해라.",
    "응답은 마크다운 없이 JSON 객체 하나만 반환한다.",
    "필드: matchSummary, keyMoments, tacticalReview.homeTeam, tacticalReview.awayTeam, formationChanges, substitutionImpact, playerHighlights, cardAndDisciplineImpact, injuryImpact, fatigueImpact, predictionComparisonNotes, nextMatchImpact, koreaPerspectiveReview.",
    JSON.stringify(compact)
  ].join("\n\n");
}

function applyAIReview(fallbackReview: MatchReview, payload: AIReviewJson, pageData: MatchPageData, model: string): MatchReview {
  const cardAndDiscipline = asStringArray(payload.cardAndDisciplineImpact, fallbackReview.cardAndDisciplineImpact);
  const injuries = asStringArray(payload.injuryImpact, fallbackReview.injuryImpact);

  return {
    ...fallbackReview,
    reviewType: "ai",
    matchSummary: asString(payload.matchSummary, fallbackReview.matchSummary),
    keyMoments: asStringArray(payload.keyMoments, fallbackReview.keyMoments),
    tacticalReview: {
      homeTeam: asString(payload.tacticalReview?.homeTeam, fallbackReview.tacticalReview.homeTeam),
      awayTeam: asString(payload.tacticalReview?.awayTeam, fallbackReview.tacticalReview.awayTeam)
    },
    formationChanges: asStringArray(payload.formationChanges, fallbackReview.formationChanges),
    substitutionImpact: asStringArray(payload.substitutionImpact, fallbackReview.substitutionImpact),
    playerHighlights: asStringArray(payload.playerHighlights, fallbackReview.playerHighlights),
    cardAndDisciplineImpact: cardAndDiscipline,
    injuryImpact: injuries,
    cardAndInjuryImpact: [...cardAndDiscipline, ...injuries],
    fatigueImpact: asStringArray(payload.fatigueImpact, fallbackReview.fatigueImpact),
    predictionComparison: {
      ...fallbackReview.predictionComparison,
      notes: asString(payload.predictionComparisonNotes, fallbackReview.predictionComparison.notes)
    },
    nextMatchImpact: asStringArray(payload.nextMatchImpact, fallbackReview.nextMatchImpact),
    koreaPerspectiveReview:
      typeof payload.koreaPerspectiveReview === "string" && payload.koreaPerspectiveReview.trim().length > 0
        ? payload.koreaPerspectiveReview.trim()
        : fallbackReview.koreaPerspectiveReview,
    metadata: {
      ...createRulesReviewMetadata(pageData, "ai"),
      generatedAt: new Date().toISOString(),
      model,
      cacheKey: createMatchReviewCacheKey(pageData)
    },
    reviewedAt: new Date().toISOString()
  };
}

export async function createAIMatchReview(pageData: MatchPageData): Promise<AIMatchReviewResult> {
  const fallbackReview = createMatchReview(pageData);

  if (!fallbackReview) {
    return {
      ok: false,
      usedAI: false,
      message: "종료 경기 또는 실제 스코어가 없어 AI 경기 리뷰를 생성하지 않았습니다.",
      review: null
    };
  }

  const cacheKey = createMatchReviewCacheKey(pageData);
  const cached = aiReviewCache.get(cacheKey);

  if (cached) {
    getAIState().cacheHitCount += 1;
    getAIState().resultSaveSuccess = true;
    logAIEvent({
      kind: "match-review",
      target: cacheKey,
      status: "cache",
      usedAI: cached.usedAI,
      usedCache: true,
      message: "저장된 AI 경기 리뷰 캐시를 사용했습니다."
    });
    return cached;
  }

  const state = getAIState();

  const ai = await callAIText(buildAIPrompt(pageData, fallbackReview), { kind: "match-review", target: createMatchReviewCacheKey(pageData) });

  if (!ai.ok) {
    const result = {
      ok: true,
      usedAI: false,
      message: `${ai.message} 규칙 기반 리뷰로 fallback했습니다.`,
      review: {
        ...fallbackReview,
        reviewType: "fallback" as const,
        metadata: createRulesReviewMetadata(pageData, "fallback")
      }
    };
    aiReviewCache.set(cacheKey, result);
    state.resultSaveSuccess = true;
    rememberAIFailure("match-review", cacheKey, result.message, {
      model: ai.model,
      httpStatus: ai.httpStatus,
      retryCount: ai.retryCount,
      payloadBytes: ai.payloadBytes,
      fallbackUsed: true,
      timeout: ai.timeout,
      fallbackResultSaved: true,
      screenReflectionStatus: "fallback 저장됨"
    });
    return result;
  }

  const parsed = parseAIJson(ai.text);

  if (!parsed) {
    const result = {
      ok: true,
      usedAI: false,
      message: `AI 응답 JSON 파싱에 실패해 규칙 기반 리뷰로 fallback했습니다. 원문 일부: ${ai.text.slice(0, 240)}`,
      review: {
        ...fallbackReview,
        reviewType: "fallback" as const,
        metadata: createRulesReviewMetadata(pageData, "fallback")
      }
    };
    aiReviewCache.set(cacheKey, result);
    state.resultSaveSuccess = true;
    rememberAIFailure("match-review", cacheKey, result.message, {
      model: ai.model,
      httpStatus: null,
      retryCount: ai.retryCount,
      payloadBytes: ai.payloadBytes,
      fallbackUsed: true,
      timeout: false,
      fallbackResultSaved: true,
      screenReflectionStatus: "fallback 저장됨",
      rawText: ai.text.slice(0, 1200)
    });
    return result;
  }

  const result = {
    ok: true,
    usedAI: true,
    message: ai.fallbackUsed ? `AI fallback 모델(${ai.model})로 경기 리뷰를 생성했습니다.` : "AI 서버 분석으로 경기 리뷰를 생성했습니다.",
    review: applyAIReview(fallbackReview, parsed, pageData, ai.model)
  };
  aiReviewCache.set(cacheKey, result);
  state.lastSuccessAt = result.review.reviewedAt;
  state.resultSaveSuccess = true;
  logAIEvent({
    kind: "match-review",
    target: cacheKey,
    status: "success",
    usedAI: true,
    usedCache: false,
    message: result.message,
    model: ai.model,
    retryCount: ai.retryCount,
    payloadBytes: ai.payloadBytes,
    fallbackUsed: ai.fallbackUsed,
    timeout: false,
    fallbackResultSaved: true,
    screenReflectionStatus: "저장됨"
  });
  return result;
}

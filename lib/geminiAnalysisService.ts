import type { MatchPageData, MatchReview } from "@/types/match";
import { createMatchReview, createMatchReviewCacheKey, createRulesReviewMetadata } from "@/lib/matchReviewService";
import type { GeminiAnalysisKind, GeminiAnalysisLog, GeminiAnalysisRecord, GeminiProviderStatus } from "@/types/gemini";

type GeminiReviewJson = {
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

export type GeminiMatchReviewResult = {
  ok: boolean;
  usedGemini: boolean;
  message: string;
  review: MatchReview | null;
};

const defaultGeminiModel = "gemini-2.0-flash";
const geminiReviewCache = new Map<string, GeminiMatchReviewResult>();

type GeminiState = {
  analysisCache: Map<string, GeminiAnalysisRecord>;
  callCount: number;
  cacheHitCount: number;
  failureCount: number;
  lastCallAt: string | null;
  lastSuccessAt: string | null;
  logs: GeminiAnalysisLog[];
};

type GeminiAnalysisJson = {
  summary?: unknown;
  bulletPoints?: unknown;
  dataGaps?: unknown;
  sources?: unknown;
};

type GeminiAnalysisInput = {
  kind: GeminiAnalysisKind;
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
  var __worldCupGeminiAnalysisState: GeminiState | undefined;
}

function getGeminiState(): GeminiState {
  if (!globalThis.__worldCupGeminiAnalysisState) {
    globalThis.__worldCupGeminiAnalysisState = {
      analysisCache: new Map(),
      callCount: 0,
      cacheHitCount: 0,
      failureCount: 0,
      lastCallAt: null,
      lastSuccessAt: null,
      logs: []
    };
  }

  return globalThis.__worldCupGeminiAnalysisState;
}

function logGeminiEvent(event: Omit<GeminiAnalysisLog, "id" | "createdAt">) {
  const state = getGeminiState();
  state.logs = [
    {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...event
    },
    ...state.logs
  ].slice(0, 40);
}

function rememberGeminiFailure(kind: GeminiAnalysisKind, target: string, message: string) {
  getGeminiState().failureCount += 1;
  logGeminiEvent({
    kind,
    target,
    status: "failed",
    usedGemini: false,
    usedCache: false,
    message
  });
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

function createFallbackAnalysis(input: GeminiAnalysisInput, status: GeminiAnalysisRecord["status"], message: string): GeminiAnalysisRecord {
  return {
    id: `${input.kind}-${input.cacheKey}`,
    kind: input.kind,
    title: input.title,
    status,
    usedGemini: false,
    usedCache: false,
    generatedAt: new Date().toISOString(),
    model: null,
    summary: input.fallbackSummary,
    bulletPoints: input.fallbackBullets ?? [],
    dataGaps: input.fallbackDataGaps ?? [],
    sources: input.sources ?? [],
    message
  };
}

function buildGenericGeminiPrompt(input: GeminiAnalysisInput) {
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

function applyGeminiAnalysisPayload(input: GeminiAnalysisInput, payload: GeminiAnalysisJson, model: string): GeminiAnalysisRecord {
  return {
    id: `${input.kind}-${input.cacheKey}`,
    kind: input.kind,
    title: input.title,
    status: "success",
    usedGemini: true,
    usedCache: false,
    generatedAt: new Date().toISOString(),
    model,
    summary: asString(payload.summary, input.fallbackSummary),
    bulletPoints: asStringArray(payload.bulletPoints, input.fallbackBullets ?? []),
    dataGaps: asStringArray(payload.dataGaps, input.fallbackDataGaps ?? []),
    sources: asStringArray(payload.sources, input.sources ?? []),
    message: "Gemini API 분석을 완료했습니다."
  };
}

export function getGeminiProviderStatus(): GeminiProviderStatus {
  const state = getGeminiState();
  const model = process.env.GEMINI_MODEL || defaultGeminiModel;
  const enabled = Boolean(process.env.GEMINI_API_KEY);

  return {
    enabled,
    model,
    callCount: state.callCount,
    cacheHitCount: state.cacheHitCount,
    failureCount: state.failureCount,
    lastCallAt: state.lastCallAt,
    lastSuccessAt: state.lastSuccessAt,
    logs: state.logs,
    message: enabled
      ? "Gemini API 키가 서버 환경변수에 있어 서버 Route에서만 호출합니다."
      : "GEMINI_API_KEY가 없어 내부 규칙 기반 분석으로 fallback합니다."
  };
}

export async function createGeminiAnalysis(input: GeminiAnalysisInput): Promise<GeminiAnalysisRecord> {
  const state = getGeminiState();
  const cached = state.analysisCache.get(input.cacheKey);

  if (cached) {
    state.cacheHitCount += 1;
    logGeminiEvent({
      kind: input.kind,
      target: input.title,
      status: "cache",
      usedGemini: cached.usedGemini,
      usedCache: true,
      message: "저장된 Gemini 분석 캐시를 사용했습니다."
    });

    return {
      ...cached,
      status: "cache",
      usedCache: true,
      message: "저장된 Gemini 분석 캐시를 사용했습니다."
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || defaultGeminiModel;

  if (!apiKey) {
    const fallback = createFallbackAnalysis(input, "fallback", "GEMINI_API_KEY가 없어 내부 규칙 기반 분석을 사용했습니다.");
    state.analysisCache.set(input.cacheKey, fallback);
    logGeminiEvent({
      kind: input.kind,
      target: input.title,
      status: "fallback",
      usedGemini: false,
      usedCache: false,
      message: fallback.message
    });
    return fallback;
  }

  state.callCount += 1;
  state.lastCallAt = new Date().toISOString();

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: buildGenericGeminiPrompt(input) }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const fallback = createFallbackAnalysis(input, "fallback", `Gemini 응답 오류(${response.status})로 내부 규칙 기반 분석을 사용했습니다.`);
      state.analysisCache.set(input.cacheKey, fallback);
      rememberGeminiFailure(input.kind, input.title, fallback.message);
      return fallback;
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join("\n") ?? "";
    const parsed = parseJsonObject<GeminiAnalysisJson>(text);

    if (!parsed) {
      const fallback = createFallbackAnalysis(input, "fallback", "Gemini JSON 파싱에 실패해 내부 규칙 기반 분석을 사용했습니다.");
      state.analysisCache.set(input.cacheKey, fallback);
      rememberGeminiFailure(input.kind, input.title, fallback.message);
      return fallback;
    }

    const result = applyGeminiAnalysisPayload(input, parsed, model);
    state.analysisCache.set(input.cacheKey, result);
    state.lastSuccessAt = result.generatedAt;
    logGeminiEvent({
      kind: input.kind,
      target: input.title,
      status: "success",
      usedGemini: true,
      usedCache: false,
      message: result.message
    });
    return result;
  } catch {
    const fallback = createFallbackAnalysis(input, "fallback", "Gemini 호출 중 오류가 발생해 내부 규칙 기반 분석을 사용했습니다.");
    state.analysisCache.set(input.cacheKey, fallback);
    rememberGeminiFailure(input.kind, input.title, fallback.message);
    return fallback;
  }
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

function parseGeminiJson(text: string): GeminiReviewJson | null {
  return parseJsonObject<GeminiReviewJson>(text);
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

function buildGeminiPrompt(pageData: MatchPageData, fallbackReview: MatchReview) {
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

function applyGeminiReview(fallbackReview: MatchReview, payload: GeminiReviewJson, pageData: MatchPageData, model: string): MatchReview {
  const cardAndDiscipline = asStringArray(payload.cardAndDisciplineImpact, fallbackReview.cardAndDisciplineImpact);
  const injuries = asStringArray(payload.injuryImpact, fallbackReview.injuryImpact);

  return {
    ...fallbackReview,
    reviewType: "gemini",
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
      ...createRulesReviewMetadata(pageData, "gemini"),
      generatedAt: new Date().toISOString(),
      model,
      cacheKey: createMatchReviewCacheKey(pageData)
    },
    reviewedAt: new Date().toISOString()
  };
}

export async function createGeminiMatchReview(pageData: MatchPageData): Promise<GeminiMatchReviewResult> {
  const fallbackReview = createMatchReview(pageData);

  if (!fallbackReview) {
    return {
      ok: false,
      usedGemini: false,
      message: "종료 경기 또는 실제 스코어가 없어 Gemini 경기 리뷰를 생성하지 않았습니다.",
      review: null
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || defaultGeminiModel;
  const cacheKey = createMatchReviewCacheKey(pageData);
  const cached = geminiReviewCache.get(cacheKey);

  if (cached) {
    getGeminiState().cacheHitCount += 1;
    logGeminiEvent({
      kind: "match-review",
      target: cacheKey,
      status: "cache",
      usedGemini: cached.usedGemini,
      usedCache: true,
      message: "저장된 Gemini 경기 리뷰 캐시를 사용했습니다."
    });
    return cached;
  }

  if (!apiKey) {
    const result = {
      ok: true,
      usedGemini: false,
      message: "GEMINI_API_KEY가 없어 규칙 기반 리뷰로 fallback했습니다.",
      review: {
        ...fallbackReview,
        reviewType: "fallback" as const,
        metadata: createRulesReviewMetadata(pageData, "fallback")
      }
    };
    geminiReviewCache.set(cacheKey, result);
    logGeminiEvent({
      kind: "match-review",
      target: cacheKey,
      status: "fallback",
      usedGemini: false,
      usedCache: false,
      message: result.message
    });
    return result;
  }

  const state = getGeminiState();
  state.callCount += 1;
  state.lastCallAt = new Date().toISOString();

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: buildGeminiPrompt(pageData, fallbackReview) }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const result = {
        ok: true,
        usedGemini: false,
        message: `Gemini 응답 오류(${response.status})로 규칙 기반 리뷰를 표시합니다.`,
        review: {
          ...fallbackReview,
          reviewType: "fallback" as const,
          metadata: createRulesReviewMetadata(pageData, "fallback")
        }
      };
      geminiReviewCache.set(cacheKey, result);
      rememberGeminiFailure("match-review", cacheKey, result.message);
      return result;
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join("\n") ?? "";
    const parsed = parseGeminiJson(text);

    if (!parsed) {
      const result = {
        ok: true,
        usedGemini: false,
        message: "Gemini JSON 파싱에 실패해 규칙 기반 리뷰로 fallback했습니다.",
        review: {
          ...fallbackReview,
          reviewType: "fallback" as const,
          metadata: createRulesReviewMetadata(pageData, "fallback")
        }
      };
      geminiReviewCache.set(cacheKey, result);
      rememberGeminiFailure("match-review", cacheKey, result.message);
      return result;
    }

    const result = {
      ok: true,
      usedGemini: true,
      message: "Gemini 서버 분석으로 경기 리뷰를 생성했습니다.",
      review: applyGeminiReview(fallbackReview, parsed, pageData, model)
    };
    geminiReviewCache.set(cacheKey, result);
    state.lastSuccessAt = result.review.reviewedAt;
    logGeminiEvent({
      kind: "match-review",
      target: cacheKey,
      status: "success",
      usedGemini: true,
      usedCache: false,
      message: result.message
    });
    return result;
  } catch {
    const result = {
      ok: true,
      usedGemini: false,
      message: "Gemini 호출 중 오류가 발생해 규칙 기반 리뷰로 fallback했습니다.",
      review: {
        ...fallbackReview,
        reviewType: "fallback" as const,
        metadata: createRulesReviewMetadata(pageData, "fallback")
      }
    };
    geminiReviewCache.set(cacheKey, result);
    rememberGeminiFailure("match-review", cacheKey, result.message);
    return result;
  }
}

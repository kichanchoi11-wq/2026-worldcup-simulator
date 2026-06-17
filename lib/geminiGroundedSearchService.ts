import type { FreshInfoSource } from "@/types/freshInfo";

export type GroundedSearchResult =
  | {
      ok: true;
      model: string;
      text: string;
      sources: FreshInfoSource[];
      searchUsed: boolean;
      searchedAt: string;
      payloadBytes: number;
      retryCount: number;
      timeout: boolean;
      raw: unknown;
    }
  | {
      ok: false;
      model: string | null;
      message: string;
      sources: FreshInfoSource[];
      searchUsed: false;
      searchedAt: string;
      payloadBytes: number;
      retryCount: number;
      timeout: boolean;
      raw?: unknown;
    };

type GeminiRawResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    groundingMetadata?: {
      groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
      webSearchQueries?: string[];
    };
  }>;
};

type GeminiGroundingMetadata = NonNullable<NonNullable<GeminiRawResponse["candidates"]>[number]["groundingMetadata"]>;

const modelCandidates = ["gemini-2.5-flash", "gemini-2.0-flash"] as const;
const defaultTimeoutMs = 30_000;

function getApiKey() {
  return process.env.GEMINI_API_KEY;
}

function getPrimaryModel() {
  return process.env.GEMINI_MODEL && process.env.GEMINI_MODEL !== "auto" ? process.env.GEMINI_MODEL : modelCandidates[0];
}

function getModelCandidates() {
  return Array.from(new Set([getPrimaryModel(), process.env.GEMINI_FALLBACK_MODEL, ...modelCandidates].filter(Boolean))) as string[];
}

function getTimeoutMs() {
  const value = Number(process.env.GEMINI_FRESH_INFO_TIMEOUT_MS ?? process.env.GEMINI_TIMEOUT_MS);
  return Number.isFinite(value) && value >= defaultTimeoutMs ? value : defaultTimeoutMs;
}

export function isGeminiGroundingConfigured() {
  return Boolean(getApiKey()) && process.env.GEMINI_SEARCH_GROUNDING_ENABLED !== "false";
}

function buildGroundedRequestBody(prompt: string) {
  return JSON.stringify({
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ],
    tools: [{ google_search: {} }],
    generationConfig: {
      temperature: 0.1
    }
  });
}

function parseRawResponse(rawText: string) {
  try {
    return rawText ? JSON.parse(rawText) as GeminiRawResponse : null;
  } catch {
    return null;
  }
}

export async function runGeminiGroundedSearch(prompt: string): Promise<GroundedSearchResult> {
  const searchedAt = new Date().toISOString();
  const apiKey = getApiKey();
  const models = getModelCandidates();
  const body = buildGroundedRequestBody(prompt);
  const payloadBytes = new TextEncoder().encode(body).length;
  let lastFailure: GroundedSearchResult | null = null;

  if (!apiKey) {
    return {
      ok: false,
      model: models[0] ?? null,
      message: "GEMINI_API_KEY가 없어 Gemini 최신 정보 검색을 실행할 수 없습니다.",
      sources: [],
      searchUsed: false,
      searchedAt,
      payloadBytes,
      retryCount: 0,
      timeout: false
    };
  }

  if (process.env.GEMINI_SEARCH_GROUNDING_ENABLED === "false") {
    return {
      ok: false,
      model: models[0] ?? null,
      message: "GEMINI_SEARCH_GROUNDING_ENABLED=false 설정으로 Gemini 검색 grounding이 비활성화되어 있습니다.",
      sources: [],
      searchUsed: false,
      searchedAt,
      payloadBytes,
      retryCount: 0,
      timeout: false
    };
  }

  for (const [index, model] of models.entries()) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), getTimeoutMs());

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body,
        signal: controller.signal
      });
      const rawText = await response.text();
      const raw = parseRawResponse(rawText);

      if (!response.ok) {
        lastFailure = {
          ok: false,
          model,
          message: `Gemini 검색 grounding 응답 오류(${response.status})${rawText ? `: ${rawText.slice(0, 240)}` : ""}`,
          sources: [],
          searchUsed: false,
          searchedAt,
          payloadBytes,
          retryCount: index,
          timeout: false,
          raw
        };
        continue;
      }

      const candidate = raw?.candidates?.[0];
      const text = candidate?.content?.parts?.map((part) => part.text).filter(Boolean).join("\n") ?? "";
      const sources = extractGroundingSources(candidate?.groundingMetadata, searchedAt);

      return {
        ok: true,
        model,
        text,
        sources,
        searchUsed: sources.length > 0,
        searchedAt,
        payloadBytes,
        retryCount: index,
        timeout: false,
        raw
      };
    } catch (error) {
      const timeoutError = error instanceof Error && error.name === "AbortError";
      lastFailure = {
        ok: false,
        model,
        message: timeoutError
          ? `Gemini 검색 grounding 호출 timeout(${getTimeoutMs()}ms)`
          : error instanceof Error
            ? `Gemini 검색 grounding 호출 실패: ${error.message}`
            : "Gemini 검색 grounding 호출 실패",
        sources: [],
        searchUsed: false,
        searchedAt,
        payloadBytes,
        retryCount: index,
        timeout: timeoutError
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  return lastFailure ?? {
    ok: false,
    model: models[0] ?? null,
    message: "Gemini 검색 grounding 호출이 실패했습니다.",
    sources: [],
    searchUsed: false,
    searchedAt,
    payloadBytes,
    retryCount: 0,
    timeout: false
  };
}

function extractGroundingSources(metadata: GeminiGroundingMetadata | undefined, checkedAt: string): FreshInfoSource[] {
  const chunks = metadata?.groundingChunks;

  if (!Array.isArray(chunks)) {
    return [];
  }

  return chunks
    .flatMap((chunk) => {
      const web = chunk.web;
      if (!web?.uri && !web?.title) {
        return [];
      }

      return {
        name: web.title ?? web.uri ?? "Gemini 검색 출처",
        url: web.uri,
        sourceType: "Gemini 검색" as const,
        checkedAt
      };
    });
}

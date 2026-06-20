import {
  getRuntimeProviderAvailability,
  getRuntimeProviderState,
  isRuntimeProviderUsable,
  parseRetryAfterMs,
  recordProviderAttempt,
  recordProviderFailure,
  recordProviderSkipped,
  recordProviderSuccess
} from "@/lib/providerRuntimeState";
import type { FreshInfoSource } from "@/types/freshInfo";

type SearchProvider = "tavily" | "exa";

type ProviderSearchSuccess = {
  ok: true;
  provider: SearchProvider;
  text: string;
  sources: FreshInfoSource[];
  searchUsed: boolean;
  searchedAt: string;
  payloadBytes: number;
  retryCount: number;
  timeout: boolean;
  raw: unknown;
};

type ProviderSearchFailure = {
  ok: false;
  provider: SearchProvider | null;
  message: string;
  sources: FreshInfoSource[];
  searchUsed: false;
  searchedAt: string;
  payloadBytes: number;
  retryCount: number;
  timeout: boolean;
  raw?: unknown;
};

export type LatestInfoSearchResult = ProviderSearchSuccess | ProviderSearchFailure;

type TavilyResponse = {
  answer?: string;
  results?: Array<{
    title?: string;
    url?: string;
    content?: string;
    score?: number;
    published_date?: string;
  }>;
};

type ExaResponse = {
  results?: Array<{
    title?: string;
    url?: string;
    text?: string;
    highlights?: string[];
    publishedDate?: string;
  }>;
};

const defaultTimeoutMs = 12_000;

function getTimeoutMs() {
  const value = Number(process.env.LATEST_INFO_SEARCH_TIMEOUT_MS);
  return Number.isFinite(value) && value >= 1_000 ? value : defaultTimeoutMs;
}

function providerKey(provider: SearchProvider) {
  return provider === "tavily" ? process.env.TAVILY_API_KEY : process.env.EXA_API_KEY;
}

function parsePriority() {
  const configured = (process.env.LATEST_INFO_PROVIDER_PRIORITY ?? "tavily,exa")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item): item is SearchProvider => item === "tavily" || item === "exa");
  return configured.length > 0 ? configured : ["tavily", "exa"] satisfies SearchProvider[];
}

function providerOrder() {
  return parsePriority()
    .map((provider) => getRuntimeProviderState(provider))
    .filter((state) => state.enabled && isRuntimeProviderUsable(state.provider as SearchProvider))
    .sort((a, b) => {
      if (a.usedToday !== b.usedToday) return a.usedToday - b.usedToday;
      return parsePriority().indexOf(a.provider as SearchProvider) - parsePriority().indexOf(b.provider as SearchProvider);
    })
    .map((state) => state.provider as SearchProvider);
}

export function getLatestInfoSearchProviders() {
  return providerOrder();
}

export function isLatestInfoSearchConfigured() {
  return Boolean(process.env.TAVILY_API_KEY || process.env.EXA_API_KEY);
}

function asJson(rawText: string) {
  try {
    return rawText ? JSON.parse(rawText) as unknown : null;
  } catch {
    return null;
  }
}

function sourceType(provider: SearchProvider) {
  return provider === "tavily" ? "Tavily 검색" as const : "Exa 검색" as const;
}

function normalizeSources(provider: SearchProvider, raw: unknown, checkedAt: string): FreshInfoSource[] {
  const rows =
    provider === "tavily"
      ? ((raw as TavilyResponse | null)?.results ?? []).map((item) => ({
          name: item.title ?? item.url ?? "Tavily 검색 결과",
          url: item.url
        }))
      : ((raw as ExaResponse | null)?.results ?? []).map((item) => ({
          name: item.title ?? item.url ?? "Exa 검색 결과",
          url: item.url
        }));

  return rows
    .filter((item) => item.name || item.url)
    .slice(0, 6)
    .map((item) => ({
      name: item.name,
      url: item.url,
      sourceType: sourceType(provider),
      checkedAt
    }));
}

function summarize(provider: SearchProvider, raw: unknown) {
  if (provider === "tavily") {
    const data = raw as TavilyResponse | null;
    const answer = data?.answer?.trim();
    const snippets = (data?.results ?? []).map((item) => item.content).filter(Boolean).slice(0, 4).join("\n");
    return answer || snippets || "Tavily 검색 결과 출처를 확인했습니다.";
  }

  const data = raw as ExaResponse | null;
  const snippets = (data?.results ?? [])
    .flatMap((item) => [item.text, ...(item.highlights ?? [])])
    .filter(Boolean)
    .slice(0, 4)
    .join("\n");
  return snippets || "Exa 검색 결과 출처를 확인했습니다.";
}

function buildTavilyBody(query: string) {
  return JSON.stringify({
    api_key: process.env.TAVILY_API_KEY,
    query,
    search_depth: "basic",
    include_answer: true,
    include_raw_content: false,
    max_results: 6
  });
}

function buildExaBody(query: string) {
  return JSON.stringify({
    query,
    type: "auto",
    numResults: 6,
    contents: {
      text: { maxCharacters: 900 },
      highlights: { numSentences: 2 }
    }
  });
}

async function callSearchProvider(provider: SearchProvider, query: string, retryCount: number): Promise<LatestInfoSearchResult> {
  const searchedAt = new Date().toISOString();
  const apiKey = providerKey(provider);
  const body = provider === "tavily" ? buildTavilyBody(query) : buildExaBody(query);
  const payloadBytes = new TextEncoder().encode(body).length;

  if (!apiKey) {
    return {
      ok: false,
      provider,
      message: `${provider === "tavily" ? "TAVILY_API_KEY" : "EXA_API_KEY"}가 없어 최신 정보 검색을 건너뜁니다.`,
      sources: [],
      searchUsed: false,
      searchedAt,
      payloadBytes,
      retryCount,
      timeout: false
    };
  }

  const availability = getRuntimeProviderAvailability(provider);
  if (!availability.usable) {
    const reason = availability.reason ?? "unknown";
    recordProviderSkipped(provider, reason, availability.message);
    return {
      ok: false,
      provider,
      message: `${provider} 검색 provider 호출 보류: ${reason} · ${availability.message}`,
      sources: [],
      searchUsed: false,
      searchedAt,
      payloadBytes,
      retryCount,
      timeout: false
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs());

  try {
    recordProviderAttempt(provider, true, null);
    const response = await fetch(provider === "tavily" ? "https://api.tavily.com/search" : "https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(provider === "tavily"
          ? { Authorization: `Bearer ${apiKey}` }
          : { "x-api-key": apiKey })
      },
      body,
      signal: controller.signal
    });
    const rawText = await response.text();
    const raw = asJson(rawText);

    if (!response.ok) {
      const message = `${provider} 검색 응답 오류(${response.status})${rawText ? `: ${rawText.slice(0, 240)}` : ""}`;
      recordProviderFailure(provider, response.status, message, {
        retryAfterMs: parseRetryAfterMs(response.headers.get("retry-after")),
        actualHttp: true
      });
      return {
        ok: false,
        provider,
        message,
        sources: [],
        searchUsed: false,
        searchedAt,
        payloadBytes,
        retryCount,
        timeout: false,
        raw
      };
    }

    const sources = normalizeSources(provider, raw, searchedAt);
    recordProviderSuccess(provider, response.status);
    return {
      ok: true,
      provider,
      text: summarize(provider, raw),
      sources,
      searchUsed: sources.length > 0,
      searchedAt,
      payloadBytes,
      retryCount,
      timeout: false,
      raw
    };
  } catch (error) {
    const timeoutError = error instanceof Error && error.name === "AbortError";
    const message = timeoutError
      ? `${provider} 검색 timeout(${getTimeoutMs()}ms)`
      : error instanceof Error
        ? `${provider} 검색 실패: ${error.message}`
        : `${provider} 검색 실패`;
    recordProviderFailure(provider, null, message, { actualHttp: false });
    return {
      ok: false,
      provider,
      message,
      sources: [],
      searchUsed: false,
      searchedAt,
      payloadBytes,
      retryCount,
      timeout: timeoutError
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function runLatestInfoSearch(query: string): Promise<LatestInfoSearchResult> {
  const searchedAt = new Date().toISOString();
  const providers = providerOrder();

  if (providers.length === 0) {
    return {
      ok: false,
      provider: null,
      message: isLatestInfoSearchConfigured()
        ? "Tavily/Exa 검색 provider가 cooldown 또는 soft limit 상태입니다."
        : "TAVILY_API_KEY와 EXA_API_KEY가 없어 최신 정보 검색을 실행할 수 없습니다.",
      sources: [],
      searchUsed: false,
      searchedAt,
      payloadBytes: new TextEncoder().encode(query).length,
      retryCount: 0,
      timeout: false
    };
  }

  let lastFailure: LatestInfoSearchResult | null = null;
  for (const [index, provider] of providers.entries()) {
    const result = await callSearchProvider(provider, query, index);
    if (result.ok && result.sources.length > 0) return result;
    lastFailure = result;
  }

  return lastFailure ?? {
    ok: false,
    provider: null,
    message: "Tavily/Exa 검색 호출이 실패했습니다.",
    sources: [],
    searchUsed: false,
    searchedAt,
    payloadBytes: new TextEncoder().encode(query).length,
    retryCount: 0,
    timeout: false
  };
}

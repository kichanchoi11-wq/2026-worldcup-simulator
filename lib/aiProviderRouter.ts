import {
  classifyProviderFailure,
  getRuntimeProviderAvailability,
  getRuntimeProviderState,
  parseRetryAfterMs,
  recordProviderAttempt,
  recordProviderFailure,
  recordProviderHealthCheck,
  recordProviderSkipped,
  recordProviderSuccess
} from "@/lib/providerRuntimeState";
import type { AIErrorType, AIProviderName, ProviderFailureKind } from "@/types/ai";

type ChatProvider = "groq" | "openrouter";

export type AITextResult =
  | {
      ok: true;
      provider: ChatProvider;
      model: string;
      text: string;
      httpStatus: number;
      payloadBytes: number;
      fallbackUsed: boolean;
      retryCount: number;
      timeout: false;
      errorType?: null;
    }
  | {
      ok: false;
      provider: AIProviderName;
      model: string | null;
      message: string;
      httpStatus: number | null;
      payloadBytes: number;
      fallbackUsed: boolean;
      retryCount: number;
      timeout: boolean;
      errorType: AIErrorType;
    };

const systemPrompt = [
  "너는 2026 FIFA 월드컵 시뮬레이터의 한국어 축구 데이터 분석 엔진이다.",
  "반드시 제공된 경기 데이터, 저장 JSON, API 응답, 검색 출처 정보만 사용한다.",
  "제공되지 않은 부상, 카드, 체력, 라인업, 감독 전술, 선수 상태를 임의로 만들지 않는다.",
  "정보가 부족하면 부족하다고 명확히 쓰고, 예측은 가능성 표현으로 작성한다.",
  "응답은 요청된 JSON 형식만 반환한다."
].join("\n");

function envNumber(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 1_000 ? value : fallback;
}

export function getMaxAIPayloadBytes() {
  const value = Number(process.env.AI_MAX_PAYLOAD_BYTES);
  return Number.isFinite(value) && value > 0 ? value : 24_000;
}

export function getAITargetPayloadBytes() {
  const value = Number(process.env.AI_TARGET_PAYLOAD_BYTES);
  return Number.isFinite(value) && value > 0 ? value : 16_000;
}

export function getAIChunkMaxPayloadBytes() {
  const value = Number(process.env.AI_CHUNK_MAX_PAYLOAD_BYTES);
  return Number.isFinite(value) && value > 0 ? value : 14_000;
}

export function getAIHardPayloadBytes() {
  const value = Number(process.env.AI_HARD_PAYLOAD_BYTES);
  const maxPayloadBytes = getMaxAIPayloadBytes();
  return Number.isFinite(value) && value > 0 ? value : Math.min(maxPayloadBytes, 22_000);
}

export function getAIProviderTimeoutMs(provider: ChatProvider = "groq") {
  return provider === "groq" ? envNumber("GROQ_TIMEOUT_MS", 15_000) : envNumber("OPENROUTER_TIMEOUT_MS", 15_000);
}

export function getPrimaryAIModel() {
  return process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
}

export function getFallbackAIModel() {
  return process.env.OPENROUTER_MODEL || "meta-llama/llama-3.2-3b-instruct:free";
}

function providerConfig(provider: ChatProvider) {
  if (provider === "groq") {
    return {
      apiKey: process.env.GROQ_API_KEY,
      url: "https://api.groq.com/openai/v1/chat/completions",
      model: getPrimaryAIModel(),
      headers: {} as Record<string, string>
    };
  }

  return {
    apiKey: process.env.OPENROUTER_API_KEY,
    url: "https://openrouter.ai/api/v1/chat/completions",
    model: getFallbackAIModel(),
    headers: {
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://2026-worldcup-simulator-teal.vercel.app",
      "X-Title": process.env.OPENROUTER_APP_NAME || "2026 World Cup Simulator"
    } as Record<string, string>
  };
}

function buildBody(model: string, prompt: string) {
  return JSON.stringify({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ],
    temperature: 0.2,
    max_tokens: Number(process.env.AI_MAX_OUTPUT_TOKENS) || 450,
    response_format: { type: "json_object" }
  });
}

function buildHealthCheckBody(model: string) {
  return JSON.stringify({
    model,
    messages: [
      { role: "system", content: "You are a health-check endpoint. Respond with exactly OK." },
      { role: "user", content: "Respond with exactly: OK" }
    ],
    temperature: 0,
    max_tokens: 8
  });
}

function payloadSize(model: string, prompt: string) {
  return new TextEncoder().encode(buildBody(model, prompt)).length;
}

export function estimateAITextPayloadBytes(prompt: string, provider: ChatProvider = "groq") {
  return payloadSize(provider === "groq" ? getPrimaryAIModel() : getFallbackAIModel(), prompt);
}

function extractText(data: unknown) {
  const choice = (data as { choices?: Array<{ message?: { content?: unknown } }> }).choices?.[0];
  const content = choice?.message?.content;
  return typeof content === "string" ? content : "";
}

let providerQueue = Promise.resolve();
let lastProviderRequestAt = 0;

async function withProviderQueue<T>(task: () => Promise<T>): Promise<T> {
  const queued = providerQueue.catch(() => undefined).then(async () => {
    const minIntervalMs = envNumber("AI_MIN_REQUEST_INTERVAL_MS", envNumber("AI_PROVIDER_MIN_INTERVAL_MS", 5_000));
    const elapsed = Date.now() - lastProviderRequestAt;
    if (elapsed < minIntervalMs) {
      await new Promise((resolve) => setTimeout(resolve, minIntervalMs - elapsed));
    }
    lastProviderRequestAt = Date.now();
    return task();
  });

  providerQueue = queued.then(
    () => undefined,
    () => undefined
  );

  return queued;
}

function errorTypeFromFailure(kind: ProviderFailureKind, status: number | null): AIErrorType {
  if (kind === "rate_limited" || kind === "quota_exceeded" || kind === "cooldown_active" || kind === "soft_limit_active") {
    return kind === "quota_exceeded" ? "provider_quota_exceeded" : "provider_rate_limited";
  }
  if (kind === "auth_error") return "provider_auth_error";
  if (kind === "model_not_found") return "model_not_found";
  if (kind === "payload_too_large") return "payload_too_large_before_request";
  if (kind === "invalid_response") return "invalid_response";
  if (kind === "request_aborted") return "provider_aborted";
  if (kind === "timeout") return "provider_timeout";
  if (status === 401 || status === 403) return "provider_auth_error";
  if (status === 404) return "model_not_found";
  if (status === 429) return "provider_rate_limited";
  return "provider_network_error";
}

function shouldBlockAfterHealthCheck(kind: ProviderFailureKind | null, status: number | null) {
  return kind === "rate_limited" || kind === "quota_exceeded" || kind === "auth_error" || kind === "model_not_found" || status === 401 || status === 403 || status === 404 || status === 429;
}

function providerAbortMessage(provider: ChatProvider, timeoutMs: number, scope: "health-check" | "analysis") {
  return `${provider} ${scope} request_aborted: AbortController timeout ${timeoutMs}ms`;
}

async function callProvider(provider: ChatProvider, prompt: string, retryCount: number): Promise<AITextResult> {
  const config = providerConfig(provider);
  const body = buildBody(config.model, prompt);
  const payloadBytes = new TextEncoder().encode(body).length;

  if (!config.apiKey) {
    return {
      ok: false,
      provider,
      model: config.model,
      message: `${provider === "groq" ? "GROQ_API_KEY" : "OPENROUTER_API_KEY"}가 없어 ${provider} 호출을 건너뜁니다.`,
      httpStatus: null,
      payloadBytes,
      fallbackUsed: provider !== "groq",
      retryCount,
      timeout: false,
      errorType: "provider_auth_error"
    };
  }

  const availability = getRuntimeProviderAvailability(provider);
  if (!availability.usable) {
    const reason = availability.reason ?? "unknown";
    recordProviderSkipped(provider, reason, availability.message);
    return {
      ok: false,
      provider,
      model: config.model,
      message: `${provider} provider 호출 보류: ${reason} · ${availability.message}`,
      httpStatus: null,
      payloadBytes,
      fallbackUsed: provider !== "groq",
      retryCount,
      timeout: false,
      errorType: reason === "soft_limit_active" || reason === "cooldown_active" ? "provider_rate_limited" : "provider_auth_error"
    };
  }

  const previousState = getRuntimeProviderState(provider);
  if (
    (previousState.lastFailureKind === "rate_limited" || previousState.lastFailureKind === "quota_exceeded") &&
    previousState.healthCheckStatus !== "ok"
  ) {
    const health = await runProviderHealthCheck(provider);
    if (!health.ok && shouldBlockAfterHealthCheck(health.failureKind ?? null, health.httpStatus)) {
      return {
        ok: false,
        provider,
        model: config.model,
        message: health.message,
        httpStatus: health.httpStatus,
        payloadBytes,
        fallbackUsed: provider !== "groq",
        retryCount,
        timeout: health.failureKind === "timeout",
        errorType: errorTypeFromFailure(health.failureKind ?? "unknown", health.httpStatus)
      };
    }
  }

  const controller = new AbortController();
  const timeoutMs = getAIProviderTimeoutMs(provider);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    recordProviderAttempt(provider, true, null);
    const response = await withProviderQueue(() => fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        ...config.headers
      },
      body,
      signal: controller.signal
    }));
    const text = await response.text();

    if (!response.ok) {
      const message = `${provider} 응답 오류(${response.status})${text ? `: ${text.slice(0, 240)}` : ""}`;
      const failureKind = classifyProviderFailure(response.status, message);
      recordProviderFailure(provider, response.status, message, {
        retryAfterMs: parseRetryAfterMs(response.headers.get("retry-after")),
        actualHttp: true
      });
      return {
        ok: false,
        provider,
        model: config.model,
        message,
        httpStatus: response.status,
        payloadBytes,
        fallbackUsed: provider !== "groq",
        retryCount,
        timeout: false,
        errorType: errorTypeFromFailure(failureKind, response.status)
      };
    }

    const data = JSON.parse(text) as unknown;
    const content = extractText(data);
    if (!content) {
      const message = `${provider} 응답에서 content를 찾지 못했습니다.`;
      recordProviderFailure(provider, response.status, message, { actualHttp: true });
      return {
        ok: false,
        provider,
        model: config.model,
        message,
        httpStatus: response.status,
        payloadBytes,
        fallbackUsed: provider !== "groq",
        retryCount,
        timeout: false,
        errorType: "invalid_response"
      };
    }
    recordProviderSuccess(provider, response.status);
    return {
      ok: true,
      provider,
      model: config.model,
      text: content,
      httpStatus: response.status,
      payloadBytes,
      fallbackUsed: provider !== "groq",
      retryCount,
      timeout: false,
      errorType: null
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    const message = aborted
      ? providerAbortMessage(provider, timeoutMs, "analysis")
      : error instanceof Error
        ? `${provider} 호출 실패: ${error.message}`
        : `${provider} 호출 실패`;
    const failureKind = classifyProviderFailure(null, message);
    recordProviderFailure(provider, null, message, { actualHttp: false });
    return {
      ok: false,
      provider,
      model: config.model,
      message,
      httpStatus: null,
      payloadBytes,
      fallbackUsed: provider !== "groq",
      retryCount,
      timeout: failureKind === "timeout" || aborted,
      errorType: errorTypeFromFailure(failureKind, null)
    };
  } finally {
    clearTimeout(timeout);
  }
}

function getProviderHealthCheckTimeoutMs(provider: ChatProvider) {
  const envName = provider === "groq" ? "GROQ_HEALTHCHECK_TIMEOUT_MS" : "OPENROUTER_HEALTHCHECK_TIMEOUT_MS";
  return envNumber(envName, provider === "openrouter" ? 15_000 : 8_000);
}

async function runProviderHealthCheck(provider: ChatProvider): Promise<{ ok: boolean; httpStatus: number | null; message: string; failureKind?: ProviderFailureKind | null }> {
  const config = providerConfig(provider);
  if (!config.apiKey) {
    return { ok: false, httpStatus: null, message: `${provider} health-check 생략: API 키 없음`, failureKind: "auth_error" };
  }

  const controller = new AbortController();
  const timeoutMs = getProviderHealthCheckTimeoutMs(provider);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    recordProviderAttempt(provider, true, null);
    const response = await withProviderQueue(() => fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        ...config.headers
      },
      body: buildHealthCheckBody(config.model),
      signal: controller.signal
    }));
    const text = await response.text();
    if (!response.ok) {
      const message = `${provider} health-check 실패(${response.status})${text ? `: ${text.slice(0, 180)}` : ""}`;
      recordProviderFailure(provider, response.status, message, {
        retryAfterMs: parseRetryAfterMs(response.headers.get("retry-after")),
        actualHttp: true
      });
      recordProviderHealthCheck(provider, false, response.status, message);
      return { ok: false, httpStatus: response.status, message, failureKind: classifyProviderFailure(response.status, message) };
    }

    recordProviderHealthCheck(provider, true, response.status, `${provider} health-check OK`);
    return { ok: true, httpStatus: response.status, message: `${provider} health-check OK`, failureKind: null };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    const message = aborted
      ? providerAbortMessage(provider, timeoutMs, "health-check")
      : error instanceof Error
        ? `${provider} health-check 오류: ${error.message}`
        : `${provider} health-check 오류`;
    const failureKind = classifyProviderFailure(null, message);
    recordProviderFailure(provider, null, message, { actualHttp: false });
    recordProviderHealthCheck(provider, false, null, message);
    return { ok: false, httpStatus: null, message, failureKind };
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateAIText(prompt: string): Promise<AITextResult> {
  const estimatedPayloadBytes = payloadSize(getPrimaryAIModel(), prompt);
  const hardPayloadBytes = getAIHardPayloadBytes();
  if (estimatedPayloadBytes > hardPayloadBytes) {
    return {
      ok: false,
      provider: "rule-based",
      model: null,
      message: `AI payload가 ${estimatedPayloadBytes} bytes로 hard limit(${hardPayloadBytes} bytes)을 초과해 API 호출 없이 규칙 기반 fallback을 사용합니다.`,
      httpStatus: null,
      payloadBytes: estimatedPayloadBytes,
      fallbackUsed: true,
      retryCount: 0,
      timeout: false,
      errorType: "payload_too_large_before_request"
    };
  }

  if (process.env.DISABLE_AI_PROVIDERS === "true") {
    return {
      ok: false,
      provider: "rule-based",
      model: null,
      message: "DISABLE_AI_PROVIDERS=true 설정으로 규칙 기반 fallback을 사용합니다.",
      httpStatus: null,
      payloadBytes: estimatedPayloadBytes,
      fallbackUsed: true,
      retryCount: 0,
      timeout: false,
      errorType: "unknown"
    };
  }

  const groq = await callProvider("groq", prompt, 0);
  if (groq.ok) return groq;

  const openRouter = await callProvider("openrouter", prompt, 1);
  if (openRouter.ok) return openRouter;

  return {
    ok: false,
    provider: "rule-based",
    model: openRouter.model ?? groq.model,
    message: `${groq.message} OpenRouter fallback도 실패했습니다: ${openRouter.message}`,
    httpStatus: openRouter.httpStatus ?? groq.httpStatus,
    payloadBytes: Math.max(openRouter.payloadBytes, groq.payloadBytes),
    fallbackUsed: true,
    retryCount: 1,
    timeout: groq.timeout || openRouter.timeout,
    errorType: openRouter.errorType ?? groq.errorType ?? "unknown"
  };
}

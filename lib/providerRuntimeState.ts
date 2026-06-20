import { createHash } from "crypto";
import type { AIProviderRuntimeState, ProviderFailureKind, ProviderRuntimeStatus, RuntimeProviderName } from "@/types/ai";

type RuntimeState = {
  providers: Map<string, AIProviderRuntimeState>;
};

declare global {
  var __worldCupProviderRuntimeState: RuntimeState | undefined;
}

function getState(): RuntimeState {
  if (!globalThis.__worldCupProviderRuntimeState) {
    globalThis.__worldCupProviderRuntimeState = {
      providers: new Map()
    };
  }

  return globalThis.__worldCupProviderRuntimeState;
}

function dateKey() {
  return new Date().toISOString().slice(0, 10);
}

function envNumber(name: string, fallback: number | null = null) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function providerApiKey(provider: RuntimeProviderName) {
  if (provider === "groq") return process.env.GROQ_API_KEY;
  if (provider === "openrouter") return process.env.OPENROUTER_API_KEY;
  if (provider === "tavily") return process.env.TAVILY_API_KEY;
  return process.env.EXA_API_KEY;
}

function apiKeyFingerprint(provider: RuntimeProviderName) {
  const key = providerApiKey(provider);
  return key ? createHash("sha256").update(key).digest("hex").slice(0, 10) : null;
}

function providerModel(provider: RuntimeProviderName) {
  if (provider === "groq") return process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  if (provider === "openrouter") return process.env.OPENROUTER_MODEL || "meta-llama/llama-3.2-3b-instruct:free";
  return provider;
}

function providerEnabled(provider: RuntimeProviderName) {
  return Boolean(providerApiKey(provider));
}

function stateKey(provider: RuntimeProviderName) {
  return `${provider}:${providerModel(provider)}:${apiKeyFingerprint(provider) ?? "no-key"}`;
}

function dailySoftLimit(provider: RuntimeProviderName) {
  if (provider === "groq") return envNumber("GROQ_DAILY_SOFT_LIMIT");
  if (provider === "openrouter") return envNumber("OPENROUTER_DAILY_SOFT_LIMIT");
  if (provider === "tavily") return envNumber("TAVILY_DAILY_SOFT_LIMIT");
  return envNumber("EXA_DAILY_SOFT_LIMIT");
}

function rpmSoftLimit(provider: RuntimeProviderName) {
  if (provider === "groq") return envNumber("GROQ_RPM_SOFT_LIMIT");
  if (provider === "openrouter") return envNumber("OPENROUTER_RPM_SOFT_LIMIT");
  return null;
}

function baseState(provider: RuntimeProviderName): AIProviderRuntimeState {
  const enabled = providerEnabled(provider);
  return {
    provider,
    status: enabled ? "available" : "disabled",
    model: providerModel(provider),
    enabled,
    apiKeyFingerprint: apiKeyFingerprint(provider),
    usedToday: 0,
    dailySoftLimit: dailySoftLimit(provider),
    rpmSoftLimit: rpmSoftLimit(provider),
    lastAttempted: false,
    lastAttemptAt: null,
    lastActualHttpAt: null,
    lastHttpStatus: null,
    lastFailureKind: null,
    cooldownUntil: null,
    cooldownStartedAt: null,
    cooldownReason: null,
    healthCheckAt: null,
    healthCheckStatus: null,
    healthCheckMessage: null,
    lastSuccessAt: null,
    lastFailureAt: null,
    lastFailureMessage: null
  };
}

function isActiveCooldown(state: AIProviderRuntimeState) {
  return Boolean(state.cooldownUntil && new Date(state.cooldownUntil).getTime() > Date.now());
}

function publicStatus(state: AIProviderRuntimeState): ProviderRuntimeStatus {
  if (!state.enabled) return "disabled";
  if (isActiveCooldown(state)) return state.status === "quota_exceeded" ? "quota_exceeded" : "cooling_down";
  if (state.dailySoftLimit !== null && state.usedToday >= state.dailySoftLimit) return "soft_limit_active";
  if (state.lastFailureKind === "auth_error") return "auth_error";
  if (state.lastFailureKind === "model_not_found") return "model_not_found";
  if (state.lastFailureKind === "network_error") return "network_error";
  if (state.lastFailureKind === "request_aborted") return "request_aborted";
  if (state.lastFailureKind === "timeout") return "timeout";
  if (state.lastFailureKind === "payload_too_large") return "payload_too_large";
  if (state.lastFailureKind === "invalid_response") return "invalid_response";
  return "available";
}

export function getProviderCooldownMs(provider?: RuntimeProviderName) {
  const providerSpecific =
    provider === "groq"
      ? envNumber("GROQ_COOLDOWN_MINUTES")
      : provider === "openrouter"
        ? envNumber("OPENROUTER_COOLDOWN_MINUTES")
        : provider === "tavily"
          ? envNumber("TAVILY_COOLDOWN_MINUTES")
          : provider === "exa"
            ? envNumber("EXA_COOLDOWN_MINUTES")
            : null;
  const minutes = providerSpecific ?? envNumber("PROVIDER_COOLDOWN_MINUTES", 30) ?? 30;
  return minutes * 60 * 1000;
}

export function classifyProviderFailure(status: number | null, message: string): ProviderFailureKind {
  const lower = message.toLowerCase();
  if (status === 429 || lower.includes("rate_limit") || lower.includes("too many requests") || lower.includes("rpm")) {
    return "rate_limited";
  }
  if (
    lower.includes("quota_exceeded") ||
    lower.includes("daily limit exceeded") ||
    lower.includes("requests per day exceeded") ||
    lower.includes("insufficient_quota") ||
    lower.includes("rpd")
  ) {
    return "quota_exceeded";
  }
  if (status === 401 || status === 403 || lower.includes("unauthorized") || lower.includes("invalid api key")) return "auth_error";
  if (status === 404 || lower.includes("model_not_found") || lower.includes("model not found")) return "model_not_found";
  if (lower.includes("payload") && (lower.includes("too large") || lower.includes("hard limit") || lower.includes("초과"))) return "payload_too_large";
  if (lower.includes("invalid response") || lower.includes("json")) return "invalid_response";
  if (lower.includes("abort") || lower.includes("operation was aborted") || lower.includes("request_aborted")) return "request_aborted";
  if (lower.includes("timeout") || lower.includes("timed out")) return "timeout";
  if (status === null || status >= 500 || lower.includes("network") || lower.includes("fetch failed")) return "network_error";
  return "unknown";
}

export function classifyQuotaOrRateLimit(status: number | null, message: string) {
  const kind = classifyProviderFailure(status, message);
  return kind === "rate_limited" || kind === "quota_exceeded";
}

function shouldCooldown(kind: ProviderFailureKind, retryAfterMs: number | null | undefined) {
  return kind === "rate_limited" || kind === "quota_exceeded" || Boolean(retryAfterMs && retryAfterMs > 0);
}

export function parseRetryAfterMs(value: string | null) {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000;
  const dateMs = new Date(value).getTime();
  return Number.isFinite(dateMs) && dateMs > Date.now() ? dateMs - Date.now() : null;
}

export function getRuntimeProviderState(provider: RuntimeProviderName): AIProviderRuntimeState {
  const state = getState();
  const key = stateKey(provider);
  const current = state.providers.get(key) ?? baseState(provider);
  const enabled = providerEnabled(provider);
  const next: AIProviderRuntimeState = {
    ...current,
    provider,
    model: providerModel(provider),
    enabled,
    apiKeyFingerprint: apiKeyFingerprint(provider),
    dailySoftLimit: dailySoftLimit(provider),
    rpmSoftLimit: rpmSoftLimit(provider)
  };
  next.status = publicStatus(next);
  if (!isActiveCooldown(next) && next.cooldownUntil) {
    next.cooldownUntil = null;
    next.cooldownStartedAt = null;
    next.cooldownReason = null;
    if (next.status === "cooling_down" || next.status === "quota_exceeded") {
      next.status = publicStatus(next);
    }
  }
  state.providers.set(key, next);
  return next;
}

export function getRuntimeProviderAvailability(provider: RuntimeProviderName) {
  const state = getRuntimeProviderState(provider);
  if (!state.enabled || state.status === "disabled") {
    return { usable: false, reason: "auth_error" as ProviderFailureKind, state, message: "API 키가 설정되지 않았습니다." };
  }
  if (isActiveCooldown(state)) {
    return { usable: false, reason: "cooldown_active" as ProviderFailureKind, state, message: `cooldown 활성 상태입니다. 만료: ${state.cooldownUntil}` };
  }
  if (state.dailySoftLimit !== null && state.usedToday >= state.dailySoftLimit) {
    return { usable: false, reason: "soft_limit_active" as ProviderFailureKind, state, message: `일일 soft limit ${state.dailySoftLimit}회에 도달했습니다.` };
  }
  return { usable: true, reason: null, state, message: "호출 가능" };
}

export function isRuntimeProviderUsable(provider: RuntimeProviderName) {
  return getRuntimeProviderAvailability(provider).usable;
}

export function recordProviderAttempt(provider: RuntimeProviderName, actualHttp: boolean, status: number | null = null) {
  const state = getState();
  const key = stateKey(provider);
  const current = getRuntimeProviderState(provider);
  state.providers.set(key, {
    ...current,
    lastAttempted: true,
    lastAttemptAt: new Date().toISOString(),
    lastActualHttpAt: actualHttp ? new Date().toISOString() : current.lastActualHttpAt,
    lastHttpStatus: status ?? current.lastHttpStatus
  });
}

export function recordProviderSuccess(provider: RuntimeProviderName, status: number | null = 200) {
  const state = getState();
  const key = stateKey(provider);
  const current = getRuntimeProviderState(provider);
  state.providers.set(key, {
    ...current,
    status: "available",
    usedToday: current.usedToday + 1,
    lastAttempted: true,
    lastAttemptAt: new Date().toISOString(),
    lastActualHttpAt: new Date().toISOString(),
    lastHttpStatus: status,
    lastFailureKind: null,
    cooldownUntil: null,
    cooldownStartedAt: null,
    cooldownReason: null,
    healthCheckStatus: "ok",
    healthCheckAt: new Date().toISOString(),
    healthCheckMessage: "최근 HTTP 호출 성공",
    lastSuccessAt: new Date().toISOString(),
    lastFailureMessage: current.lastFailureMessage
  });
}

export function recordProviderFailure(
  provider: RuntimeProviderName,
  status: number | null,
  message: string,
  options: { retryAfterMs?: number | null; actualHttp?: boolean } = {}
) {
  const state = getState();
  const key = stateKey(provider);
  const current = getRuntimeProviderState(provider);
  const kind = classifyProviderFailure(status, message);
  const cooldown = shouldCooldown(kind, options.retryAfterMs);
  const cooldownMs = options.retryAfterMs && options.retryAfterMs > 0 ? options.retryAfterMs : getProviderCooldownMs(provider);
  const nextStatus: ProviderRuntimeStatus = cooldown ? (kind === "quota_exceeded" ? "quota_exceeded" : "cooling_down") : publicStatus({ ...current, lastFailureKind: kind });

  state.providers.set(key, {
    ...current,
    status: nextStatus,
    lastAttempted: true,
    lastAttemptAt: new Date().toISOString(),
    lastActualHttpAt: options.actualHttp === false ? current.lastActualHttpAt : new Date().toISOString(),
    lastHttpStatus: status,
    lastFailureKind: kind,
    cooldownUntil: cooldown ? new Date(Date.now() + cooldownMs).toISOString() : current.cooldownUntil && isActiveCooldown(current) ? current.cooldownUntil : null,
    cooldownStartedAt: cooldown ? new Date().toISOString() : current.cooldownStartedAt && isActiveCooldown(current) ? current.cooldownStartedAt : null,
    cooldownReason: cooldown ? message.slice(0, 500) : null,
    healthCheckStatus: cooldown ? "skipped" : current.healthCheckStatus,
    healthCheckMessage: cooldown ? "rate/quota 응답으로 cooldown 설정" : current.healthCheckMessage,
    lastFailureAt: new Date().toISOString(),
    lastFailureMessage: message.slice(0, 500)
  });
}

export function recordProviderSkipped(provider: RuntimeProviderName, kind: ProviderFailureKind, message: string) {
  const state = getState();
  const key = stateKey(provider);
  const current = getRuntimeProviderState(provider);
  state.providers.set(key, {
    ...current,
    status: kind === "soft_limit_active" ? "soft_limit_active" : current.status,
    lastAttempted: false,
    lastAttemptAt: new Date().toISOString(),
    lastFailureKind: kind,
    lastFailureAt: new Date().toISOString(),
    lastFailureMessage: message.slice(0, 500)
  });
}

export function recordProviderHealthCheck(provider: RuntimeProviderName, ok: boolean, status: number | null, message: string) {
  const state = getState();
  const key = stateKey(provider);
  const current = getRuntimeProviderState(provider);
  state.providers.set(key, {
    ...current,
    status: ok ? "available" : current.status,
    healthCheckAt: new Date().toISOString(),
    healthCheckStatus: ok ? "ok" : "failed",
    healthCheckMessage: message.slice(0, 500),
    lastHttpStatus: status ?? current.lastHttpStatus,
    lastActualHttpAt: status === null ? current.lastActualHttpAt : new Date().toISOString()
  });
}

export function providerStatusMessage() {
  return `Provider runtime ${dateKey()}: Groq -> OpenRouter -> cache/rule-based fallback, Tavily/Exa for sourced latest info. Cooldown은 실제 429/quota/retry-after 응답에만 적용됩니다.`;
}

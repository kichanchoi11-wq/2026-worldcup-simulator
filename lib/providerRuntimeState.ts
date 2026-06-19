import type { AIProviderRuntimeState, RuntimeProviderName, ProviderRuntimeStatus } from "@/types/ai";

type RuntimeState = {
  providers: Map<RuntimeProviderName, AIProviderRuntimeState>;
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

export function getProviderCooldownMs() {
  const minutes = envNumber("PROVIDER_COOLDOWN_MINUTES", 30) ?? 30;
  return minutes * 60 * 1000;
}

export function classifyQuotaOrRateLimit(status: number | null, message: string) {
  const lower = message.toLowerCase();
  return (
    status === 429 ||
    lower.includes("rate_limit_exceeded") ||
    lower.includes("quota_exceeded") ||
    lower.includes("daily limit exceeded") ||
    lower.includes("requests per day exceeded") ||
    lower.includes("too many requests") ||
    lower.includes("insufficient_quota") ||
    lower.includes("rpm") ||
    lower.includes("rpd")
  );
}

function providerModel(provider: RuntimeProviderName) {
  if (provider === "groq") return process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  if (provider === "openrouter") return process.env.OPENROUTER_MODEL || "meta-llama/llama-3.2-3b-instruct:free";
  return provider;
}

function providerEnabled(provider: RuntimeProviderName) {
  if (provider === "groq") return Boolean(process.env.GROQ_API_KEY);
  if (provider === "openrouter") return Boolean(process.env.OPENROUTER_API_KEY);
  if (provider === "tavily") return Boolean(process.env.TAVILY_API_KEY);
  return Boolean(process.env.EXA_API_KEY);
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

export function getRuntimeProviderState(provider: RuntimeProviderName): AIProviderRuntimeState {
  const state = getState();
  const existing = state.providers.get(provider);
  const enabled = providerEnabled(provider);
  const limit = dailySoftLimit(provider);
  const model = providerModel(provider);

  if (existing && existing.model === model && existing.dailySoftLimit === limit) {
    const cooling = existing.cooldownUntil && new Date(existing.cooldownUntil).getTime() > Date.now();
    return {
      ...existing,
      enabled,
      status: enabled ? (cooling ? existing.status : "available") : "disabled"
    };
  }

  const next: AIProviderRuntimeState = {
    provider,
    status: enabled ? "available" : "disabled",
    model,
    enabled,
    usedToday: 0,
    dailySoftLimit: limit,
    rpmSoftLimit: rpmSoftLimit(provider),
    cooldownUntil: null,
    lastSuccessAt: null,
    lastFailureAt: null,
    lastFailureMessage: null
  };
  state.providers.set(provider, next);
  return next;
}

export function isRuntimeProviderUsable(provider: RuntimeProviderName) {
  const state = getRuntimeProviderState(provider);
  if (!state.enabled || state.status === "disabled") return false;
  if (state.cooldownUntil && new Date(state.cooldownUntil).getTime() > Date.now()) return false;
  if (state.dailySoftLimit !== null && state.usedToday >= state.dailySoftLimit) return false;
  return true;
}

export function recordProviderSuccess(provider: RuntimeProviderName) {
  const state = getState();
  const current = getRuntimeProviderState(provider);
  state.providers.set(provider, {
    ...current,
    status: "available",
    usedToday: current.usedToday + 1,
    cooldownUntil: null,
    lastSuccessAt: new Date().toISOString(),
    lastFailureMessage: current.lastFailureMessage
  });
}

export function recordProviderFailure(provider: RuntimeProviderName, status: number | null, message: string) {
  const state = getState();
  const current = getRuntimeProviderState(provider);
  const quota = classifyQuotaOrRateLimit(status, message);
  const nextStatus: ProviderRuntimeStatus = quota ? "quota_exceeded" : "cooling_down";
  state.providers.set(provider, {
    ...current,
    status: nextStatus,
    cooldownUntil: new Date(Date.now() + getProviderCooldownMs()).toISOString(),
    lastFailureAt: new Date().toISOString(),
    lastFailureMessage: message.slice(0, 500)
  });
}

export function providerStatusMessage() {
  return `Provider runtime ${dateKey()}: Groq -> OpenRouter -> cache/rule-based fallback, Tavily/Exa for sourced latest info.`;
}

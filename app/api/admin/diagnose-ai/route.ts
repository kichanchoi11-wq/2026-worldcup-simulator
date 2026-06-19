import { NextResponse } from "next/server";
import { createAdminUnauthorizedResponse, isAdminRequest } from "@/lib/adminAuth";
import { createAIAnalysis, getAIProviderStatus, getAITimeoutMs } from "@/lib/aiAnalysisService";
import type { AIDiagnosis } from "@/types/diagnostics";

export const dynamic = "force-dynamic";

function nowIso() {
  return new Date().toISOString();
}

async function runForcedTimeout(status: ReturnType<typeof getAIProviderStatus>) {
  const startedAt = nowIso();
  const provider = process.env.GROQ_API_KEY ? "groq" : process.env.OPENROUTER_API_KEY ? "openrouter" : null;

  if (!provider) {
    return {
      ok: false,
      status: null,
      responseLength: 0,
      error: "GROQ_API_KEY/OPENROUTER_API_KEY가 없어 timeout 테스트를 실제 호출하지 않았습니다.",
      startedAt,
      finishedAt: nowIso()
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10);
  const model = provider === "groq" ? status.model : status.fallbackModel;
  const endpoint = provider === "groq" ? "https://api.groq.com/openai/v1/chat/completions" : "https://openrouter.ai/api/v1/chat/completions";
  const apiKey = provider === "groq" ? process.env.GROQ_API_KEY : process.env.OPENROUTER_API_KEY;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(provider === "openrouter"
          ? {
              "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://2026-worldcup-simulator-teal.vercel.app",
              "X-Title": process.env.OPENROUTER_APP_NAME || "2026 World Cup Simulator"
            }
          : {})
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Return JSON only: {\"ok\":true}" }],
        temperature: 0,
        response_format: { type: "json_object" }
      }),
      signal: controller.signal
    });
    const text = await response.text();

    return {
      ok: response.ok,
      status: response.status,
      responseLength: text.length,
      error: response.ok ? null : text.slice(0, 260),
      startedAt,
      finishedAt: nowIso()
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      responseLength: 0,
      error: error instanceof Error && error.name === "AbortError" ? `${provider} AbortController timeout 테스트가 정상 발생했습니다.` : error instanceof Error ? error.message : "AI timeout 테스트 실패",
      startedAt,
      finishedAt: nowIso()
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return createAdminUnauthorizedResponse();
  }

  let body: { mode?: unknown } = {};

  try {
    body = (await request.json()) as { mode?: unknown };
  } catch {
    body = {};
  }

  const mode = body.mode === "timeout" ? "timeout" : "connection";
  const before = getAIProviderStatus();
  let call: AIDiagnosis["call"] = null;
  const diagnosis: string[] = [];

  if (mode === "timeout") {
    call = await runForcedTimeout(before);
    diagnosis.push(call.error ?? "AI timeout 테스트 호출이 완료되었습니다.");
  } else {
    const startedAt = nowIso();
    const result = await createAIAnalysis({
      kind: "refresh-summary",
      title: "AI 연결 진단",
      cacheKey: `diagnose-ai-${Date.now()}`,
      instruction: "짧은 연결 진단입니다. JSON으로만 응답하세요.",
      input: {
        purpose: "admin AI connection test",
        expected: "short JSON response"
      },
      fallbackSummary: "AI 연결 진단 fallback 결과입니다.",
      fallbackBullets: ["AI가 실패해도 내부 fallback은 저장됩니다."],
      fallbackDataGaps: ["실패 시 HTTP 상태, timeout, 파싱 실패 로그를 확인하세요."],
      sources: ["AI API", "internal fallback"]
    });
    const finishedAt = nowIso();

    call = {
      ok: result.usedAI,
      status: result.usedAI ? 200 : null,
      responseLength: JSON.stringify(result).length,
      error: result.usedAI ? null : result.message,
      startedAt,
      finishedAt
    };
    diagnosis.push(result.usedAI ? "AI API 실제 응답을 받아 저장했습니다." : result.message);
  }

  const after = getAIProviderStatus();
  const payload: AIDiagnosis = {
    ok: Boolean(after.enabled && (call?.ok || after.resultSaveSuccess)),
    keyConfigured: after.enabled,
    modelSelection: after.modelSelectionMessage,
    selectedModel: after.model,
    fallbackModel: after.fallbackModel,
    timeoutMs: getAITimeoutMs(),
    call,
    providerStatus: after,
    diagnosis: [
      ...diagnosis,
      after.activeJobCount === 0 ? "현재 실행 중으로 남은 AI 작업이 없습니다." : `${after.activeJobCount}개 AI 작업이 아직 실행 중입니다.`,
      after.timeoutCount > before.timeoutCount ? "이번 진단에서 timeout 처리가 기록되었습니다." : "기존 timeout/fallback 카운트를 유지했습니다.",
      after.resultSaveSuccess ? `결과 저장 상태: ${after.screenReflectionStatus}` : "아직 저장된 AI 결과가 없습니다."
    ],
    testedAt: nowIso()
  };

  return NextResponse.json(payload, { status: payload.ok ? 200 : 207 });
}

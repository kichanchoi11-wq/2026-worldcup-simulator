import { NextResponse } from "next/server";
import { createAdminUnauthorizedResponse, isAdminRequest } from "@/lib/adminAuth";
import { createGeminiAnalysis, getGeminiProviderStatus, getGeminiTimeoutMs } from "@/lib/geminiAnalysisService";
import type { GeminiDiagnosis } from "@/types/diagnostics";

export const dynamic = "force-dynamic";

function nowIso() {
  return new Date().toISOString();
}

async function runForcedTimeout(model: string, apiKey: string | undefined) {
  const startedAt = nowIso();

  if (!apiKey) {
    return {
      ok: false,
      status: null,
      responseLength: 0,
      error: "GEMINI_API_KEY가 없어 timeout 테스트를 실제 호출하지 않았습니다.",
      startedAt,
      finishedAt: nowIso()
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10);

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Return JSON: {\"ok\":true}" }] }],
        generationConfig: { responseMimeType: "application/json" }
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
      error: error instanceof Error && error.name === "AbortError" ? "AbortController timeout 테스트가 정상 발생했습니다." : error instanceof Error ? error.message : "Gemini timeout 테스트 실패",
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
  const before = getGeminiProviderStatus();
  let call: GeminiDiagnosis["call"] = null;
  const diagnosis: string[] = [];

  if (mode === "timeout") {
    call = await runForcedTimeout(before.model, process.env.GEMINI_API_KEY);
    diagnosis.push(call.error ?? "Gemini timeout 테스트 호출이 완료되었습니다.");
  } else {
    const startedAt = nowIso();
    const result = await createGeminiAnalysis({
      kind: "refresh-summary",
      title: "Gemini 연결 진단",
      cacheKey: `diagnose-gemini-${Date.now()}`,
      instruction: "짧은 연결 진단입니다. JSON으로만 응답하세요.",
      input: {
        purpose: "admin Gemini connection test",
        expected: "short JSON response"
      },
      fallbackSummary: "Gemini 연결 진단 fallback 결과입니다.",
      fallbackBullets: ["Gemini가 실패해도 내부 fallback은 저장됩니다."],
      fallbackDataGaps: ["실패 시 HTTP 상태, timeout, 파싱 실패 로그를 확인하세요."],
      sources: ["Gemini API", "internal fallback"]
    });
    const finishedAt = nowIso();

    call = {
      ok: result.usedGemini,
      status: result.usedGemini ? 200 : null,
      responseLength: JSON.stringify(result).length,
      error: result.usedGemini ? null : result.message,
      startedAt,
      finishedAt
    };
    diagnosis.push(result.usedGemini ? "Gemini API 실제 응답을 받아 저장했습니다." : result.message);
  }

  const after = getGeminiProviderStatus();
  const payload: GeminiDiagnosis = {
    ok: Boolean(after.enabled && (call?.ok || after.resultSaveSuccess)),
    keyConfigured: after.enabled,
    modelSelection: after.modelSelectionMessage,
    selectedModel: after.model,
    fallbackModel: after.fallbackModel,
    timeoutMs: getGeminiTimeoutMs(),
    call,
    providerStatus: after,
    diagnosis: [
      ...diagnosis,
      after.activeJobCount === 0 ? "현재 실행 중으로 남은 Gemini 작업이 없습니다." : `${after.activeJobCount}개 Gemini 작업이 아직 실행 중입니다.`,
      after.timeoutCount > before.timeoutCount ? "이번 진단에서 timeout 처리가 기록되었습니다." : "기존 timeout/fallback 카운트를 유지했습니다.",
      after.resultSaveSuccess ? `결과 저장 상태: ${after.screenReflectionStatus}` : "아직 저장된 Gemini 결과가 없습니다."
    ],
    testedAt: nowIso()
  };

  return NextResponse.json(payload, { status: payload.ok ? 200 : 207 });
}

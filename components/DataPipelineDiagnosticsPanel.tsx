"use client";

import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/Badge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { readArrayStorage, readStorage, storageKeys, writeStorage } from "@/lib/storage";
import type { FootballDataRefreshSnapshot } from "@/lib/autoUpdateService";
import type { ApiFootballResourceSnapshot, FootballMatch, StandingRow } from "@/types/football";
import type { ApiFootballDiagnosis, ApiFootballDiagnosticCall, DiagnosticStatus, GeminiDiagnosis } from "@/types/diagnostics";
import type { GeminiAnalysisRecord, GeminiProviderStatus } from "@/types/gemini";
import type { RecollectionJob } from "@/types/recollection";

type ReflectionStatus = {
  checkedAt: string;
  message: string;
  matches: number;
  standings: number;
  resourceSnapshots: number;
  geminiAnalyses: number;
  jobsCleaned: number;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "아직 없음";

  try {
    return new Intl.DateTimeFormat("ko-KR", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function toneFromDiagnostic(status: DiagnosticStatus): Parameters<typeof Badge>[0]["tone"] {
  if (status === "success") return "success";
  if (status === "partial" || status === "skipped") return "warning";
  return "danger";
}

function callTone(call: ApiFootballDiagnosticCall): Parameters<typeof Badge>[0]["tone"] {
  if (call.ok) return "success";
  if (call.skipped) return "warning";
  return "danger";
}

function latestCall(calls: ApiFootballDiagnosticCall[]) {
  return [...calls].sort((a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime())[0] ?? null;
}

function resourceByName(resources: ApiFootballResourceSnapshot[], resource: string) {
  return resources.find((item) => item.resource === resource) ?? null;
}

function sourceLabel(snapshot: ApiFootballResourceSnapshot | null, fallback: string) {
  if (!snapshot) return fallback;
  return `${snapshot.source}${snapshot.isFallbackData ? " fallback" : ""} · ${snapshot.count}개`;
}

function staleRunningJob(job: RecollectionJob) {
  if (job.status !== "실행 중" || !job.startedAt) return false;
  return Date.now() - new Date(job.startedAt).getTime() > 60_000;
}

export default function DataPipelineDiagnosticsPanel({ onSnapshotChange }: { onSnapshotChange?: () => void }) {
  const { isAdminAuthenticated, isChecking } = useAdminAuth();
  const [apiDiagnosis, setApiDiagnosis] = useState<ApiFootballDiagnosis | null>(null);
  const [geminiDiagnosis, setGeminiDiagnosis] = useState<GeminiDiagnosis | null>(null);
  const [resources, setResources] = useState<ApiFootballResourceSnapshot[]>([]);
  const [providerStatus, setProviderStatus] = useState<FootballDataRefreshSnapshot["data"]["providerStatus"] | null>(null);
  const [geminiStatus, setGeminiStatus] = useState<GeminiProviderStatus | null>(null);
  const [reflectionStatus, setReflectionStatus] = useState<ReflectionStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loadingLabel, setLoadingLabel] = useState<string | null>(null);

  function loadStoredState() {
    setApiDiagnosis(readStorage<ApiFootballDiagnosis | null>(storageKeys.apiFootballDiagnosticsData, null));
    setGeminiDiagnosis(readStorage<GeminiDiagnosis | null>(storageKeys.geminiDiagnosticsData, null));
    setResources(readArrayStorage<ApiFootballResourceSnapshot>(storageKeys.apiFootballResourceSnapshotsData));
    setProviderStatus(readStorage<FootballDataRefreshSnapshot["data"]["providerStatus"] | null>(storageKeys.apiFootballProviderStatusData, null));
    setGeminiStatus(readStorage<GeminiProviderStatus | null>(storageKeys.geminiStatusData, null));
    setReflectionStatus(readStorage<ReflectionStatus | null>(storageKeys.dataReflectionStatusData, null));
  }

  useEffect(() => {
    const timer = window.setTimeout(loadStoredState, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const sourceDistribution = useMemo(() => {
    const fixtures = resourceByName(resources, "fixtures");
    const standings = resourceByName(resources, "standings");
    const teams = resourceByName(resources, "teams");
    const players = resourceByName(resources, "players");
    const coaches = resourceByName(resources, "coaches");
    const lineups = resourceByName(resources, "lineups");
    const events = resourceByName(resources, "events");
    const injuries = resourceByName(resources, "injuries");
    const statistics = resourceByName(resources, "statistics");
    const predictions = resourceByName(resources, "predictions");

    return [
      ["경기 일정/결과", sourceLabel(fixtures, "저장 데이터 없음")],
      ["조별 순위", sourceLabel(standings, "저장 데이터 없음")],
      ["팀 정보", sourceLabel(teams, "static fallback")],
      ["선수 명단", sourceLabel(players, "static fallback")],
      ["감독/전술/포메이션", `${sourceLabel(coaches, "static fallback")} / ${sourceLabel(lineups, "static fallback")}`],
      ["골/카드/교체 이벤트", sourceLabel(events, "데이터 없음")],
      ["부상/징계", sourceLabel(injuries, "데이터 없음 또는 static fallback")],
      ["체력", sourceLabel(statistics, "내부 계산")],
      ["AI/Gemini 설명", `${readArrayStorage<GeminiAnalysisRecord>(storageKeys.geminiAnalysesData).length}건 저장`],
      ["대한민국 상대 전략/예측", sourceLabel(predictions, "static + 내부 예측")]
    ];
  }, [resources]);

  async function runApiDiagnosis(label: string) {
    if (!isAdminAuthenticated) {
      setMessage("관리자 인증 후 API-Football 진단을 실행할 수 있습니다.");
      return;
    }

    setLoadingLabel(label);
    setMessage(`${label} 실행 중입니다.`);

    try {
      const response = await fetch("/api/admin/diagnose-api-football", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label })
      });
      const payload = (await response.json()) as ApiFootballDiagnosis;

      writeStorage(storageKeys.apiFootballDiagnosticsData, payload);
      setApiDiagnosis(payload);
      setMessage(`${label} 완료: ${payload.diagnosis[0] ?? "진단 결과를 저장했습니다."}`);
      onSnapshotChange?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "API-Football 진단 요청이 실패했습니다.");
    } finally {
      setLoadingLabel(null);
    }
  }

  async function runGeminiDiagnosis(mode: "connection" | "timeout") {
    if (!isAdminAuthenticated) {
      setMessage("관리자 인증 후 Gemini 진단을 실행할 수 있습니다.");
      return;
    }

    const label = mode === "timeout" ? "Gemini timeout 테스트" : "Gemini 연결 테스트";
    setLoadingLabel(label);
    setMessage(`${label} 실행 중입니다.`);

    try {
      const response = await fetch("/api/admin/diagnose-gemini", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode })
      });
      const payload = (await response.json()) as GeminiDiagnosis;

      writeStorage(storageKeys.geminiDiagnosticsData, payload);
      writeStorage(storageKeys.geminiStatusData, payload.providerStatus);
      setGeminiDiagnosis(payload);
      setGeminiStatus(payload.providerStatus);
      setMessage(`${label} 완료: ${payload.diagnosis[0] ?? "진단 결과를 저장했습니다."}`);
      onSnapshotChange?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gemini 진단 요청이 실패했습니다.");
    } finally {
      setLoadingLabel(null);
    }
  }

  function cleanupStaleJobs() {
    const jobs = readArrayStorage<RecollectionJob>(storageKeys.adminRecollectionJobsData);
    const now = new Date().toISOString();
    let cleaned = 0;
    const nextJobs = jobs.map((job) => {
      if (!staleRunningJob(job)) return job;
      cleaned += 1;
      return {
        ...job,
        status: "실패" as const,
        finishedAt: now,
        failedCount: Math.max(job.failedCount, 1),
        message: "1분 이상 실행 중으로 남은 작업을 관리자 진단 패널에서 정리했습니다. 서버 응답이 없거나 브라우저 상태 갱신이 중단된 것으로 기록합니다.",
        error: "stale-running-job-cleaned"
      };
    });

    writeStorage(storageKeys.adminRecollectionJobsData, nextJobs);
    setMessage(cleaned > 0 ? `${cleaned}개 멈춘 작업을 실패 상태로 정리했습니다.` : "1분 이상 멈춘 실행 중 작업이 없습니다.");
    onSnapshotChange?.();
  }

  function runReflectionTest() {
    const matches = readArrayStorage<FootballMatch>(storageKeys.apiMatchesData);
    const standings = readArrayStorage<StandingRow>(storageKeys.apiStandingsData);
    const storedResources = readArrayStorage<ApiFootballResourceSnapshot>(storageKeys.apiFootballResourceSnapshotsData);
    const geminiAnalyses = readArrayStorage<GeminiAnalysisRecord>(storageKeys.geminiAnalysesData);
    const jobs = readArrayStorage<RecollectionJob>(storageKeys.adminRecollectionJobsData);
    const cleaned = jobs.filter(staleRunningJob).length;
    const nextStatus: ReflectionStatus = {
      checkedAt: new Date().toISOString(),
      message:
        matches.length > 0 || storedResources.length > 0
          ? "저장된 데이터가 화면 반영 저장소에서 읽혔습니다. 경기 상세의 기본 정적 영역과 저장 재검증 패널을 함께 확인하세요."
          : "화면이 읽을 저장 데이터가 없습니다. 관리자 새로고침 또는 API-Football 진단을 먼저 실행해야 합니다.",
      matches: matches.length,
      standings: standings.length,
      resourceSnapshots: storedResources.length,
      geminiAnalyses: geminiAnalyses.length,
      jobsCleaned: cleaned
    };

    writeStorage(storageKeys.dataReflectionStatusData, nextStatus);
    setReflectionStatus(nextStatus);
    setResources(storedResources);
    setMessage(nextStatus.message);
    onSnapshotChange?.();
  }

  function runActualResultSyncTest() {
    const matches = readArrayStorage<FootballMatch>(storageKeys.apiMatchesData);
    const finishedMatches = matches.filter((match) => {
      const status = match.status.toUpperCase();
      return match.locked || status.includes("FINISHED") || status.includes("FT") || (match.score.home !== null && match.score.away !== null);
    });
    const scoredMatches = matches.filter((match) => match.score.home !== null && match.score.away !== null);
    const nextStatus: ReflectionStatus = {
      checkedAt: new Date().toISOString(),
      message:
        finishedMatches.length > 0
          ? `종료/스코어가 있는 저장 경기 ${finishedMatches.length}개를 확인했습니다. 경기 상세의 저장 재검증 패널에서 실제 결과 source와 함께 표시됩니다.`
          : "저장된 API 경기 중 종료/스코어가 있는 경기를 찾지 못했습니다. API-Football fixtures 또는 football-data.org fallback 응답을 먼저 갱신해야 합니다.",
      matches: matches.length,
      standings: scoredMatches.length,
      resourceSnapshots: resources.length,
      geminiAnalyses: readArrayStorage<GeminiAnalysisRecord>(storageKeys.geminiAnalysesData).length,
      jobsCleaned: 0
    };

    writeStorage(storageKeys.dataReflectionStatusData, nextStatus);
    setReflectionStatus(nextStatus);
    setMessage(nextStatus.message);
    onSnapshotChange?.();
  }

  const lastApiCall = latestCall(apiDiagnosis?.calls ?? []);
  const footballDataFallbacks = resources.filter((resource) => resource.source === "football-data.org" || resource.source === "cache" || resource.isFallbackData);
  const failedApiCalls = apiDiagnosis?.calls.filter((call) => !call.ok) ?? [];

  return (
    <section className="rounded border border-emerald-300/25 bg-emerald-400/10 p-5 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="API 실제 데이터">데이터 파이프라인 진단</Badge>
            <Badge tone={apiDiagnosis?.keyConfigured ? "success" : "warning"}>API-Football {apiDiagnosis?.keyConfigured ? "키 확인" : "키 미확인"}</Badge>
            <Badge tone={geminiStatus?.enabled ? "success" : "warning"}>Gemini {geminiStatus?.enabled ? "키 확인" : "fallback"}</Badge>
          </div>
          <h3 className="mt-3 text-xl font-black text-white">데이터 파이프라인 진단</h3>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-emerald-50/75">
            API 키, 호출 URL/헤더, HTTP 상태, response 길이, fixtureId 매핑, fallback 사유, 저장/화면 반영 상태를 한 화면에서 확인합니다.
          </p>
        </div>
        {!isAdminAuthenticated ? (
          <div className="rounded border border-white/10 bg-white/8 px-3 py-2 text-sm font-black text-white/75">
            {isChecking ? "관리자 인증 확인 중" : "관리자 인증 필요"}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {["API-Football 연결 테스트", "API-Football fixtures 테스트", "API-Football events 테스트", "API-Football lineups 테스트", "API-Football injuries 테스트", "API-Football statistics 테스트"].map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => runApiDiagnosis(label)}
            disabled={!isAdminAuthenticated || Boolean(loadingLabel)}
            className="rounded border border-cyan-300/50 bg-cyan-400/15 px-3 py-2 text-sm font-black text-white transition hover:bg-cyan-400/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingLabel === label ? "실행 중" : label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => runGeminiDiagnosis("connection")}
          disabled={!isAdminAuthenticated || Boolean(loadingLabel)}
          className="rounded border border-violet-300/50 bg-violet-400/15 px-3 py-2 text-sm font-black text-white transition hover:bg-violet-400/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingLabel === "Gemini 연결 테스트" ? "실행 중" : "Gemini 연결 테스트"}
        </button>
        <button
          type="button"
          onClick={() => runGeminiDiagnosis("timeout")}
          disabled={!isAdminAuthenticated || Boolean(loadingLabel)}
          className="rounded border border-violet-300/50 bg-violet-400/15 px-3 py-2 text-sm font-black text-white transition hover:bg-violet-400/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingLabel === "Gemini timeout 테스트" ? "실행 중" : "Gemini timeout 테스트"}
        </button>
        <button type="button" onClick={runReflectionTest} className="rounded border border-trophy/60 bg-trophy/20 px-3 py-2 text-sm font-black text-white">
          화면 반영 테스트
        </button>
        <button type="button" onClick={runActualResultSyncTest} className="rounded border border-trophy/60 bg-trophy/20 px-3 py-2 text-sm font-black text-white">
          실제 결과 동기화 테스트
        </button>
        <button type="button" onClick={cleanupStaleJobs} className="rounded border border-red-300/50 bg-red-400/15 px-3 py-2 text-sm font-black text-white">
          멈춘 Gemini/재수집 작업 정리
        </button>
      </div>

      {message ? <p className="mt-4 rounded border border-white/10 bg-white/8 p-3 text-sm font-semibold text-white/80">{message}</p> : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="API-Football 키" value={apiDiagnosis ? (apiDiagnosis.keyConfigured ? `${apiDiagnosis.keyEnvName} 사용` : "서버 키 없음") : "진단 전"} />
        <InfoCard label="Production/Runtime" value={apiDiagnosis ? `${apiDiagnosis.runtime.vercelEnv ?? "local"} · ${apiDiagnosis.runtime.isVercel ? "Vercel" : "local"}` : "진단 전"} />
        <InfoCard label="마지막 HTTP 상태" value={lastApiCall ? `${lastApiCall.endpoint}: ${lastApiCall.status ?? "없음"}` : "진단 전"} />
        <InfoCard label="마지막 오류" value={lastApiCall?.error ?? apiDiagnosis?.diagnosis[0] ?? "진단 전"} />
        <InfoCard label="오늘 호출 수" value={`${apiDiagnosis?.usage.used ?? providerStatus?.apiFootball.used ?? 0}/${apiDiagnosis?.usage.limit ?? providerStatus?.apiFootball.limit ?? 100}회`} />
        <InfoCard label="남은 호출 수" value={`${apiDiagnosis?.usage.remaining ?? providerStatus?.apiFootball.remaining ?? 100}회`} />
        <InfoCard label="마지막 엔드포인트" value={lastApiCall?.url ?? "진단 전"} />
        <InfoCard label="화면 반영" value={reflectionStatus ? `${reflectionStatus.matches}경기 · ${reflectionStatus.resourceSnapshots}리소스` : apiDiagnosis?.dataReflection.message ?? "진단 전"} />
      </div>

      {apiDiagnosis ? (
        <div className="mt-4 grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded border border-white/10 bg-pitch-900/80 p-4">
            <h4 className="font-black text-white">API-Football 엔드포인트 결과</h4>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {apiDiagnosis.calls.map((call) => (
                <div key={`${call.endpoint}-${call.url}`} className="rounded border border-white/10 bg-white/[0.04] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge tone={callTone(call)}>{call.skipped ? "skipped" : call.ok ? "success" : "failed"}</Badge>
                    <span className="text-xs text-white/50">HTTP {call.status ?? "없음"}</span>
                  </div>
                  <p className="mt-2 font-black text-white">{call.endpoint}</p>
                  <p className="mt-1 break-words text-xs text-white/45">{call.url}</p>
                  <p className="mt-2 text-xs text-white/60">
                    response {call.responseCount}개 · normalized {call.normalizedCount}개 · {call.responseLength} bytes
                  </p>
                  {call.error ? <p className="mt-2 text-xs leading-5 text-amber-50/80">{call.error}</p> : null}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded border border-white/10 bg-pitch-900/80 p-4">
            <h4 className="font-black text-white">fixture id 매핑</h4>
            <div className="mt-3 space-y-2">
              {apiDiagnosis.matchMappings.slice(0, 6).map((mapping) => (
                <div key={`${mapping.internalMatchId}-${mapping.apiFootballFixtureId}-${mapping.reason}`} className="rounded border border-white/10 bg-white/[0.04] p-3">
                  <Badge tone={mapping.confidence === "매칭 실패" ? "danger" : "success"}>{mapping.confidence}</Badge>
                  <p className="mt-2 text-sm font-black text-white">
                    내부 {mapping.internalMatchId} · API fixture {mapping.apiFootballFixtureId ?? "없음"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/55">{mapping.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="rounded border border-white/10 bg-pitch-900/80 p-4">
          <h4 className="font-black text-white">football-data.org / static fallback 진단</h4>
          <div className="mt-3 grid gap-2 text-sm text-white/70">
            <InfoLine label="fallback 사용 횟수" value={`${footballDataFallbacks.length}개 리소스`} />
            <InfoLine label="마지막 fallback 사유" value={footballDataFallbacks[0]?.message ?? failedApiCalls[0]?.error ?? "저장된 fallback 사유 없음"} />
            <InfoLine label="대체된 항목" value={footballDataFallbacks.map((item) => item.label).join(", ") || "없음"} />
          </div>
        </div>
        <div className="rounded border border-white/10 bg-pitch-900/80 p-4">
          <h4 className="font-black text-white">Gemini 진단</h4>
          <div className="mt-3 grid gap-2 text-sm text-white/70">
            <InfoLine label="키 설정" value={geminiDiagnosis ? (geminiDiagnosis.keyConfigured ? "설정됨" : "없음") : geminiStatus?.enabled ? "설정됨" : "진단 전"} />
            <InfoLine label="모델 선택" value={geminiDiagnosis?.modelSelection ?? `${geminiStatus?.model ?? "진단 전"} → ${geminiStatus?.fallbackModel ?? "fallback"}`} />
            <InfoLine label="실행 중/오래 실행" value={`${geminiStatus?.activeJobCount ?? 0}개 / ${geminiStatus?.staleJobCount ?? 0}개`} />
            <InfoLine label="timeout/fallback" value={`${geminiStatus?.timeoutCount ?? 0}회 / ${geminiStatus?.fallbackCount ?? 0}회`} />
            <InfoLine label="마지막 실패" value={geminiStatus?.lastFailureMessage ?? geminiDiagnosis?.call?.error ?? "없음"} />
            <InfoLine label="결과 저장/반영" value={geminiStatus?.screenReflectionStatus ?? "진단 전"} />
          </div>
        </div>
        <div className="rounded border border-white/10 bg-pitch-900/80 p-4">
          <h4 className="font-black text-white">데이터 반영 상태</h4>
          <div className="mt-3 grid gap-2 text-sm text-white/70">
            <InfoLine label="API 원본 수집" value={apiDiagnosis?.dataReflection.rawCollection ?? "진단 전"} />
            <InfoLine label="정규화" value={apiDiagnosis?.dataReflection.normalization ?? "진단 전"} />
            <InfoLine label="저장" value={reflectionStatus ? "success" : apiDiagnosis?.dataReflection.storage ?? "진단 전"} />
            <InfoLine label="화면 반영" value={reflectionStatus ? "success" : apiDiagnosis?.dataReflection.visibleData ?? "진단 전"} />
            <InfoLine label="마지막 화면 반영" value={formatDate(reflectionStatus?.checkedAt ?? null)} />
          </div>
          {apiDiagnosis ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone={toneFromDiagnostic(apiDiagnosis.dataReflection.rawCollection)}>{apiDiagnosis.dataReflection.rawCollection}</Badge>
              <Badge tone={toneFromDiagnostic(apiDiagnosis.dataReflection.normalization)}>{apiDiagnosis.dataReflection.normalization}</Badge>
              <Badge tone={toneFromDiagnostic(reflectionStatus ? "success" : apiDiagnosis.dataReflection.visibleData)}>{reflectionStatus ? "화면 저장 확인" : apiDiagnosis.dataReflection.visibleData}</Badge>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 rounded border border-white/10 bg-pitch-900/80 p-4">
        <h4 className="font-black text-white">현재 화면 데이터 소스</h4>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
          {sourceDistribution.map(([label, value]) => (
            <div key={label} className="rounded border border-white/10 bg-white/[0.04] p-3">
              <p className="text-xs text-white/50">{label}</p>
              <p className="mt-1 break-words text-sm font-black leading-6 text-white">{value}</p>
            </div>
          ))}
        </div>
        {apiDiagnosis?.diagnosis.length ? (
          <ul className="mt-4 grid gap-2 text-sm leading-6 text-emerald-50/75 md:grid-cols-2">
            {apiDiagnosis.diagnosis.map((item) => (
              <li key={item} className="rounded border border-white/10 bg-white/[0.04] p-3">{item}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/10 bg-pitch-900/80 p-3">
      <p className="text-xs text-white/50">{label}</p>
      <p className="mt-1 break-words text-sm font-black leading-6 text-white">{value}</p>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 rounded border border-white/10 bg-white/[0.04] p-2">
      <span className="text-white/45">{label}</span>
      <span className="break-words font-semibold text-white/78">{value}</span>
    </div>
  );
}

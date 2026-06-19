"use client";

import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/Badge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { readArrayStorage, readStorage, storageKeys, writeStorage } from "@/lib/storage";
import type { FootballDataRefreshSnapshot } from "@/lib/autoUpdateService";
import type { ApiFootballResourceSnapshot, FootballMatch, StandingRow } from "@/types/football";
import type { ApiFootballDiagnosis, ApiFootballDiagnosticCall, DiagnosticStatus, AIDiagnosis } from "@/types/diagnostics";
import type { AIAnalysisLog, AIAnalysisRecord, AIProviderStatus } from "@/types/ai";
import type { RecollectionJob } from "@/types/recollection";

type ReflectionStatus = {
  checkedAt: string;
  message: string;
  matches: number;
  standings: number;
  resourceSnapshots: number;
  aiAnalyses: number;
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

function aiLogSucceededByFallback(log: AIAnalysisLog) {
  return Boolean(log.fallbackResultSaved || log.resultSaved || log.screenReflectionStatus === "fallback 저장됨");
}

function aiLogTone(log: AIAnalysisLog): Parameters<typeof Badge>[0]["tone"] {
  if (log.status === "success" || log.status === "cache") return "success";
  if (log.status === "partial" || log.status === "fallback" || (log.status === "failed" && aiLogSucceededByFallback(log))) return "warning";
  return "danger";
}

function aiLogLabel(log: AIAnalysisLog) {
  if (log.finalStatusLabel) return log.finalStatusLabel;
  if (log.status === "success") return "성공";
  if (log.status === "partial") return "부분 성공";
  if (log.status === "cache") return "캐시 사용";
  if (log.status === "fallback" || (log.status === "failed" && aiLogSucceededByFallback(log))) return "fallback 성공";
  return "실패";
}

function yesNo(value: boolean | undefined) {
  return value ? "예" : "아니오";
}

function formatBytes(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toLocaleString("ko-KR")} bytes` : "없음";
}

function toneFromDiagnostic(status: DiagnosticStatus): Parameters<typeof Badge>[0]["tone"] {
  if (status === "success") return "success";
  if (status === "partial" || status === "skipped") return "warning";
  return "danger";
}

function callTone(call: ApiFootballDiagnosticCall): Parameters<typeof Badge>[0]["tone"] {
  if (call.ok) return "success";
  if (call.classification === "plan-limited" || call.classification === "empty" || call.classification === "mapping-failed") return "warning";
  if (call.skipped) return "warning";
  return "danger";
}

function callStatusLabel(call: ApiFootballDiagnosticCall) {
  if (call.ok) return "성공";
  if (call.classification === "plan-limited") return "플랜 제한";
  if (call.classification === "mapping-failed") return "매핑 실패";
  if (call.classification === "empty") return "빈 응답";
  if (call.skipped) return "건너뜀";
  return "실패";
}

function displayApiMessage(value: string | null | undefined) {
  if (!value) return null;
  if (/Free plans do not have access to this season|try from 2022 to 2024/i.test(value)) {
    return "API-Football 무료 플랜에서 2026 시즌 접근 제한을 반환했습니다. 과거 시즌 데이터는 사용하지 않습니다.";
  }
  return value;
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

const apiDiagnosisButtons = [
  "API-Football 연결 테스트",
  "API-Football 전체 진단",
  "fixtures 동기화",
  "standings 동기화",
  "teams 동기화",
  "players 동기화",
  "coaches 동기화",
  "lineups 동기화",
  "events 동기화",
  "injuries 동기화",
  "statistics 동기화",
  "predictions 동기화",
  "API-Football 가능한 항목 전체 동기화"
];

function staleRunningJob(job: RecollectionJob) {
  if (job.status !== "실행 중" || !job.startedAt) return false;
  return Date.now() - new Date(job.startedAt).getTime() > 60_000;
}

export default function DataPipelineDiagnosticsPanel({ onSnapshotChange }: { onSnapshotChange?: () => void }) {
  const { isAdminAuthenticated, isChecking } = useAdminAuth();
  const [apiDiagnosis, setApiDiagnosis] = useState<ApiFootballDiagnosis | null>(null);
  const [aiDiagnosis, setAIDiagnosis] = useState<AIDiagnosis | null>(null);
  const [resources, setResources] = useState<ApiFootballResourceSnapshot[]>([]);
  const [providerStatus, setProviderStatus] = useState<FootballDataRefreshSnapshot["data"]["providerStatus"] | null>(null);
  const [aiStatus, setAIStatus] = useState<AIProviderStatus | null>(null);
  const [reflectionStatus, setReflectionStatus] = useState<ReflectionStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loadingLabel, setLoadingLabel] = useState<string | null>(null);

  function loadStoredState() {
    setApiDiagnosis(readStorage<ApiFootballDiagnosis | null>(storageKeys.apiFootballDiagnosticsData, null));
    setAIDiagnosis(readStorage<AIDiagnosis | null>(storageKeys.aiDiagnosticsData, null));
    setResources(readArrayStorage<ApiFootballResourceSnapshot>(storageKeys.apiFootballResourceSnapshotsData));
    setProviderStatus(readStorage<FootballDataRefreshSnapshot["data"]["providerStatus"] | null>(storageKeys.apiFootballProviderStatusData, null));
    setAIStatus(readStorage<AIProviderStatus | null>(storageKeys.aiStatusData, null));
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
      ["AI 설명", `${readArrayStorage<AIAnalysisRecord>(storageKeys.aiAnalysesData).length}건 저장`],
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

  async function runAIDiagnosis(mode: "connection" | "timeout") {
    if (!isAdminAuthenticated) {
      setMessage("관리자 인증 후 AI 진단을 실행할 수 있습니다.");
      return;
    }

    const label = mode === "timeout" ? "AI timeout 테스트" : "AI 연결 테스트";
    setLoadingLabel(label);
    setMessage(`${label} 실행 중입니다.`);

    try {
      const response = await fetch("/api/admin/diagnose-ai", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode })
      });
      const payload = (await response.json()) as AIDiagnosis;

      writeStorage(storageKeys.aiDiagnosticsData, payload);
      writeStorage(storageKeys.aiStatusData, payload.providerStatus);
      setAIDiagnosis(payload);
      setAIStatus(payload.providerStatus);
      setMessage(`${label} 완료: ${payload.diagnosis[0] ?? "진단 결과를 저장했습니다."}`);
      onSnapshotChange?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI 진단 요청이 실패했습니다.");
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
    const aiAnalyses = readArrayStorage<AIAnalysisRecord>(storageKeys.aiAnalysesData);
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
      aiAnalyses: aiAnalyses.length,
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
      aiAnalyses: readArrayStorage<AIAnalysisRecord>(storageKeys.aiAnalysesData).length,
      jobsCleaned: 0
    };

    writeStorage(storageKeys.dataReflectionStatusData, nextStatus);
    setReflectionStatus(nextStatus);
    setMessage(nextStatus.message);
    onSnapshotChange?.();
  }

  const lastApiCall = latestCall(apiDiagnosis?.calls ?? []);
  const footballDataFallbacks = resources.filter((resource) => resource.source === "football-data.org" || resource.source === "cache" || resource.isFallbackData);
  const failedApiCalls = (apiDiagnosis?.calls ?? []).filter((call) => !call.ok);
  const fallbackStrategy = apiDiagnosis?.fallbackStrategy ?? null;
  const dataReflection = apiDiagnosis?.dataReflection ?? null;

  return (
    <section className="rounded border border-emerald-300/25 bg-emerald-400/10 p-5 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="API 실제 데이터">데이터 파이프라인 진단</Badge>
            <Badge tone={apiDiagnosis?.keyConfigured ? "success" : "warning"}>API-Football {apiDiagnosis?.keyConfigured ? "키 확인" : "키 미확인"}</Badge>
            <Badge tone={aiStatus?.enabled ? "success" : "warning"}>AI {aiStatus?.enabled ? "키 확인" : "fallback"}</Badge>
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
        {apiDiagnosisButtons.map((label) => (
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
          onClick={() => runAIDiagnosis("connection")}
          disabled={!isAdminAuthenticated || Boolean(loadingLabel)}
          className="rounded border border-violet-300/50 bg-violet-400/15 px-3 py-2 text-sm font-black text-white transition hover:bg-violet-400/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingLabel === "AI 연결 테스트" ? "실행 중" : "AI 연결 테스트"}
        </button>
        <button
          type="button"
          onClick={() => runAIDiagnosis("timeout")}
          disabled={!isAdminAuthenticated || Boolean(loadingLabel)}
          className="rounded border border-violet-300/50 bg-violet-400/15 px-3 py-2 text-sm font-black text-white transition hover:bg-violet-400/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingLabel === "AI timeout 테스트" ? "실행 중" : "AI timeout 테스트"}
        </button>
        <button type="button" onClick={runReflectionTest} className="rounded border border-trophy/60 bg-trophy/20 px-3 py-2 text-sm font-black text-white">
          화면 반영 테스트
        </button>
        <button type="button" onClick={runActualResultSyncTest} className="rounded border border-trophy/60 bg-trophy/20 px-3 py-2 text-sm font-black text-white">
          실제 결과 동기화 테스트
        </button>
        <button type="button" onClick={cleanupStaleJobs} className="rounded border border-red-300/50 bg-red-400/15 px-3 py-2 text-sm font-black text-white">
          멈춘 AI/재수집 작업 정리
        </button>
      </div>

      {message ? <p className="mt-4 rounded border border-white/10 bg-white/8 p-3 text-sm font-semibold text-white/80">{message}</p> : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="API-Football 키" value={apiDiagnosis ? (apiDiagnosis.keyConfigured ? `${apiDiagnosis.keyEnvName} 사용` : "서버 키 없음") : "진단 전"} />
        <InfoCard label="base URL/호출 방식" value={apiDiagnosis ? `${apiDiagnosis.baseUrl ?? "https://v3.football.api-sports.io"} · ${apiDiagnosis.requestMode ?? "API-SPORTS direct"}` : "진단 전"} />
        <InfoCard label="대상 시즌" value={apiDiagnosis ? `league=${apiDiagnosis.targetLeague ?? "1"}, season=${apiDiagnosis.targetSeason ?? "2026"}` : "진단 전"} />
        <InfoCard label="Production/Runtime" value={apiDiagnosis ? `${apiDiagnosis.runtime?.vercelEnv ?? "local"} · ${apiDiagnosis.runtime?.isVercel ? "Vercel" : "local"}` : "진단 전"} />
        <InfoCard label="마지막 HTTP 상태" value={lastApiCall ? `${lastApiCall.endpoint}: ${lastApiCall.status ?? "없음"}` : "진단 전"} />
        <InfoCard label="마지막 오류" value={displayApiMessage(lastApiCall?.error) ?? apiDiagnosis?.diagnosis?.[0] ?? "진단 전"} />
        <InfoCard label="오늘 호출 수" value={`${apiDiagnosis?.usage?.used ?? providerStatus?.apiFootball?.used ?? 0}/${apiDiagnosis?.usage?.limit ?? providerStatus?.apiFootball?.limit ?? 100}회`} />
        <InfoCard label="남은 호출 수" value={`${apiDiagnosis?.usage?.remaining ?? providerStatus?.apiFootball?.remaining ?? 100}회`} />
        <InfoCard label="마지막 엔드포인트" value={lastApiCall?.url ?? "진단 전"} />
        <InfoCard label="화면 반영" value={reflectionStatus ? `${reflectionStatus.matches}경기 · ${reflectionStatus.resourceSnapshots}리소스` : dataReflection?.message ?? "진단 전"} />
      </div>

      {apiDiagnosis ? (
        <>
        {fallbackStrategy?.seasonAccessLimited ? (
          <div className="mt-4 rounded border border-amber-300/35 bg-amber-400/10 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="warning">API-Football 2026 시즌 접근 제한 감지</Badge>
              <Badge tone="neutral">{fallbackStrategy.actual2026Source}</Badge>
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-amber-50/85">
              현재 API-Football 무료 플랜은 league={apiDiagnosis.targetLeague ?? "1"}, season={apiDiagnosis.targetSeason ?? "2026"} 데이터에 접근할 수 없습니다.
              {displayApiMessage(fallbackStrategy.responseMessage) ? ` API 응답: ${displayApiMessage(fallbackStrategy.responseMessage)}` : ""}
            </p>
            <div className="mt-3 grid gap-2 text-sm text-white/75 md:grid-cols-2">
              <InfoLine label="2026 실제 데이터" value="football-data.org fallback 또는 정적 공식 대진 fallback을 사용합니다." />
              <InfoLine label="API-Football 정책" value={fallbackStrategy.apiFootballUsagePolicy ?? "2026 북중미 월드컵 데이터만 반영하고 과거 시즌 데이터는 반영하지 않습니다."} />
              <InfoLine label="detail skip 원인" value={fallbackStrategy.skippedDetailReason ?? "fixtureId 확보됨"} />
              <InfoLine label="체력 대체 처리" value={fallbackStrategy.fitnessFallback ?? "경기 일정 기반 내부 계산을 사용합니다."} />
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              <FallbackBox title="카드" body={fallbackStrategy.cardsFallback ?? "공식 경기 보고서 확인 필요 상태로 표시합니다."} />
              <FallbackBox title="부상" body={fallbackStrategy.injuriesFallback ?? "공식 부상 데이터 미제공 상태로 표시합니다."} />
              <FallbackBox title="징계" body={fallbackStrategy.disciplineFallback ?? "확정 징계를 단정하지 않고 확인 필요로 표시합니다."} />
            </div>
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded border border-white/10 bg-pitch-900/80 p-4">
            <h4 className="font-black text-white">API-Football 엔드포인트 결과</h4>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {(apiDiagnosis.calls ?? []).map((call) => (
                <div key={`${call.endpoint}-${call.url}`} className="rounded border border-white/10 bg-white/[0.04] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge tone={callTone(call)}>{callStatusLabel(call)}</Badge>
                    <span className="text-xs text-white/50">HTTP {call.status ?? "없음"}</span>
                  </div>
                  <p className="mt-2 font-black text-white">{call.endpoint}</p>
                  {call.season ? <p className="mt-1 text-xs text-white/45">season {call.season}</p> : null}
                  <p className="mt-1 break-words text-xs text-white/45">{call.url}</p>
                  <p className="mt-2 text-xs text-white/60">
                    response {call.responseCount}개 · normalized {call.normalizedCount}개 · {call.responseLength} bytes
                  </p>
                  {call.error ? <p className="mt-2 text-xs leading-5 text-amber-50/80">{displayApiMessage(call.error)}</p> : null}
                  {call.replacementStrategy ? <p className="mt-2 text-xs leading-5 text-cyan-50/75">대체 처리: {call.replacementStrategy}</p> : null}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded border border-white/10 bg-pitch-900/80 p-4">
            <h4 className="font-black text-white">fixture id 매핑</h4>
            <div className="mt-3 space-y-2">
              {(apiDiagnosis.matchMappings ?? []).slice(0, 6).map((mapping) => (
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
        </>
      ) : null}

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="rounded border border-white/10 bg-pitch-900/80 p-4">
          <h4 className="font-black text-white">football-data.org / static fallback 진단</h4>
          <div className="mt-3 grid gap-2 text-sm text-white/70">
            <InfoLine label="fallback 사용 횟수" value={`${footballDataFallbacks.length}개 리소스`} />
            <InfoLine label="마지막 fallback 사유" value={footballDataFallbacks[0]?.message ?? displayApiMessage(failedApiCalls[0]?.error) ?? "저장된 fallback 사유 없음"} />
            <InfoLine label="대체된 항목" value={footballDataFallbacks.map((item) => item.label).join(", ") || "없음"} />
          </div>
        </div>
        <div className="rounded border border-white/10 bg-pitch-900/80 p-4">
          <h4 className="font-black text-white">AI 진단</h4>
          <div className="mt-3 grid gap-2 text-sm text-white/70">
            <InfoLine label="키 설정" value={aiDiagnosis ? (aiDiagnosis.keyConfigured ? "설정됨" : "없음") : aiStatus?.enabled ? "설정됨" : "진단 전"} />
            <InfoLine label="모델 선택" value={aiDiagnosis?.modelSelection ?? `${aiStatus?.model ?? "진단 전"} → ${aiStatus?.fallbackModel ?? "fallback"}`} />
            <InfoLine label="실행 중/오래 실행" value={`${aiStatus?.activeJobCount ?? 0}개 / ${aiStatus?.staleJobCount ?? 0}개`} />
            <InfoLine label="timeout/fallback" value={`${aiStatus?.timeoutCount ?? 0}회 / ${aiStatus?.fallbackCount ?? 0}회`} />
            <InfoLine label="마지막 실패" value={aiStatus?.lastFailureMessage ?? aiDiagnosis?.call?.error ?? "없음"} />
            <InfoLine label="결과 저장/반영" value={aiStatus?.screenReflectionStatus ?? "진단 전"} />
          </div>
          {aiStatus?.logs?.length ? (
            <div className="mt-3 grid gap-2">
              {(aiStatus.logs ?? []).slice(0, 5).map((log) => (
                <div key={log.id} className="rounded border border-white/10 bg-white/[0.04] p-3 text-xs leading-5 text-white/70">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={aiLogTone(log)}>{aiLogLabel(log)}</Badge>
                    <span className="font-black text-white">{log.target}</span>
                  </div>
                  <p className="mt-2">{log.message}</p>
                  <p className="mt-1 text-white/50">
                    원본 {formatBytes(log.originalPayloadBytes ?? log.payloadBytes)} · compact 후 {formatBytes(log.compactPayloadBytes ?? log.payloadBytes)} · chunk {log.chunkCount ?? 1}개
                  </p>
                  <p className="mt-1 text-white/50">
                    provider {log.providerUsed ?? log.provider ?? (log.usedAI ? aiStatus.mainProvider : "internal-fallback")} · OpenRouter {yesNo(log.openRouterAttempted)} · 내부 fallback {yesNo(log.internalFallbackUsed ?? log.fallbackUsed)}
                  </p>
                  <p className="mt-1 text-white/50">
                    HTTP {log.httpStatus ?? "없음"} · retry {log.retryCount ?? 0}회 · timeout {yesNo(log.timeout)} · 결과 저장 {log.fallbackResultSaved || log.resultSaved || aiStatus.resultSaveSuccess ? "성공" : "아직 없음"} · 화면 반영 {log.visibleDataUpdated || log.screenReflectionStatus ? log.screenReflectionStatus ?? "성공" : aiStatus.screenReflectionStatus}
                  </p>
                  {log.errorType ? <p className="mt-1 text-white/50">분류 {log.errorType}</p> : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="rounded border border-white/10 bg-pitch-900/80 p-4">
          <h4 className="font-black text-white">데이터 반영 상태</h4>
          <div className="mt-3 grid gap-2 text-sm text-white/70">
            <InfoLine label="API 원본 수집" value={dataReflection?.rawCollection ?? "진단 전"} />
            <InfoLine label="정규화" value={dataReflection?.normalization ?? "진단 전"} />
            <InfoLine label="저장" value={reflectionStatus ? "success" : dataReflection?.storage ?? "진단 전"} />
            <InfoLine label="화면 반영" value={reflectionStatus ? "success" : dataReflection?.visibleData ?? "진단 전"} />
            <InfoLine label="마지막 화면 반영" value={formatDate(reflectionStatus?.checkedAt ?? null)} />
          </div>
          {dataReflection ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone={toneFromDiagnostic(dataReflection.rawCollection)}>{dataReflection.rawCollection}</Badge>
              <Badge tone={toneFromDiagnostic(dataReflection.normalization)}>{dataReflection.normalization}</Badge>
              <Badge tone={toneFromDiagnostic(reflectionStatus ? "success" : dataReflection.visibleData)}>{reflectionStatus ? "화면 저장 확인" : dataReflection.visibleData}</Badge>
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
        {apiDiagnosis?.diagnosis?.length ? (
          <ul className="mt-4 grid gap-2 text-sm leading-6 text-emerald-50/75 md:grid-cols-2">
            {(apiDiagnosis.diagnosis ?? []).map((item) => (
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

function FallbackBox({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded border border-white/10 bg-pitch-900/70 p-3">
      <p className="text-sm font-black text-white">{title}</p>
      <p className="mt-2 text-xs leading-5 text-white/65">{body}</p>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/Badge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { readArrayStorage, readStorage, storageKeys, writeStorage } from "@/lib/storage";
import type { GeminiProviderStatus } from "@/types/gemini";
import type { RecollectionDataPayload, RecollectionJob, RecollectionJobStatus, RecollectionResponse, RecollectionScope } from "@/types/recollection";
import { recollectionJobDefinitions } from "@/types/recollection";

function statusTone(status: RecollectionJobStatus): Parameters<typeof Badge>[0]["tone"] {
  if (status === "성공") return "success";
  if (status === "부분 성공" || status === "건너뜀") return "warning";
  if (status === "실패") return "danger";
  if (status === "실행 중") return "API 확인";
  return "확인 필요";
}

function formatDate(value: string | null) {
  if (!value) {
    return "아직 없음";
  }

  try {
    return new Intl.DateTimeFormat("ko-KR", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function asArray<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function safeWriteStorage(key: (typeof storageKeys)[keyof typeof storageKeys], value: unknown) {
  try {
    writeStorage(key, value);
    return true;
  } catch {
    return false;
  }
}

function writeIfAny(key: (typeof storageKeys)[keyof typeof storageKeys], value: unknown[]) {
  if (value.length > 0) {
    safeWriteStorage(key, value);
  }
}

function compactResourceSnapshots(data: RecollectionDataPayload) {
  return data.resourceSnapshots.map((snapshot) => ({
    ...snapshot,
    rawData: null,
    message: snapshot.message ? snapshot.message.slice(0, 320) : null
  }));
}

function compactRefreshSnapshot(data: RecollectionDataPayload): RecollectionDataPayload["refreshSnapshot"] {
  const resourceSnapshots = compactResourceSnapshots(data);

  return {
    ...data.refreshSnapshot,
    data: {
      ...data.refreshSnapshot.data,
      matches: data.matches,
      standings: data.standings,
      teams: data.teams,
      resourceSnapshots,
      fallbackResources: {
        players: [],
        coaches: data.coaches,
        lineups: data.lineups,
        events: [],
        injuries: data.injuries,
        statistics: [],
        predictions: data.predictions
      },
      teamAnalysisBundles: [],
      matchReviews: data.matchReviews,
      cardRecords: data.cardRecords,
      freshInfoResults: data.freshInfoResults,
      freshInfoStatus: data.freshInfoStatus,
      geminiAnalyses: data.geminiAnalyses,
      geminiStatus: data.geminiStatus,
      providerStatus: data.providerStatus
    }
  };
}

function persistRecollectionPayload(data: RecollectionDataPayload) {
  const compactSnapshots = compactResourceSnapshots(data);

  safeWriteStorage(storageKeys.footballRefreshSnapshotData, compactRefreshSnapshot(data));
  safeWriteStorage(storageKeys.lastManualRefreshData, new Date().toISOString());
  writeIfAny(storageKeys.apiMatchesData, data.matches);
  writeIfAny(storageKeys.apiStandingsData, data.standings);
  writeIfAny(storageKeys.apiFootballTeamsData, data.teams);
  safeWriteStorage(storageKeys.apiFootballResourceSnapshotsData, compactSnapshots);
  safeWriteStorage(storageKeys.apiFootballProviderStatusData, data.providerStatus);
  safeWriteStorage(storageKeys.apiFootballUsageLogsData, asArray(data.providerStatus.usageLogs));
  safeWriteStorage(storageKeys.apiFootballSyncLogsData, asArray(data.providerStatus.syncLogs));
  writeIfAny(storageKeys.apiFootballPlayersData, data.apiPlayers);
  writeIfAny(storageKeys.apiFootballCoachesData, data.apiCoaches.length > 0 ? data.apiCoaches : data.coaches);
  writeIfAny(storageKeys.apiFootballLineupsData, data.apiLineups.length > 0 ? data.apiLineups : data.lineups);
  writeIfAny(storageKeys.apiFootballEventsData, data.apiEvents.length > 0 ? data.apiEvents : data.events);
  writeIfAny(storageKeys.apiFootballCardRecordsData, data.cardRecords);
  writeIfAny(storageKeys.apiFootballInjuriesData, data.apiInjuries.length > 0 ? data.apiInjuries : data.injuries);
  writeIfAny(storageKeys.apiFootballStatisticsData, data.apiStatistics.length > 0 ? data.apiStatistics : data.statistics);
  writeIfAny(storageKeys.apiFootballPredictionsData, data.apiPredictions.length > 0 ? data.apiPredictions : data.predictions);
  writeIfAny(storageKeys.teamTacticsData, data.teamTactics);
  writeIfAny(storageKeys.teamFormationsData, data.teamFormations);
  writeIfAny(storageKeys.teamRiskProfilesData, data.teamRiskProfiles);
  writeIfAny(storageKeys.koreaVsTeamPredictionsData, data.koreaPredictions);
  writeIfAny(storageKeys.matchReviewsData, data.matchReviews);
  writeIfAny(storageKeys.geminiFreshInfoData, data.freshInfoResults);
  safeWriteStorage(storageKeys.geminiFreshInfoStatusData, data.freshInfoStatus);
  writeIfAny(storageKeys.geminiAnalysesData, data.geminiAnalyses);
  safeWriteStorage(storageKeys.geminiStatusData, data.geminiStatus);
}

function createRunningJob(scope: RecollectionScope, label: string): RecollectionJob {
  const now = new Date().toISOString();

  return {
    jobId: `local-${scope}-${Date.now()}`,
    scope,
    label,
    status: "실행 중",
    requestedAt: now,
    startedAt: now,
    finishedAt: null,
    updatedCount: 0,
    failedCount: 0,
    skippedCount: 0,
    sourcesUsed: [],
    message: "서버 API Route에서 재수집을 실행 중입니다.",
    error: null,
    results: []
  };
}

function upsertJob(jobs: RecollectionJob[], nextJob: RecollectionJob) {
  return [nextJob, ...jobs.filter((job) => job.scope !== nextJob.scope)].slice(0, 24);
}

function cleanupStaleRunningJobs(jobs: RecollectionJob[]) {
  const now = new Date().toISOString();
  let changed = false;
  const cleaned = jobs.map((job) => {
    if (job.status !== "실행 중" || !job.startedAt || Date.now() - new Date(job.startedAt).getTime() <= 60_000) {
      return job;
    }

    changed = true;
    return {
      ...job,
      status: "실패" as const,
      finishedAt: now,
      failedCount: Math.max(job.failedCount, 1),
      message: "1분 이상 실행 중으로 남아 자동 정리했습니다. 서버 timeout, 네트워크 실패, 또는 브라우저 상태 갱신 중단 가능성이 있습니다.",
      error: "stale-running-job-cleaned"
    };
  });

  return { jobs: cleaned, changed };
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs = 75_000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

export default function AdminRecollectionPanel({ onSnapshotChange }: { onSnapshotChange?: () => void }) {
  const [jobs, setJobs] = useState<RecollectionJob[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [geminiStatus, setGeminiStatus] = useState<GeminiProviderStatus | null>(null);
  const { isAdminAuthenticated, isChecking } = useAdminAuth();
  const latestByScope = useMemo(() => new Map(jobs.map((job) => [job.scope, job])), [jobs]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedJobs = readArrayStorage<RecollectionJob>(storageKeys.adminRecollectionJobsData);
      const cleaned = cleanupStaleRunningJobs(storedJobs);
      if (cleaned.changed) {
        safeWriteStorage(storageKeys.adminRecollectionJobsData, cleaned.jobs);
      }
      setJobs(cleaned.jobs);
      setGeminiStatus(readStorage<GeminiProviderStatus | null>(storageKeys.geminiStatusData, null));
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function persistJobs(nextJobs: RecollectionJob[]) {
    setJobs(nextJobs);
    safeWriteStorage(storageKeys.adminRecollectionJobsData, nextJobs);
  }

  async function runRecollection(scope: RecollectionScope, label: string) {
    if (!isAdminAuthenticated) {
      setMessage("관리자 인증 후 실행할 수 있습니다.");
      return;
    }

    const runningJob = createRunningJob(scope, label);
    persistJobs(upsertJob(jobs, runningJob));
    setMessage(`${label} 실행 중입니다.`);

    try {
      const response = await fetchWithTimeout("/api/admin/recollect", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope })
      });
      const payload = (await response.json()) as Partial<RecollectionResponse> & { message?: string };

      if (response.status === 401) {
        throw new Error(payload.message ?? "관리자 인증이 필요합니다.");
      }

      if (!payload.job || !payload.data) {
        throw new Error(payload.message ?? "재수집 응답 형식이 올바르지 않습니다.");
      }

      persistRecollectionPayload(payload.data);
      setGeminiStatus(payload.data.geminiStatus);
      safeWriteStorage(storageKeys.adminRecollectionLastData, {
        ok: payload.ok,
        status: payload.status,
        message: payload.message,
        job: payload.job,
        storedAt: new Date().toISOString()
      });
      const nextJobs = upsertJob(jobs, payload.job);
      persistJobs(nextJobs);
      setMessage(payload.message ?? payload.job.message);
      onSnapshotChange?.();
    } catch (error) {
      const failedJob: RecollectionJob = {
        ...runningJob,
        status: "실패",
        finishedAt: new Date().toISOString(),
        failedCount: 1,
        message: error instanceof Error ? error.message : "재수집 요청이 실패했습니다.",
        error: error instanceof Error ? error.message : "unknown"
      };
      const nextJobs = upsertJob(jobs, failedJob);
      persistJobs(nextJobs);
      setMessage(failedJob.message);
      onSnapshotChange?.();
    }
  }

  async function runAll() {
    await runRecollection("all", "전체 관리자 재수집");
  }

  return (
    <section className="mt-4 rounded border border-cyan-300/25 bg-cyan-400/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="API 실제 데이터">서버 API Route</Badge>
            <Badge tone="success">API-Football 우선</Badge>
            <Badge tone="warning">fallback 저장</Badge>
          </div>
          <h3 className="mt-3 font-black text-white">관리자 재검증 실행</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-cyan-50/75">
            각 버튼은 서버 Route에서 API-Football, football-data.org, 캐시, 정적 fallback, 가능한 경우 Gemini 리뷰를 순서대로 사용합니다.
            성공한 결과는 팀 정보, 경기 상세, 리뷰 화면이 읽는 저장소에 바로 반영됩니다.
          </p>
        </div>
        <button
          type="button"
          onClick={runAll}
          disabled={!isAdminAuthenticated || jobs.some((job) => job.status === "실행 중")}
          className="rounded border border-trophy/60 bg-trophy/20 px-4 py-2 text-sm font-black text-white transition hover:bg-trophy/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          전체 재수집 실행
        </button>
      </div>

      {!isAdminAuthenticated ? (
        <p className="mt-4 rounded border border-white/10 bg-white/8 p-3 text-sm font-semibold text-white/75">
          {isChecking ? "관리자 인증 확인 중입니다." : "비밀번호 091009로 관리자 인증 후 재검증을 실행할 수 있습니다."}
        </p>
      ) : null}

      {message ? <p className="mt-4 rounded border border-white/10 bg-white/8 p-3 text-sm font-semibold text-white/80">{message}</p> : null}

      {geminiStatus ? (
        <div className="mt-4 rounded border border-violet-300/25 bg-violet-400/10 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={geminiStatus.enabled ? "success" : "warning"}>Gemini API {geminiStatus.enabled ? "사용 가능" : "fallback"}</Badge>
            <Badge tone="neutral">모델 {geminiStatus.model}</Badge>
            <Badge tone="neutral">Fallback {geminiStatus.fallbackModel}</Badge>
          </div>
          <div className="mt-3 grid gap-2 text-sm text-violet-50/80 md:grid-cols-4">
            <span>호출 {geminiStatus.callCount}회</span>
            <span>캐시 {geminiStatus.cacheHitCount}건</span>
            <span>실패 {geminiStatus.failureCount}건</span>
            <span>마지막 호출 {formatDate(geminiStatus.lastCallAt)}</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-violet-50/75">{geminiStatus.modelSelectionMessage}</p>
          <p className="mt-1 text-sm leading-6 text-violet-50/65">{geminiStatus.message}</p>
          {geminiStatus.logs.length > 0 ? (
            <ul className="mt-3 grid gap-2 text-xs text-violet-50/70 md:grid-cols-2">
              {geminiStatus.logs.slice(0, 4).map((log) => (
                <li key={log.id} className="rounded border border-white/10 bg-pitch-900/70 p-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={log.status === "success" || log.status === "cache" ? "success" : log.status === "fallback" ? "warning" : "danger"}>
                      {log.status}
                    </Badge>
                    <span className="font-black text-white">{log.target}</span>
                  </div>
                  <p className="mt-2">{log.message}</p>
                  <p className="mt-1 text-violet-50/45">
                    모델 {log.model ?? geminiStatus.model} · fallback {geminiStatus.fallbackModel} · HTTP {log.httpStatus ?? "없음"} · retry {log.retryCount ?? 0}회 · payload {log.payloadBytes ?? 0} bytes
                  </p>
                  <p className="mt-1 text-violet-50/45">
                    timeout {log.timeout ? "예" : "아니오"} · 내부 fallback {log.fallbackUsed ? "사용" : "미사용"} · 결과 저장 {log.fallbackResultSaved || geminiStatus.resultSaveSuccess ? "성공" : "아직 없음"} · 화면 반영 {log.screenReflectionStatus ?? geminiStatus.screenReflectionStatus} · {formatDate(log.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {recollectionJobDefinitions.map((definition) => {
          const job = latestByScope.get(definition.scope);
          const status = job?.status ?? "대기";
          const running = status === "실행 중";

          return (
            <article key={definition.scope} className="rounded border border-white/10 bg-pitch-900/80 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="break-words text-sm font-black text-white">{definition.label}</p>
                  <p className="mt-2 text-xs leading-5 text-white/52">{definition.description}</p>
                </div>
                <Badge tone={statusTone(status)}>{status}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-white/65">
                <span>갱신 {job?.updatedCount ?? 0}</span>
                <span>실패 {job?.failedCount ?? 0}</span>
                <span>스킵 {job?.skippedCount ?? 0}</span>
              </div>
              <p className="mt-2 text-xs text-white/45">최근 실행: {formatDate(job?.finishedAt ?? null)}</p>
              {job?.sourcesUsed.length ? <p className="mt-2 line-clamp-2 text-xs text-white/45">출처: {job.sourcesUsed.join(" → ")}</p> : null}
              {job?.message ? <p className="mt-2 line-clamp-3 text-xs leading-5 text-white/58">{job.message}</p> : null}
              <button
                type="button"
                onClick={() => runRecollection(definition.scope, definition.label)}
                disabled={!isAdminAuthenticated || running}
                className="mt-3 w-full rounded border border-cyan-300/50 bg-cyan-400/15 px-3 py-2 text-sm font-black text-white transition hover:bg-cyan-400/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {running ? "실행 중" : "재검증 실행"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

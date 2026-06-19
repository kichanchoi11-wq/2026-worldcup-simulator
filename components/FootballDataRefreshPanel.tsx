"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/Badge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { persistFreshInfoSnapshotMeta } from "@/lib/freshInfoStorage";
import { readStorage, storageKeys, writeStorageSafely } from "@/lib/storage";
import type { FootballDataRefreshSnapshot } from "@/lib/autoUpdateService";
import type { ApiFootballUsageSnapshot } from "@/types/football";
import type { FreshInfoReflectionDiagnostics, RefreshSnapshotMeta } from "@/types/freshInfo";

type PanelSize = "compact" | "full";

function statusTone(status: string): Parameters<typeof Badge>[0]["tone"] {
  if (status === "success") {
    return "success";
  }

  if (status === "partial" || status === "skipped") {
    return "warning";
  }

  return "danger";
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

const defaultApiUsage: ApiFootballUsageSnapshot = {
  dateKey: "unknown",
  used: 0,
  limit: 100,
  softLimit: 95,
  remaining: 100,
  resetAt: "",
  blocked: false,
  warning: null
};

function asArray<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
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

export default function FootballDataRefreshPanel({ size = "full" }: { size?: PanelSize }) {
  const [snapshot, setSnapshot] = useState<FootballDataRefreshSnapshot | null>(null);
  const [snapshotMeta, setSnapshotMeta] = useState<RefreshSnapshotMeta | null>(null);
  const [freshDiagnostics, setFreshDiagnostics] = useState<FreshInfoReflectionDiagnostics | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { isAdminAuthenticated, isChecking } = useAdminAuth();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const meta =
        readStorage<RefreshSnapshotMeta | null>(storageKeys.footballRefreshSnapshotMetaData, null) ??
        readStorage<RefreshSnapshotMeta | null>(storageKeys.footballRefreshSnapshotData, null);

      setSnapshotMeta(meta?.snapshotId ? meta : null);
      setFreshDiagnostics(readStorage<FreshInfoReflectionDiagnostics | null>(storageKeys.freshInfoReflectionDiagnosticsData, null));
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function persistSnapshot(nextSnapshot: FootballDataRefreshSnapshot) {
    const data = nextSnapshot.data;
    const matches = asArray(data?.matches);
    const standings = asArray(data?.standings);
    const teams = asArray(data?.teams);
    const resourceSnapshots = asArray(data?.resourceSnapshots);
    const fallbackResources = data?.fallbackResources;
    const teamAnalysisBundles = asArray(data?.teamAnalysisBundles);
    const matchReviews = asArray(data?.matchReviews);
    const cardRecords = asArray(data?.cardRecords);
    const freshInfoResults = asArray(data?.freshInfoResults);
    const freshInfoStatus = data?.freshInfoStatus;
    const aiAnalyses = asArray(data?.aiAnalyses);
    const aiStatus = data?.aiStatus;
    const providerStatus = data?.providerStatus;
    const persisted = persistFreshInfoSnapshotMeta(nextSnapshot);

    writeStorageSafely(storageKeys.lastManualRefreshData, nextSnapshot.refreshedAt);

    if (matches.length > 0) {
      writeStorageSafely(storageKeys.apiMatchesData, matches);
    }

    if (standings.length > 0) {
      writeStorageSafely(storageKeys.apiStandingsData, standings);
    }

    if (teams.length > 0) {
      writeStorageSafely(storageKeys.apiFootballTeamsData, teams);
    }

    writeStorageSafely(storageKeys.apiFootballResourceSnapshotsData, resourceSnapshots);
    writeStorageSafely(storageKeys.apiFootballPlayersData, asArray(fallbackResources?.players));
    writeStorageSafely(storageKeys.apiFootballCoachesData, asArray(fallbackResources?.coaches));
    writeStorageSafely(storageKeys.apiFootballLineupsData, asArray(fallbackResources?.lineups));
    writeStorageSafely(storageKeys.apiFootballEventsData, asArray(fallbackResources?.events));
    writeStorageSafely(storageKeys.apiFootballCardRecordsData, cardRecords);
    writeStorageSafely(storageKeys.apiFootballInjuriesData, asArray(fallbackResources?.injuries));
    writeStorageSafely(storageKeys.apiFootballStatisticsData, asArray(fallbackResources?.statistics));
    writeStorageSafely(storageKeys.apiFootballPredictionsData, asArray(fallbackResources?.predictions));
    writeStorageSafely(storageKeys.aiFreshInfoData, freshInfoResults);

    if (providerStatus) {
      writeStorageSafely(storageKeys.apiFootballProviderStatusData, providerStatus);
      writeStorageSafely(storageKeys.apiFootballUsageLogsData, asArray(providerStatus.usageLogs));
      writeStorageSafely(storageKeys.apiFootballSyncLogsData, asArray(providerStatus.syncLogs));
    }

    writeStorageSafely(storageKeys.aiAnalysesData, aiAnalyses);

    if (aiStatus) {
      writeStorageSafely(storageKeys.aiStatusData, aiStatus);
    }

    if (freshInfoStatus) {
      writeStorageSafely(storageKeys.aiFreshInfoStatusData, freshInfoStatus);
    }

    writeStorageSafely(
      storageKeys.teamTacticsData,
      teamAnalysisBundles.map((item) => item.coachTacticalProfile)
    );
    writeStorageSafely(
      storageKeys.teamFormationsData,
      teamAnalysisBundles.map((item) => item.formationProfile)
    );
    writeStorageSafely(
      storageKeys.teamRiskProfilesData,
      teamAnalysisBundles.map((item) => item.riskProfile)
    );
    writeStorageSafely(
      storageKeys.koreaVsTeamPredictionsData,
      teamAnalysisBundles.map((item) => item.koreaPrediction)
    );

    if (matchReviews.length > 0) {
      writeStorageSafely(storageKeys.matchReviewsData, matchReviews);
    }

    setSnapshot(nextSnapshot);
    setSnapshotMeta(persisted.meta);
    setFreshDiagnostics(persisted.diagnostics);

    return persisted;
  }

  async function refresh() {
    if (!isAdminAuthenticated) {
      setMessage("관리자 인증 후 사용할 수 있습니다.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetchWithTimeout("/api/refresh-football-data", { method: "POST", credentials: "same-origin" });
      const payload = (await response.json()) as Partial<FootballDataRefreshSnapshot> & { message?: string };

      if (response.status === 401) {
        setMessage(payload.message ?? "관리자 인증이 필요합니다.");
        return;
      }

      if (!response.ok) {
        throw new Error(payload.message ?? "?쇰? ?곗씠?곕? 遺덈윭?ㅼ? 紐삵뻽?듬땲??");
      }

      const nextSnapshot = payload as FootballDataRefreshSnapshot;

      const persisted = persistSnapshot(nextSnapshot);
      setMessage(`${nextSnapshot.message} ${persisted.message}`);
    } catch {
      setMessage("일부 데이터를 불러오지 못했습니다. 기존 저장 데이터를 유지합니다.");
    } finally {
      setLoading(false);
    }
  }

  const data = snapshot?.data;
  const apiUsage = data?.providerStatus?.apiFootball ?? defaultApiUsage;
  const teamAnalysisCount = asArray(data?.teamAnalysisBundles).length;
  const apiTeamCount = asArray(data?.teams).length;
  const resourceSnapshotCount = asArray(data?.resourceSnapshots).length;
  const matchReviewCount = asArray(data?.matchReviews).length;
  const cardRecordCount = asArray(data?.cardRecords).length;
  const freshInfoCount = asArray(data?.freshInfoResults).length || snapshotMeta?.counts.sourcedItems || 0;
  const freshInfoStatus = data?.freshInfoStatus;
  const aiAnalysisCount = asArray(data?.aiAnalyses).length;
  const aiStatus = data?.aiStatus;
  const results = asArray(snapshot?.results);
  const showRefreshButton = size === "full" && isAdminAuthenticated;
  const showAdminNotice = size === "full" && !isAdminAuthenticated;

  return (
    <section className="rounded border border-sky-300/25 bg-sky-400/10 p-5 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="API 실제 데이터">서버 API Route</Badge>
            <Badge tone="success">API-Football 우선</Badge>
            <Badge tone={snapshot?.autoUpdate?.stable ? "success" : "warning"}>
              자동 업데이트 {snapshot?.autoUpdate?.stable ? "안정" : "확인 필요"}
            </Badge>
          </div>
          <h2 className="mt-3 text-xl font-black text-white">최신 정보 업데이트</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-sky-50/78">
            API-Football(API-SPORTS)을 메인 데이터 API로 사용하고, football-data.org는 fallback으로만 사용합니다.
            모든 외부 호출은 서버 Route에서만 실행하며, 호출 제한에 가까워지면 저장 데이터와 정적 기본 데이터로 내려갑니다.
          </p>
        </div>
        {showRefreshButton ? (
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="rounded border border-trophy/60 bg-trophy/20 px-4 py-2 text-sm font-black text-white transition hover:bg-trophy/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "새로고침 중" : "최신 정보 수동 새로고침"}
          </button>
        ) : showAdminNotice ? (
          <div className="rounded border border-white/10 bg-white/8 px-4 py-2 text-sm font-black text-white/75">
            {isChecking ? "관리자 인증 확인 중" : "관리자 인증 후 사용할 수 있습니다."}
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Status label="마지막 수동 새로고침" value={formatDate(snapshot?.refreshedAt ?? snapshotMeta?.updatedAt ?? null)} />
        <Status label="API-Football 호출" value={`${apiUsage.used}/${apiUsage.limit}회`} />
        <Status label="남은 호출" value={`${apiUsage.remaining}회`} />
        <Status label="팀 분석 묶음" value={`${teamAnalysisCount}팀`} />
        <Status label="API 팀 정보" value={`${apiTeamCount}팀`} />
        <Status label="리소스 저장 구조" value={`${resourceSnapshotCount}종`} />
        <Status label="경기 리뷰" value={`${matchReviewCount}개`} />
        <Status label="카드 현황 레코드" value={`${cardRecordCount}건`} />
        <Status label="AI 최신 정보" value={`${freshInfoCount}건`} />
        <Status label="출처 기반 항목" value={freshInfoStatus ? `${freshInfoStatus.sourceBackedItemCount}건` : snapshotMeta ? `${snapshotMeta.counts.sourcedItems}건` : "아직 없음"} />
        <Status label="추가 확인 필요" value={freshInfoStatus ? `${freshInfoStatus.needsReviewCount}건` : "아직 없음"} />
        <Status
          label="AI 분석"
          value={
            aiStatus
              ? `${aiAnalysisCount}건 · 호출 ${aiStatus.callCount}회 · 캐시 ${aiStatus.cacheHitCount}건`
              : "아직 없음"
          }
        />
      </div>

      {aiStatus ? (
        <p className="mt-4 rounded border border-violet-300/25 bg-violet-400/10 p-3 text-sm font-semibold text-violet-50">
          {aiStatus.message}
        </p>
      ) : null}

      {freshInfoStatus ? (
        <div className="mt-4 rounded border border-emerald-300/25 bg-emerald-400/10 p-3 text-sm text-emerald-50">
          <p className="font-black">AI 최신 정보 검색 상태</p>
          <p className="mt-1 font-semibold">{freshInfoStatus.message}</p>
          <p className="mt-2 text-emerald-50/80">
            마지막 검색: {formatDate(freshInfoStatus.lastSearchedAt)} · 경기 {freshInfoStatus.targetMatchCount}건 · 팀{" "}
            {freshInfoStatus.targetTeamCount}건 · fallback {freshInfoStatus.fallbackCount}건 · timeout {freshInfoStatus.timeoutCount}건
          </p>
        </div>
      ) : null}

      {freshDiagnostics ? (
        <div className="mt-4 rounded border border-cyan-300/25 bg-cyan-400/10 p-3 text-sm text-cyan-50">
          <p className="font-black">최신 정보 반영 진단</p>
          <p className="mt-1">
            검색 결과 수집 {freshDiagnostics.collectedResults}건 · 정규화 {freshDiagnostics.normalizedItems}건 · 매핑 성공 {freshDiagnostics.targetMappingSuccess}건 · 경기 상세 {freshDiagnostics.matchDetailReflected}건 · 팀 상세 {freshDiagnostics.teamDetailReflected}건
          </p>
          <p className="mt-1 text-cyan-50/75">
            카드 {freshDiagnostics.counts.cards}건 · 부상 {freshDiagnostics.counts.injuries}건 · 징계 {freshDiagnostics.counts.suspensions}건 · 라인업/포메이션 {freshDiagnostics.counts.lineups + freshDiagnostics.counts.formations}건 · 체력 {freshDiagnostics.counts.fitness}건 · 리뷰 {freshDiagnostics.counts.reviews}건
          </p>
          <p className="mt-1 text-cyan-50/75">
            저장 방식 {freshDiagnostics.storage.mode} · 원본 {freshDiagnostics.storage.originalSnapshotBytes.toLocaleString("ko-KR")} bytes · 메타 {freshDiagnostics.storage.metaBytes.toLocaleString("ko-KR")} bytes · 정규화 {freshDiagnostics.storage.normalizedBytes.toLocaleString("ko-KR")} bytes
          </p>
        </div>
      ) : null}

      {apiUsage.warning ? (
        <p className="mt-4 rounded border border-amber-300/30 bg-amber-400/10 p-3 text-sm font-semibold text-amber-50">
          {apiUsage.warning}
        </p>
      ) : null}

      {message ? (
        <p className="mt-4 rounded border border-white/10 bg-white/8 p-3 text-sm font-semibold text-white/80">{message}</p>
      ) : null}

      {snapshot && size === "full" ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {results.map((result) => (
            <article key={result.id} className="rounded border border-white/10 bg-pitch-900/80 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge tone={statusTone(result.status)}>{result.status}</Badge>
                <span className="text-xs font-semibold text-white/50">{result.count}개</span>
              </div>
              <h3 className="mt-3 font-black text-white">{result.label}</h3>
              <p className="mt-2 text-sm leading-6 text-white/62">{result.message}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/10 bg-pitch-900/80 p-3">
      <p className="text-xs text-white/50">{label}</p>
      <p className="mt-1 break-words font-black text-white">{value}</p>
    </div>
  );
}

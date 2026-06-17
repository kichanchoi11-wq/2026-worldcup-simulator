"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/Badge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { readStorage, storageKeys, writeStorage } from "@/lib/storage";
import type { FootballDataRefreshSnapshot } from "@/lib/autoUpdateService";
import type { ApiFootballUsageSnapshot } from "@/types/football";

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
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { isAdminAuthenticated, isChecking } = useAdminAuth();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSnapshot(readStorage<FootballDataRefreshSnapshot | null>(storageKeys.footballRefreshSnapshotData, null));
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
    const geminiAnalyses = asArray(data?.geminiAnalyses);
    const geminiStatus = data?.geminiStatus;
    const providerStatus = data?.providerStatus;

    writeStorage(storageKeys.footballRefreshSnapshotData, nextSnapshot);
    writeStorage(storageKeys.lastManualRefreshData, nextSnapshot.refreshedAt);

    if (matches.length > 0) {
      writeStorage(storageKeys.apiMatchesData, matches);
    }

    if (standings.length > 0) {
      writeStorage(storageKeys.apiStandingsData, standings);
    }

    if (teams.length > 0) {
      writeStorage(storageKeys.apiFootballTeamsData, teams);
    }

    writeStorage(storageKeys.apiFootballResourceSnapshotsData, resourceSnapshots);
    writeStorage(storageKeys.apiFootballPlayersData, asArray(fallbackResources?.players));
    writeStorage(storageKeys.apiFootballCoachesData, asArray(fallbackResources?.coaches));
    writeStorage(storageKeys.apiFootballLineupsData, asArray(fallbackResources?.lineups));
    writeStorage(storageKeys.apiFootballEventsData, asArray(fallbackResources?.events));
    writeStorage(storageKeys.apiFootballCardRecordsData, cardRecords);
    writeStorage(storageKeys.apiFootballInjuriesData, asArray(fallbackResources?.injuries));
    writeStorage(storageKeys.apiFootballStatisticsData, asArray(fallbackResources?.statistics));
    writeStorage(storageKeys.apiFootballPredictionsData, asArray(fallbackResources?.predictions));
    writeStorage(storageKeys.geminiFreshInfoData, freshInfoResults);

    if (providerStatus) {
      writeStorage(storageKeys.apiFootballProviderStatusData, providerStatus);
      writeStorage(storageKeys.apiFootballUsageLogsData, asArray(providerStatus.usageLogs));
      writeStorage(storageKeys.apiFootballSyncLogsData, asArray(providerStatus.syncLogs));
    }

    writeStorage(storageKeys.geminiAnalysesData, geminiAnalyses);

    if (geminiStatus) {
      writeStorage(storageKeys.geminiStatusData, geminiStatus);
    }

    if (freshInfoStatus) {
      writeStorage(storageKeys.geminiFreshInfoStatusData, freshInfoStatus);
    }

    writeStorage(
      storageKeys.teamTacticsData,
      teamAnalysisBundles.map((item) => item.coachTacticalProfile)
    );
    writeStorage(
      storageKeys.teamFormationsData,
      teamAnalysisBundles.map((item) => item.formationProfile)
    );
    writeStorage(
      storageKeys.teamRiskProfilesData,
      teamAnalysisBundles.map((item) => item.riskProfile)
    );
    writeStorage(
      storageKeys.koreaVsTeamPredictionsData,
      teamAnalysisBundles.map((item) => item.koreaPrediction)
    );

    if (matchReviews.length > 0) {
      writeStorage(storageKeys.matchReviewsData, matchReviews);
    }

    setSnapshot(nextSnapshot);
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

      persistSnapshot(nextSnapshot);
      setMessage(nextSnapshot.message);
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
  const freshInfoCount = asArray(data?.freshInfoResults).length;
  const freshInfoStatus = data?.freshInfoStatus;
  const geminiAnalysisCount = asArray(data?.geminiAnalyses).length;
  const geminiStatus = data?.geminiStatus;
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
        <Status label="마지막 수동 새로고침" value={formatDate(snapshot?.refreshedAt ?? null)} />
        <Status label="API-Football 호출" value={`${apiUsage.used}/${apiUsage.limit}회`} />
        <Status label="남은 호출" value={`${apiUsage.remaining}회`} />
        <Status label="팀 분석 묶음" value={`${teamAnalysisCount}팀`} />
        <Status label="API 팀 정보" value={`${apiTeamCount}팀`} />
        <Status label="리소스 저장 구조" value={`${resourceSnapshotCount}종`} />
        <Status label="경기 리뷰" value={`${matchReviewCount}개`} />
        <Status label="카드 현황 레코드" value={`${cardRecordCount}건`} />
        <Status label="Gemini 최신 정보" value={`${freshInfoCount}건`} />
        <Status label="출처 기반 항목" value={freshInfoStatus ? `${freshInfoStatus.sourceBackedItemCount}건` : "아직 없음"} />
        <Status label="추가 확인 필요" value={freshInfoStatus ? `${freshInfoStatus.needsReviewCount}건` : "아직 없음"} />
        <Status
          label="Gemini 분석"
          value={
            geminiStatus
              ? `${geminiAnalysisCount}건 · 호출 ${geminiStatus.callCount}회 · 캐시 ${geminiStatus.cacheHitCount}건`
              : "아직 없음"
          }
        />
      </div>

      {geminiStatus ? (
        <p className="mt-4 rounded border border-violet-300/25 bg-violet-400/10 p-3 text-sm font-semibold text-violet-50">
          {geminiStatus.message}
        </p>
      ) : null}

      {freshInfoStatus ? (
        <div className="mt-4 rounded border border-emerald-300/25 bg-emerald-400/10 p-3 text-sm text-emerald-50">
          <p className="font-black">Gemini 최신 정보 검색 상태</p>
          <p className="mt-1 font-semibold">{freshInfoStatus.message}</p>
          <p className="mt-2 text-emerald-50/80">
            마지막 검색: {formatDate(freshInfoStatus.lastSearchedAt)} · 경기 {freshInfoStatus.targetMatchCount}건 · 팀{" "}
            {freshInfoStatus.targetTeamCount}건 · fallback {freshInfoStatus.fallbackCount}건 · timeout {freshInfoStatus.timeoutCount}건
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

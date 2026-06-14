"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/Badge";
import { readStorage, storageKeys, writeStorage } from "@/lib/storage";
import type { FootballDataRefreshSnapshot } from "@/lib/autoUpdateService";

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

export default function FootballDataRefreshPanel({ size = "full" }: { size?: PanelSize }) {
  const [snapshot, setSnapshot] = useState<FootballDataRefreshSnapshot | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSnapshot(readStorage<FootballDataRefreshSnapshot | null>(storageKeys.footballRefreshSnapshotData, null));
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function persistSnapshot(nextSnapshot: FootballDataRefreshSnapshot) {
    writeStorage(storageKeys.footballRefreshSnapshotData, nextSnapshot);
    writeStorage(storageKeys.lastManualRefreshData, nextSnapshot.refreshedAt);

    if (nextSnapshot.data.matches.length > 0) {
      writeStorage(storageKeys.apiMatchesData, nextSnapshot.data.matches);
    }

    if (nextSnapshot.data.standings.length > 0) {
      writeStorage(storageKeys.apiStandingsData, nextSnapshot.data.standings);
    }

    writeStorage(
      storageKeys.teamTacticsData,
      nextSnapshot.data.teamAnalysisBundles.map((item) => item.coachTacticalProfile)
    );
    writeStorage(
      storageKeys.teamFormationsData,
      nextSnapshot.data.teamAnalysisBundles.map((item) => item.formationProfile)
    );
    writeStorage(
      storageKeys.teamRiskProfilesData,
      nextSnapshot.data.teamAnalysisBundles.map((item) => item.riskProfile)
    );
    writeStorage(
      storageKeys.koreaVsTeamPredictionsData,
      nextSnapshot.data.teamAnalysisBundles.map((item) => item.koreaPrediction)
    );

    if (nextSnapshot.data.matchReviews.length > 0) {
      writeStorage(storageKeys.matchReviewsData, nextSnapshot.data.matchReviews);
    }

    setSnapshot(nextSnapshot);
  }

  async function refresh() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/refresh-football-data", { method: "POST" });
      const nextSnapshot = (await response.json()) as FootballDataRefreshSnapshot;

      persistSnapshot(nextSnapshot);
      setMessage(nextSnapshot.message);
    } catch {
      setMessage("일부 데이터를 불러오지 못했습니다. 기존 저장 데이터를 유지합니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded border border-sky-300/25 bg-sky-400/10 p-5 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="API 실제 데이터">서버 API Route</Badge>
            <Badge tone={snapshot?.autoUpdate.stable ? "success" : "warning"}>
              자동 업데이트 {snapshot?.autoUpdate.stable ? "안정" : "확인 필요"}
            </Badge>
          </div>
          <h2 className="mt-3 text-xl font-black text-white">최신 정보 업데이트</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-sky-50/78">
            경기·순위 API, 팀 전술/포메이션, 카드·부상·징계·체력 확인 대상, 한국 상대 승률, 경기 리뷰 상태를 분리해서 갱신합니다.
            실패한 항목은 기존 저장 데이터를 유지합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="rounded border border-trophy/60 bg-trophy/20 px-4 py-2 text-sm font-black text-white transition hover:bg-trophy/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "새로고침 중" : "최신 정보 수동 새로고침"}
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Status label="마지막 수동 새로고침" value={formatDate(snapshot?.refreshedAt ?? null)} />
        <Status label="팀 분석 묶음" value={`${snapshot?.data.teamAnalysisBundles.length ?? 0}팀`} />
        <Status label="경기 리뷰" value={`${snapshot?.data.matchReviews.length ?? 0}개`} />
      </div>

      {message ? (
        <p className="mt-4 rounded border border-white/10 bg-white/8 p-3 text-sm font-semibold text-white/80">{message}</p>
      ) : null}

      {snapshot && size === "full" ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {snapshot.results.map((result) => (
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

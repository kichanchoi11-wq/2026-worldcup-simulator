"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/Badge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { persistFreshInfoSnapshotMeta } from "@/lib/freshInfoStorage";
import { readArrayStorage, readStorage, storageKeys, writeStorageSafely } from "@/lib/storage";
import type { FootballDataRefreshSnapshot } from "@/lib/autoUpdateService";
import type { AIFreshInfoResult, AIFreshInfoStatus, FreshInfoReflectionDiagnostics } from "@/types/freshInfo";

function formatDate(value: string | null | undefined) {
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

function persistSnapshot(snapshot: FootballDataRefreshSnapshot) {
  const persisted = persistFreshInfoSnapshotMeta(snapshot);

  writeStorageSafely(storageKeys.lastManualRefreshData, snapshot.refreshedAt);
  writeStorageSafely(storageKeys.aiFreshInfoData, asArray(snapshot.data.freshInfoResults));
  writeStorageSafely(storageKeys.aiFreshInfoStatusData, snapshot.data.freshInfoStatus);
  writeStorageSafely(storageKeys.apiFootballProviderStatusData, snapshot.data.providerStatus);
  writeStorageSafely(storageKeys.apiFootballResourceSnapshotsData, asArray(snapshot.data.resourceSnapshots));
  writeStorageSafely(storageKeys.apiMatchesData, asArray(snapshot.data.matches));
  writeStorageSafely(storageKeys.apiStandingsData, asArray(snapshot.data.standings));

  return persisted;
}

export default function AIFreshInfoStatusPanel({ onSnapshotChange }: { onSnapshotChange?: () => void }) {
  const [results, setResults] = useState<AIFreshInfoResult[]>([]);
  const [status, setStatus] = useState<AIFreshInfoStatus | null>(null);
  const [diagnostics, setDiagnostics] = useState<FreshInfoReflectionDiagnostics | null>(null);
  const [providerStatus, setProviderStatus] = useState<FootballDataRefreshSnapshot["data"]["providerStatus"] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { isAdminAuthenticated, isChecking } = useAdminAuth();

  function loadStoredData() {
    setResults(readArrayStorage<AIFreshInfoResult>(storageKeys.aiFreshInfoData));
    setStatus(readStorage<AIFreshInfoStatus | null>(storageKeys.aiFreshInfoStatusData, null));
    setDiagnostics(readStorage<FreshInfoReflectionDiagnostics | null>(storageKeys.freshInfoReflectionDiagnosticsData, null));
    setProviderStatus(readStorage<FootballDataRefreshSnapshot["data"]["providerStatus"] | null>(storageKeys.apiFootballProviderStatusData, null));
  }

  useEffect(() => {
    const timer = window.setTimeout(loadStoredData, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function refreshWithAI() {
    if (!isAdminAuthenticated) {
      setMessage("관리자 인증 후 최신 정보 새로고침을 실행할 수 있습니다.");
      return;
    }

    setLoading(true);
    setMessage("서버 Route에서 2026 데이터 fallback과 Tavily/Exa 최신 정보 검색을 실행 중입니다.");

    try {
      const response = await fetch("/api/admin/refresh-with-ai", {
        method: "POST",
        credentials: "same-origin"
      });
      const payload = (await response.json()) as Partial<FootballDataRefreshSnapshot> & { message?: string };

      if (response.status === 401) {
        throw new Error(payload.message ?? "관리자 인증이 필요합니다.");
      }

      if (!payload.data || !payload.refreshedAt) {
        throw new Error(payload.message ?? "새로고침 응답 형식이 올바르지 않습니다.");
      }

      const snapshot = payload as FootballDataRefreshSnapshot;
      const persisted = persistSnapshot(snapshot);
      setResults(asArray(snapshot.data.freshInfoResults));
      setStatus(snapshot.data.freshInfoStatus);
      setDiagnostics(persisted.diagnostics);
      setProviderStatus(snapshot.data.providerStatus);
      setMessage(`${snapshot.message} ${persisted.message}`);
      onSnapshotChange?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "최신 정보 새로고침에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const seasonAccess = providerStatus?.seasonAccessStatus;
  const reflected = status?.reflectedCounts;
  const sampleItems = results.flatMap((result) => result.items.map((item) => ({ result, item }))).slice(0, 6);

  return (
    <section className="rounded border border-emerald-300/25 bg-emerald-400/10 p-5 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={status?.enabled ? "success" : "warning"}>검색 API {status?.enabled ? "설정됨" : "미설정/fallback"}</Badge>
            <Badge tone={status?.searchEnabled ? "success" : "warning"}>Tavily/Exa {status?.searchEnabled ? "사용 가능" : "비활성"}</Badge>
            <Badge tone={seasonAccess?.accessible === false ? "warning" : "neutral"}>API-Football 2026 {seasonAccess?.accessible === false ? "제한 감지" : "상태 확인"}</Badge>
          </div>
          <h3 className="mt-3 font-black text-white">최신 정보 검색 상태</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-50/75">
            API-Football 무료 플랜에서 2026 시즌 접근이 제한되면 2026 엔드포인트 반복 호출을 멈추고, football-data.org/정적 공식 대진/내부 계산/Tavily·Exa 출처 기반 검색으로만 보강합니다. 과거 시즌 데이터는 반영하지 않습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshWithAI}
          disabled={!isAdminAuthenticated || loading}
          className="rounded border border-trophy/60 bg-trophy/20 px-4 py-2 text-sm font-black text-white transition hover:bg-trophy/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "실행 중" : "최신 정보 새로고침"}
        </button>
      </div>

      {!isAdminAuthenticated ? (
        <p className="mt-4 rounded border border-white/10 bg-white/8 p-3 text-sm font-semibold text-white/75">
          {isChecking ? "관리자 인증 확인 중입니다." : "비밀번호 091009로 관리자 인증 후 실행할 수 있습니다."}
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Metric label="마지막 검색" value={formatDate(status?.lastSearchedAt)} />
        <Metric label="검색 대상" value={`경기 ${status?.targetMatchCount ?? 0}건 · 팀 ${status?.targetTeamCount ?? 0}건`} />
        <Metric label="출처 기반 항목" value={`${status?.sourceBackedItemCount ?? 0}건`} />
        <Metric label="추가 확인 필요" value={`${status?.needsReviewCount ?? 0}건`} />
        <Metric label="fallback/timeout" value={`${status?.fallbackCount ?? 0}건 / ${status?.timeoutCount ?? 0}건`} />
        <Metric label="카드" value={`${reflected?.cards ?? 0}건`} />
        <Metric label="부상" value={`${reflected?.injuries ?? 0}건`} />
        <Metric label="징계" value={`${reflected?.suspensions ?? 0}건`} />
        <Metric label="라인업/포메이션" value={`${reflected?.lineupsAndFormations ?? 0}건`} />
        <Metric label="리뷰/체력" value={`${reflected?.reviews ?? 0}건 · ${reflected?.fitness ?? 0}건`} />
      </div>

      {seasonAccess?.accessible === false ? (
        <div className="mt-4 rounded border border-amber-300/30 bg-amber-400/10 p-3 text-sm text-amber-50">
          <p className="font-black">API-Football 2026 시즌 접근 제한 감지</p>
          <p className="mt-1">{seasonAccess.reason}</p>
          <p className="mt-1 text-amber-50/75">
            감지 시각: {formatDate(seasonAccess.detectedAt)} · 영향 엔드포인트: {seasonAccess.affectedEndpoints.join(", ")}
          </p>
        </div>
      ) : null}

      {status ? (
        <p className="mt-4 rounded border border-white/10 bg-white/8 p-3 text-sm font-semibold text-white/78">{status.message}</p>
      ) : null}
      {diagnostics ? (
        <div className="mt-4 rounded border border-cyan-300/25 bg-cyan-400/10 p-3 text-sm text-cyan-50">
          <p className="font-black">최신 정보 반영 결과</p>
          <p className="mt-1">
            수집 {diagnostics.collectedResults}건 · 정규화 {diagnostics.normalizedItems}건 · 매핑 성공 {diagnostics.targetMappingSuccess}건 · 경기 상세 {diagnostics.matchDetailReflected}건 · 팀 상세 {diagnostics.teamDetailReflected}건
          </p>
          <p className="mt-1 text-cyan-50/75">
            localStorage 저장 방식: {diagnostics.storage.mode} · 원본 {diagnostics.storage.originalSnapshotBytes.toLocaleString("ko-KR")} bytes · 메타 {diagnostics.storage.metaBytes.toLocaleString("ko-KR")} bytes · 정규화 {diagnostics.storage.normalizedBytes.toLocaleString("ko-KR")} bytes
          </p>
          <p className="mt-1 text-cyan-50/75">{diagnostics.storage.message}</p>
        </div>
      ) : null}
      {message ? <p className="mt-4 rounded border border-white/10 bg-white/8 p-3 text-sm font-semibold text-white/78">{message}</p> : null}

      {sampleItems.length > 0 ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sampleItems.map(({ result, item }, index) => (
            <article key={`${result.targetId}-${item.category}-${index}`} className="rounded border border-white/10 bg-pitch-900/80 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={item.status === "추가 확인 필요" ? "warning" : "success"}>{item.status}</Badge>
                <span className="text-xs font-semibold text-white/45">{item.category}</span>
              </div>
              <p className="mt-2 break-words text-sm font-black text-white">{item.title}</p>
              <p className="mt-2 line-clamp-3 text-xs leading-5 text-white/62">{item.value}</p>
              <p className="mt-2 line-clamp-2 text-xs text-white/45">출처: {item.sourceNames.join(", ")}</p>
              <p className="mt-1 text-xs text-white/45">업데이트: {formatDate(item.lastCheckedAt)} · 신뢰도: {result.confidence}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/10 bg-pitch-900/80 p-3">
      <p className="text-xs text-white/50">{label}</p>
      <p className="mt-1 break-words font-black text-white">{value}</p>
    </div>
  );
}

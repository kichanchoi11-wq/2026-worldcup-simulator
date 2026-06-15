"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/Badge";
import { readArrayStorage, storageKeys } from "@/lib/storage";
import type { MatchReview } from "@/types/match";
import type { RecollectionJob } from "@/types/recollection";

type StoredMatchState = {
  review: MatchReview | null;
  latestJob: RecollectionJob | null;
  events: unknown[];
  injuries: unknown[];
  lineups: unknown[];
  statistics: unknown[];
};

function statusTone(status: string): Parameters<typeof Badge>[0]["tone"] {
  if (status === "성공") return "success";
  if (status === "부분 성공" || status === "건너뜀") return "warning";
  if (status === "실패") return "danger";
  return "neutral";
}

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

export default function StoredMatchRecollectionPanel({ matchId }: { matchId: string | number }) {
  const [state, setState] = useState<StoredMatchState | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const reviews = readArrayStorage<MatchReview>(storageKeys.matchReviewsData);
      const jobs = readArrayStorage<RecollectionJob>(storageKeys.adminRecollectionJobsData);

      setState({
        review: reviews.find((item) => String(item.matchId) === String(matchId)) ?? null,
        latestJob: jobs.find((job) => ["risks", "lineups", "match-reviews", "all"].includes(job.scope)) ?? null,
        events: readArrayStorage<unknown>(storageKeys.apiFootballEventsData),
        injuries: readArrayStorage<unknown>(storageKeys.apiFootballInjuriesData),
        lineups: readArrayStorage<unknown>(storageKeys.apiFootballLineupsData),
        statistics: readArrayStorage<unknown>(storageKeys.apiFootballStatisticsData)
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [matchId]);

  if (!state || (!state.latestJob && !state.review && state.events.length === 0 && state.injuries.length === 0 && state.lineups.length === 0)) {
    return null;
  }

  return (
    <section className="rounded border border-cyan-300/25 bg-cyan-400/10 p-5 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="API 실제 데이터">관리자 재수집 반영</Badge>
            {state.latestJob ? <Badge tone={statusTone(state.latestJob.status)}>{state.latestJob.status}</Badge> : null}
            {state.review ? <Badge tone={state.review.reviewType === "gemini" ? "AI 예측" : "분석 참고"}>{state.review.reviewType}</Badge> : null}
          </div>
          <h2 className="mt-3 text-xl font-black text-white">저장된 경기 재검증 결과</h2>
          <p className="mt-2 text-sm leading-6 text-cyan-50/75">
            카드, 징계, 부상, 라인업, 경기 리뷰 재수집 결과가 저장되어 있으면 이 화면에서 함께 확인합니다.
          </p>
        </div>
        <div className="rounded border border-white/10 bg-pitch-900/80 px-3 py-2 text-sm font-black text-white">
          {formatDate(state.latestJob?.finishedAt ?? state.review?.reviewedAt)}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="API 이벤트" value={`${state.events.length}건 저장`} />
        <InfoCard label="API 부상" value={`${state.injuries.length}건 저장`} />
        <InfoCard label="API 라인업" value={`${state.lineups.length}건 저장`} />
        <InfoCard label="API 통계" value={`${state.statistics.length}건 저장`} />
      </div>

      {state.review ? (
        <p className="mt-4 rounded border border-white/10 bg-pitch-900/80 p-4 text-sm leading-6 text-white/75">
          {state.review.matchSummary}
        </p>
      ) : null}

      {state.latestJob?.message ? <p className="mt-4 rounded border border-white/10 bg-white/8 p-3 text-sm text-white/75">{state.latestJob.message}</p> : null}
    </section>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/10 bg-pitch-900/80 p-3">
      <p className="text-xs text-white/50">{label}</p>
      <p className="mt-2 break-words text-sm font-black leading-6 text-white">{value}</p>
    </div>
  );
}

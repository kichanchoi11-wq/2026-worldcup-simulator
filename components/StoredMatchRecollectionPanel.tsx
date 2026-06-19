"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/Badge";
import { teamVerificationData } from "@/data/teamVerificationData";
import { readArrayStorage, storageKeys } from "@/lib/storage";
import type { CardRecord } from "@/types/card";
import type { FootballMatch } from "@/types/football";
import type { MatchReview } from "@/types/match";
import type { RecollectionJob } from "@/types/recollection";

type StoredMatchState = {
  actualMatch: FootballMatch | null;
  fitnessSummary: string;
  review: MatchReview | null;
  latestJob: RecollectionJob | null;
  events: unknown[];
  cardRecords: CardRecord[];
  injuries: unknown[];
  lineups: unknown[];
  statistics: unknown[];
};

type StoredMatchRecollectionPanelProps = {
  matchId: string | number;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  homeTeamName?: string | null;
  awayTeamName?: string | null;
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

function normalizeName(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9가-힣]+/g, " ")
    .trim();
}

function aliasesFor(teamId: string | null | undefined, teamName: string | null | undefined) {
  const team = teamVerificationData.find((item) => item.teamId === teamId);
  return [teamName, team?.teamName, team?.teamNameEn, team?.teamCode, team?.teamId].map(normalizeName).filter(Boolean);
}

function nameMatches(apiName: string, aliases: string[]) {
  const normalized = normalizeName(apiName);
  return aliases.some((alias) => normalized.includes(alias) || alias.includes(normalized));
}

function findStoredActualMatch(matches: FootballMatch[], props: StoredMatchRecollectionPanelProps) {
  const direct = matches.find((match) => String(match.id) === String(props.matchId));
  if (direct) return direct;

  const homeAliases = aliasesFor(props.homeTeamId, props.homeTeamName);
  const awayAliases = aliasesFor(props.awayTeamId, props.awayTeamName);

  return (
    matches.find((match) => {
      const sameDirection = nameMatches(match.homeTeam, homeAliases) && nameMatches(match.awayTeam, awayAliases);
      const swapped = nameMatches(match.homeTeam, awayAliases) && nameMatches(match.awayTeam, homeAliases);
      return sameDirection || swapped;
    }) ?? null
  );
}

function scoreLabel(match: FootballMatch | null) {
  if (!match || match.score.home === null || match.score.away === null) {
    return "스코어 없음";
  }

  return `${match.homeTeam} ${match.score.home} - ${match.score.away} ${match.awayTeam}`;
}

function daysBetween(from: string, to: string) {
  return Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / (24 * 60 * 60 * 1000)));
}

function teamScheduleSummary(matches: FootballMatch[], actualMatch: FootballMatch, teamName: string) {
  if (!actualMatch.utcDate) {
    return `${teamName}: 경기 날짜가 없어 휴식일 계산 보류`;
  }

  const dates = matches
    .filter((match) => (match.homeTeam === teamName || match.awayTeam === teamName) && match.utcDate)
    .map((match) => match.utcDate as string)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const currentIndex = dates.findIndex((date) => date === actualMatch.utcDate);
  const previous = currentIndex > 0 ? dates[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < dates.length - 1 ? dates[currentIndex + 1] : null;
  const restDays = previous ? daysBetween(previous, actualMatch.utcDate) : null;
  const nextGap = next ? daysBetween(actualMatch.utcDate, next) : null;
  const density = restDays !== null && restDays <= 3 ? "높음" : restDays !== null && restDays <= 5 ? "보통" : "낮음";

  return `${teamName}: 이전 경기 ${restDays ?? "없음"}일 전, 다음 경기 ${nextGap ?? "미정"}일 후, 일정 밀도 ${density}`;
}

function fitnessSummary(matches: FootballMatch[], actualMatch: FootballMatch | null) {
  if (!actualMatch) {
    return "저장 경기 매칭 전에도 체력은 경기 일정 기반 내부 계산 대상으로 유지됩니다.";
  }

  return [
    teamScheduleSummary(matches, actualMatch, actualMatch.homeTeam),
    teamScheduleSummary(matches, actualMatch, actualMatch.awayTeam)
  ].join(" / ");
}

const fallbackReason =
  "API-Football 무료 플랜에서 2026 events/injuries/statistics 또는 fixtureId 접근이 제한되면, 해당 항목은 비워두지 않고 football-data.org 실제 결과, 정적 확인 대상, 공식 보고서 확인 안내, 내부 일정 계산으로 표시합니다.";

export default function StoredMatchRecollectionPanel({
  matchId,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName
}: StoredMatchRecollectionPanelProps) {
  const [state, setState] = useState<StoredMatchState | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const matches = readArrayStorage<FootballMatch>(storageKeys.apiMatchesData);
      const reviews = readArrayStorage<MatchReview>(storageKeys.matchReviewsData);
      const jobs = readArrayStorage<RecollectionJob>(storageKeys.adminRecollectionJobsData);
      const allCardRecords = readArrayStorage<CardRecord>(storageKeys.apiFootballCardRecordsData);
      const actualMatch = findStoredActualMatch(matches, { matchId, homeTeamId, awayTeamId, homeTeamName, awayTeamName });
      const matchCardRecords = allCardRecords.filter((record) => record.matchId !== null && String(record.matchId) === String(matchId));

      setState({
        actualMatch,
        fitnessSummary: fitnessSummary(matches, actualMatch),
        review: reviews.find((item) => String(item.matchId) === String(matchId)) ?? null,
        latestJob: jobs.find((job) => ["risks", "lineups", "match-reviews", "ai-risks", "ai-all", "all"].includes(job.scope)) ?? null,
        events: readArrayStorage<unknown>(storageKeys.apiFootballEventsData),
        cardRecords: matchCardRecords.length > 0 ? matchCardRecords : allCardRecords.slice(0, 12),
        injuries: readArrayStorage<unknown>(storageKeys.apiFootballInjuriesData),
        lineups: readArrayStorage<unknown>(storageKeys.apiFootballLineupsData),
        statistics: readArrayStorage<unknown>(storageKeys.apiFootballStatisticsData)
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [awayTeamId, awayTeamName, homeTeamId, homeTeamName, matchId]);

  if (!state) {
    return null;
  }

  return (
    <section className="rounded border border-cyan-300/25 bg-cyan-400/10 p-5 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="API 실제 데이터">관리자 재수집 반영</Badge>
            {state.actualMatch ? <Badge tone={state.actualMatch.locked || (state.actualMatch.score.home !== null && state.actualMatch.score.away !== null) ? "success" : "warning"}>실제 API 결과 우선</Badge> : null}
            {state.latestJob ? <Badge tone={statusTone(state.latestJob.status)}>{state.latestJob.status}</Badge> : null}
            {state.review ? <Badge tone={state.review.reviewType === "ai" ? "AI 예측" : "분석 참고"}>{state.review.reviewType}</Badge> : null}
          </div>
          <h2 className="mt-3 text-xl font-black text-white">저장된 경기 재검증 결과</h2>
          <p className="mt-2 text-sm leading-6 text-cyan-50/75">
            저장된 경기 결과, 카드, 징계, 부상, 라인업, 경기 리뷰 재수집 결과가 있으면 정적 경기 정보보다 먼저 이 영역에서 확인합니다.
          </p>
        </div>
        <div className="rounded border border-white/10 bg-pitch-900/80 px-3 py-2 text-sm font-black text-white">
          {formatDate(state.latestJob?.finishedAt ?? state.review?.reviewedAt)}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="실제 경기 상태" value={state.actualMatch ? `${state.actualMatch.status} · ${state.actualMatch.sourceType}` : "저장 경기 매칭 없음"} />
        <InfoCard label="실제 스코어" value={scoreLabel(state.actualMatch)} />
        <InfoCard label="실제 일정/경기장" value={state.actualMatch ? `${state.actualMatch.utcDate ? new Date(state.actualMatch.utcDate).toLocaleString("ko-KR") : "일정 없음"} · ${state.actualMatch.venue ?? "경기장 없음"}` : "저장 경기 없음"} />
        <InfoCard label="체력 내부 계산" value={state.fitnessSummary} />
        <InfoCard label="API 이벤트" value={`${state.events.length}건 저장`} />
        <InfoCard label="카드 현황" value={`${state.cardRecords.length}건 저장`} />
        <InfoCard label="API 부상" value={`${state.injuries.length}건 저장`} />
        <InfoCard label="API 라인업" value={`${state.lineups.length}건 저장`} />
        <InfoCard label="API 통계" value={`${state.statistics.length}건 저장`} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <FallbackInfo
          title="카드 대체 처리"
          body={
            state.events.length > 0
              ? "API-Football events 저장 데이터가 있으면 실제 카드 이벤트를 우선 표시합니다."
              : "API-Football 2026 events 또는 fixtureId가 없어 실제 카드 이벤트를 직접 수집하지 못했습니다. 정적 카드 확인 대상과 공식 경기 보고서 확인 필요 상태를 표시합니다."
          }
        />
        <FallbackInfo
          title="부상 대체 처리"
          body={
            state.injuries.length > 0
              ? "저장된 injuries/fallback 데이터가 있어 부상·결장 확인 대상으로 표시합니다."
              : "API-Football 2026 injuries 접근이 제한되면 확인된 부상 없음으로 단정하지 않고 공식 부상 데이터 미제공 및 확인 필요로 표시합니다."
          }
        />
        <FallbackInfo
          title="징계 계산"
          body="공식 카드 이벤트가 없으면 확정 징계를 단정하지 않습니다. 경고 누적 위험 구조와 레드카드/두 번째 경고 확인 필요 상태를 표시합니다."
        />
        <FallbackInfo
          title="체력 계산"
          body="체력은 API 직접 데이터가 없어도 이전/다음 경기 날짜, 휴식일, 일정 밀도, 경기장 확인 여부를 내부 계산 참고 지표로 표시합니다."
        />
      </div>

      <p className="mt-4 rounded border border-amber-300/25 bg-amber-400/10 p-3 text-sm leading-6 text-amber-50/85">{fallbackReason}</p>

      {state.review ? (
        <p className="mt-4 rounded border border-white/10 bg-pitch-900/80 p-4 text-sm leading-6 text-white/75">
          {state.review.matchSummary}
        </p>
      ) : null}

      {state.cardRecords.length > 0 ? (
        <div className="mt-4 rounded border border-white/10 bg-pitch-900/80 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={state.cardRecords.some((record) => record.sourceName === "API-Football") ? "success" : "warning"}>
              {state.cardRecords.some((record) => record.sourceName === "API-Football") ? "API 카드 이벤트" : "카드 확인 대상"}
            </Badge>
          </div>
          <ul className="mt-3 grid gap-2 text-sm text-white/70 md:grid-cols-2">
            {state.cardRecords.slice(0, 8).map((record) => (
              <li key={record.id} className="rounded border border-white/10 bg-white/[0.04] p-3">
                <span className="font-black text-white">{record.playerName ?? "선수 확인 필요"}</span>
                <span className="text-white/50"> · {record.teamName ?? "팀 확인 필요"} · {record.cardType}</span>
                <p className="mt-1 text-xs leading-5 text-white/55">
                  {record.minute !== null ? `${record.minute}분 · ` : ""}
                  {record.reason ?? "공식 이벤트 동기화 후 실제 카드 사유가 표시됩니다."}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {state.cardRecords.length === 0 ? (
        <div className="mt-4 rounded border border-white/10 bg-pitch-900/80 p-4">
          <Badge tone="warning">카드 확인 대상</Badge>
          <p className="mt-3 text-sm leading-6 text-white/65">
            저장된 카드 이벤트가 없습니다. API-Football 2026 events가 제한되었거나 fixtureId가 없어 직접 수집하지 못한 상태이며, 공식 경기 보고서 또는 관리자 입력 후 실제 카드 기록으로 교체됩니다.
          </p>
        </div>
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

function FallbackInfo({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded border border-white/10 bg-pitch-900/80 p-3">
      <p className="text-sm font-black text-white">{title}</p>
      <p className="mt-2 text-xs leading-5 text-white/62">{body}</p>
    </div>
  );
}

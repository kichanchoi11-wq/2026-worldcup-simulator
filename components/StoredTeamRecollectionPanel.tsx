"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/Badge";
import { readArrayStorage, storageKeys } from "@/lib/storage";
import type { ApiFootballResourceSnapshot } from "@/types/football";
import type { RecollectionJob } from "@/types/recollection";
import type { CoachTacticalProfile, KoreaVsTeamPrediction, TeamFormationProfile, TeamRiskProfile } from "@/types/team";

type StoredTeamState = {
  tactic: CoachTacticalProfile | null;
  formation: TeamFormationProfile | null;
  risk: TeamRiskProfile | null;
  prediction: KoreaVsTeamPrediction | null;
  latestJob: RecollectionJob | null;
  resources: ApiFootballResourceSnapshot[];
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

export default function StoredTeamRecollectionPanel({ teamId }: { teamId: string }) {
  const [state, setState] = useState<StoredTeamState | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const tactics = readArrayStorage<CoachTacticalProfile>(storageKeys.teamTacticsData);
      const formations = readArrayStorage<TeamFormationProfile>(storageKeys.teamFormationsData);
      const risks = readArrayStorage<TeamRiskProfile>(storageKeys.teamRiskProfilesData);
      const predictions = readArrayStorage<KoreaVsTeamPrediction>(storageKeys.koreaVsTeamPredictionsData);
      const jobs = readArrayStorage<RecollectionJob>(storageKeys.adminRecollectionJobsData);
      const resources = readArrayStorage<ApiFootballResourceSnapshot>(storageKeys.apiFootballResourceSnapshotsData);

      setState({
        tactic: tactics.find((item) => item.teamId === teamId) ?? null,
        formation: formations.find((item) => item.teamId === teamId) ?? null,
        risk: risks.find((item) => item.teamId === teamId) ?? null,
        prediction: predictions.find((item) => item.opponentTeamId === teamId) ?? null,
        latestJob: jobs.find((job) =>
          ["coaches", "formations", "tactics", "risks", "ai-coach-tactics", "ai-formations", "ai-risks", "ai-all", "all"].includes(job.scope)
        ) ?? null,
        resources
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [teamId]);

  if (!state || (!state.tactic && !state.formation && !state.risk && !state.prediction && !state.latestJob)) {
    return null;
  }

  return (
    <section className="rounded border border-cyan-300/25 bg-cyan-400/10 p-5 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="API 실제 데이터">관리자 재수집 반영</Badge>
            {state.latestJob ? <Badge tone={statusTone(state.latestJob.status)}>{state.latestJob.status}</Badge> : null}
          </div>
          <h2 className="mt-3 text-xl font-black text-white">저장된 최신 재검증 결과</h2>
          <p className="mt-2 text-sm leading-6 text-cyan-50/75">
            관리자 재검증 API Route가 저장한 감독, 포메이션, 전술, 위험도 데이터를 이 화면에 반영합니다.
          </p>
        </div>
        <div className="rounded border border-white/10 bg-pitch-900/80 px-3 py-2 text-sm font-black text-white">
          {formatDate(state.latestJob?.finishedAt)}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="감독/전술" value={state.tactic?.coachName ? `${state.tactic.coachName} · ${state.tactic.preferredFormations.join(" / ")}` : "저장 데이터 없음"} />
        <InfoCard label="최근/예상 포메이션" value={[state.formation?.recentFormation, state.formation?.expectedFormation].filter(Boolean).join(" / ") || "저장 데이터 없음"} />
        <InfoCard label="카드·부상·징계" value={state.risk ? `${state.risk.cardRisk.teamCardRiskLevel} · ${state.risk.injuryRisk.keyPlayerInjuryRisk}` : "저장 데이터 없음"} />
        <InfoCard
          label="대한민국 상대 승률"
          value={state.prediction ? `한국 ${state.prediction.koreaWinProbability}% · 무 ${state.prediction.drawProbability}% · 상대 ${state.prediction.opponentWinProbability}%` : "저장 데이터 없음"}
        />
      </div>

      {state.latestJob?.message ? <p className="mt-4 rounded border border-white/10 bg-white/8 p-3 text-sm text-white/75">{state.latestJob.message}</p> : null}

      {state.resources.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {state.resources.slice(0, 8).map((resource) => (
            <Badge key={`${resource.resource}-${resource.lastUpdated}-${resource.label}`} tone={resource.source === "api-football" ? "success" : "warning"}>
              {resource.label}: {resource.source}
            </Badge>
          ))}
        </div>
      ) : null}
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

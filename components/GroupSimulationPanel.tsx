"use client";

import { useState } from "react";
import Badge from "@/components/Badge";
import { removeStorageItem, storageKeys, writeStorage } from "@/lib/storage";
import type { TeamGroup } from "@/types/football";
import type { GroupSimulationData } from "@/types/simulation";

export default function GroupSimulationPanel({ groups }: { groups: TeamGroup[] }) {
  const [simulation, setSimulation] = useState<GroupSimulationData | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function runSimulation() {
    setLoading(true);
    setMessage(null);
    const response = await fetch("/api/ai/group-simulation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groups })
    });
    const data = (await response.json()) as GroupSimulationData;
    writeStorage(storageKeys.aiGroupSimulationData, data);
    setSimulation(data);
    setMessage("AI 조별리그 시뮬레이션 결과를 저장했습니다.");
    setLoading(false);
  }

  function resetAiGroupData() {
    const confirmed = window.confirm(
      "조별리그 AI 시뮬레이션 결과만 삭제됩니다. 실제 경기 결과, 공식 정보, 사용자 입력 결과, 경우의 수 계산기 데이터는 삭제되지 않습니다. 계속하시겠습니까?"
    );

    if (!confirmed) {
      return;
    }

    removeStorageItem(storageKeys.aiGroupSimulationData);
    setSimulation(null);
    setMessage("AI 조별리그 시뮬레이션 결과만 삭제했습니다.");
  }

  return (
    <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">조별리그 AI 시뮬레이션</h2>
          <p className="mt-1 text-sm text-white/60">검증되지 않은 선수·감독·전술·포메이션 정보는 예측 변수에서 제외합니다.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={runSimulation}
            disabled={loading}
            className="rounded border border-sky-300/60 bg-sky-400/15 px-4 py-2 text-sm font-black text-white transition hover:bg-sky-400/25 disabled:opacity-50"
          >
            {loading ? "실행 중" : "AI 시뮬레이션 실행"}
          </button>
          <button
            type="button"
            onClick={resetAiGroupData}
            className="rounded border border-red-300/60 bg-red-400/15 px-4 py-2 text-sm font-black text-white transition hover:bg-red-400/25"
          >
            AI 시뮬레이션 결과 초기화
          </button>
        </div>
      </div>

      {message ? <p className="mt-4 rounded border border-white/10 bg-white/8 p-3 text-sm text-white/75">{message}</p> : null}

      {simulation ? (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge tone="AI 예측">AI 예측</Badge>
            <Badge tone={simulation.predictedQualifiedTeams.length === 32 ? "success" : "warning"}>
              32강 진출팀 {simulation.predictedQualifiedTeams.length}팀
            </Badge>
            <Badge tone="확인 필요">선수 정보 확인 필요</Badge>
          </div>
          <p className="text-sm leading-relaxed text-white/70">{simulation.notice}</p>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {simulation.predictedQualifiedTeams.slice(0, 32).map((team) => (
              <div key={`${team.seed}-${team.id}`} className="rounded border border-white/10 bg-pitch-900/80 p-3">
                <p className="text-xs font-black text-trophy">{team.seed}</p>
                <p className="font-semibold text-white">{team.nameKo}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

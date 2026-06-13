"use client";

import { useState } from "react";
import Badge from "@/components/Badge";
import Bracket from "@/components/Bracket";
import { buildOfficialBracketWithWinners, validateGroupStageForTournament } from "@/lib/bracket";
import { readStorage, storageKeys, writeStorage } from "@/lib/storage";
import type { BracketTeam } from "@/types/bracket";
import type { GroupSimulationData, ScenarioCalculatorData } from "@/types/simulation";

type SourceId = "ai" | "scenario" | "user" | "api";

const sourceLabels: Record<SourceId, string> = {
  ai: "AI 조별리그 결과 기준",
  scenario: "경우의 수 계산기 결과 기준",
  user: "사용자 입력 조별리그 결과 기준",
  api: "API 실제 결과 기준"
};

export default function TournamentSimulationPanel() {
  const [sourceId, setSourceId] = useState<SourceId>("ai");
  const [winnerIds, setWinnerIds] = useState<Record<number, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const sources = {
    ai: readStorage<GroupSimulationData | null>(storageKeys.aiGroupSimulationData, null),
    scenario: readStorage<ScenarioCalculatorData | null>(storageKeys.scenarioCalculatorData, null),
    user: null,
    api: null
  };

  const selectedSource = sources[sourceId];
  const validation = validateGroupStageForTournament(selectedSource);
  const selectedSeedMap = Object.fromEntries(validation.qualifiedTeams.map((team) => [team.seed, team]));
  const bracket = buildOfficialBracketWithWinners(selectedSeedMap, winnerIds);

  async function runTournamentSimulation() {
    const currentValidation = validateGroupStageForTournament(selectedSource);
    if (!currentValidation.canStart) {
      setMessage(currentValidation.reason ?? "32강 진출팀 데이터 확인이 필요합니다.");
      return;
    }

    const response = await fetch("/api/ai/tournament-simulation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qualifiedTeams: currentValidation.qualifiedTeams })
    });
    const data = await response.json();
    writeStorage(storageKeys.aiTournamentSimulationData, data);
    setMessage("토너먼트 AI 시뮬레이션을 저장했습니다.");
  }

  function chooseWinner(matchId: number, team: BracketTeam) {
    setWinnerIds((current) => ({ ...current, [matchId]: team.id }));
  }

  return (
    <section className="space-y-5">
      <div className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-white">토너먼트 기준 데이터 선택</h2>
            <p className="mt-1 text-sm text-white/60">실제 32강 진출팀 배열을 검증해서 실행 가능 여부를 판단합니다.</p>
          </div>
          <button
            type="button"
            onClick={runTournamentSimulation}
            className="rounded border border-violet-300/60 bg-violet-400/15 px-4 py-2 text-sm font-black text-white transition hover:bg-violet-400/25"
          >
            토너먼트 AI 시뮬레이션 실행
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {(Object.keys(sourceLabels) as SourceId[]).map((id) => {
            const itemValidation = validateGroupStageForTournament(sources[id]);
            return (
              <button
                type="button"
                key={id}
                onClick={() => setSourceId(id)}
                disabled={!itemValidation.canStart}
                className={`rounded border p-3 text-left transition ${
                  sourceId === id
                    ? "border-trophy/70 bg-trophy/20 text-white"
                    : "border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/10"
                } disabled:cursor-not-allowed disabled:opacity-45`}
              >
                <span className="block text-sm font-black">{sourceLabels[id]}</span>
                <span className="mt-1 block text-xs">{itemValidation.count}팀 확인</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone={validation.canStart ? "success" : "warning"}>
            {validation.canStart ? "토너먼트 AI 시뮬레이션 실행 가능" : "32강 데이터 확인 필요"}
          </Badge>
          <Badge tone="neutral">현재 기준: {sourceLabels[sourceId]}</Badge>
          <Badge tone="neutral">32강 진출팀: {validation.count}팀</Badge>
        </div>

        {message ? <p className="mt-4 rounded border border-white/10 bg-white/8 p-3 text-sm text-white/75">{message}</p> : null}
      </div>

      <div className="rounded border border-amber-300/25 bg-amber-400/10 p-4 text-sm text-amber-50">
        3위 팀 공식 배정표가 없어 32강 대진을 완전히 확정할 수 없습니다. 공식 배정표 확인이 필요합니다.
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
        <section className="rounded border border-white/10 bg-white/[0.06] p-4">
          <h3 className="font-black text-white">승자 직접 선택</h3>
          <div className="mt-3 space-y-3">
            {bracket.slice(0, 16).map((match) => (
              <div key={match.matchId} className="rounded border border-white/10 bg-pitch-900/80 p-3">
                <p className="mb-2 text-xs font-black text-trophy">{match.matchId}번 경기</p>
                {[match.teamA, match.teamB].map((team) =>
                  team ? (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => chooseWinner(match.matchId, team)}
                      className={`mb-2 block w-full rounded border px-3 py-2 text-left text-sm font-semibold ${
                        winnerIds[match.matchId] === team.id
                          ? "border-trophy/70 bg-trophy/20 text-white"
                          : "border-white/10 bg-white/5 text-white/75"
                      }`}
                    >
                      {team.nameKo}
                    </button>
                  ) : null
                )}
                {!match.teamA || !match.teamB ? <p className="text-xs text-white/55">대진 확정 전</p> : null}
              </div>
            ))}
          </div>
        </section>
        <Bracket matches={bracket} />
      </div>
    </section>
  );
}

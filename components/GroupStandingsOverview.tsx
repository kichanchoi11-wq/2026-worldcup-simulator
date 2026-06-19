"use client";

import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/Badge";
import FlagIcon from "@/components/FlagIcon";
import {
  calculateScenarioStandings,
  createInitialScenarioMatchInputs,
  toActualStandingsFromStoredData
} from "@/lib/scenarioStandings";
import { readArrayStorage, readStorage, storageKeys } from "@/lib/storage";
import type { FootballMatch, StandingRow, TeamGroup } from "@/types/football";
import type { SourcedFootballInfo } from "@/types/freshInfo";
import type { ScenarioCalculatorData, ScenarioStandingRow } from "@/types/simulation";

type StandingsState = {
  actual: Record<string, ScenarioStandingRow[]>;
  simulation: Record<string, ScenarioStandingRow[]>;
  actualSourceLabel: string;
  simulationSourceLabel: string;
};

function teamForRow(groups: TeamGroup[], row: ScenarioStandingRow) {
  return groups.flatMap((group) => group.teams).find((team) => team.id === row.teamId || team.nameKo === row.teamName);
}

function formatGoalDifference(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}

function statusMark(row: ScenarioStandingRow) {
  if (row.rank <= 2) return "↑";
  if (row.rank === 3) return "?";
  return "";
}

export default function GroupStandingsOverview({ groups }: { groups: TeamGroup[] }) {
  const [state, setState] = useState<StandingsState | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const apiMatches = readArrayStorage<FootballMatch>(storageKeys.apiMatchesData);
      const apiStandings = readArrayStorage<StandingRow>(storageKeys.apiStandingsData);
      const sourcedItems = readArrayStorage<SourcedFootballInfo>(storageKeys.sourcedFootballInfoData);
      const scenario = readStorage<ScenarioCalculatorData | null>(storageKeys.scenarioCalculatorData, null);
      const initialInputs = createInitialScenarioMatchInputs(groups);
      const simulation = scenario?.scenarioStandings ?? calculateScenarioStandings(groups, scenario?.matchInputs ?? initialInputs, "simulation");

      setState({
        actual: toActualStandingsFromStoredData(groups, apiStandings, apiMatches, sourcedItems),
        simulation,
        actualSourceLabel:
          apiStandings.length > 0
            ? "API/football-data.org 저장 순위"
            : apiMatches.length > 0 || sourcedItems.length > 0
              ? "저장 경기 결과 기반 계산"
              : "아직 실제 결과 없음",
        simulationSourceLabel: scenario?.scenarioStandings ? "저장된 경우의 수 시나리오" : "기본 대진 기준 미입력 상태"
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [groups]);

  const actualCount = useMemo(() => Object.values(state?.actual ?? {}).flat().filter((row) => row.played > 0).length, [state]);
  const simulationCount = useMemo(() => Object.values(state?.simulation ?? {}).flat().filter((row) => row.played > 0).length, [state]);

  if (!state) {
    return null;
  }

  return (
    <section className="space-y-4 rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="API 실제 데이터">실제/API 순위</Badge>
            <Badge tone="경우의 수">시뮬레이션 순위</Badge>
          </div>
          <h2 className="mt-3 text-xl font-black text-white">조별 순위표</h2>
          <p className="mt-2 text-sm leading-6 text-white/65">
            실제 API/검색 기반 순위와 사용자가 저장한 경우의 수 순위를 분리해 표시합니다. 표는 P/W/D/L/GF/GA/GD/Pts 기준으로 자동 계산됩니다.
          </p>
        </div>
        <div className="grid gap-2 text-sm font-black text-white sm:grid-cols-2">
          <div className="rounded border border-white/10 bg-pitch-900/80 px-3 py-2">{state.actualSourceLabel}</div>
          <div className="rounded border border-white/10 bg-pitch-900/80 px-3 py-2">{state.simulationSourceLabel}</div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <StandingsPanel groups={groups} title="실제 API/검색 기반 순위" standings={state.actual} emptyCount={actualCount} />
        <StandingsPanel groups={groups} title="경우의 수 시뮬레이션 순위" standings={state.simulation} emptyCount={simulationCount} />
      </div>
    </section>
  );
}

function StandingsPanel({
  groups,
  title,
  standings,
  emptyCount
}: {
  groups: TeamGroup[];
  title: string;
  standings: Record<string, ScenarioStandingRow[]>;
  emptyCount: number;
}) {
  return (
    <div className="rounded border border-white/10 bg-pitch-900/70 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-black text-white">{title}</h3>
        <Badge tone={emptyCount > 0 ? "success" : "warning"}>{emptyCount > 0 ? "결과 반영" : "결과 대기"}</Badge>
      </div>
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={`${title}-${group.id}`} className="overflow-hidden rounded border border-white/10">
            <div className="bg-white/10 px-3 py-2 text-sm font-black text-white">{group.name}</div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-white/[0.06] text-xs uppercase text-white/55">
                  <tr>
                    <th className="px-2 py-2">#</th>
                    <th className="px-2 py-2">Team</th>
                    <th className="px-2 py-2 text-center">P</th>
                    <th className="px-2 py-2 text-center">W</th>
                    <th className="px-2 py-2 text-center">D</th>
                    <th className="px-2 py-2 text-center">L</th>
                    <th className="px-2 py-2 text-center">GF</th>
                    <th className="px-2 py-2 text-center">GA</th>
                    <th className="px-2 py-2 text-center">GD</th>
                    <th className="px-2 py-2 text-center">Pts</th>
                    <th className="px-2 py-2 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {(standings[group.id] ?? []).map((row) => {
                    const team = teamForRow(groups, row);
                    return (
                      <tr key={`${title}-${group.id}-${row.teamId}`} className="bg-white/[0.035] text-white/80">
                        <td className="px-2 py-2 font-black">{row.rank}</td>
                        <td className="px-2 py-2">
                          <span className="flex min-w-0 items-center gap-2 font-black">
                            <FlagIcon src={team?.flagImageUrl} alt={team?.flagAlt} fallback={team?.flag ?? ""} />
                            <span className="truncate">{team?.teamCode ?? row.teamName}</span>
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center">{row.played}</td>
                        <td className="px-2 py-2 text-center">{row.won}</td>
                        <td className="px-2 py-2 text-center">{row.drawn}</td>
                        <td className="px-2 py-2 text-center">{row.lost}</td>
                        <td className="px-2 py-2 text-center">{row.goalsFor}</td>
                        <td className="px-2 py-2 text-center">{row.goalsAgainst}</td>
                        <td className="px-2 py-2 text-center">{formatGoalDifference(row.goalDifference)}</td>
                        <td className="px-2 py-2 text-center font-black text-white">{row.points}</td>
                        <td className="px-2 py-2 text-center text-emerald-200">{statusMark(row)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

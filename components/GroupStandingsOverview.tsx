"use client";

import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/Badge";
import FlagIcon from "@/components/FlagIcon";
import { calculateScenarioStandings, toActualStandingsFromStoredData } from "@/lib/scenarioStandings";
import { readArrayStorage, storageKeys } from "@/lib/storage";
import type { FootballMatch, StandingRow, TeamGroup } from "@/types/football";
import type { SourcedFootballInfo } from "@/types/freshInfo";
import type { ScenarioStandingRow } from "@/types/simulation";

type StandingsState = {
  actual: Record<string, ScenarioStandingRow[]>;
  actualSourceLabel: string;
  actualDetailLabel: string;
};

function createInitialStandingsState(groups: TeamGroup[]): StandingsState {
  return {
    actual: calculateScenarioStandings(groups, [], "actual"),
    actualSourceLabel: "아직 실제 결과 없음",
    actualDetailLabel: "실제 결과가 없으면 모든 팀을 P=0 상태로 표시"
  };
}

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
  const [state, setState] = useState<StandingsState>(() => createInitialStandingsState(groups));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const apiMatches = readArrayStorage<FootballMatch>(storageKeys.apiMatchesData);
      const apiStandings = readArrayStorage<StandingRow>(storageKeys.apiStandingsData);
      const sourcedItems = readArrayStorage<SourcedFootballInfo>(storageKeys.sourcedFootballInfoData);
      const actual = toActualStandingsFromStoredData(groups, apiStandings, apiMatches, sourcedItems);
      const playedRows = Object.values(actual).flat().filter((row) => row.played > 0).length;

      setState({
        actual,
        actualSourceLabel:
          playedRows > 0
            ? "실제 경기 결과 기준 자동 계산"
            : apiMatches.length > 0 || sourcedItems.length > 0 || apiStandings.length > 0
              ? "저장 경기 결과 기반 계산"
              : "아직 실제 결과 없음",
        actualDetailLabel:
          playedRows > 0
            ? `P/W/D/L/GF/GA/GD/Pts ${playedRows}팀 반영`
            : "실제 결과가 없으면 모든 팀을 P=0 상태로 표시"
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [groups]);

  const actualCount = useMemo(() => Object.values(state?.actual ?? {}).flat().filter((row) => row.played > 0).length, [state]);

  return (
    <section className="space-y-4 rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="API 실제 데이터">실제/API 순위</Badge>
            <Badge tone="확인 필요">모의 순위 제외</Badge>
          </div>
          <h2 className="mt-3 text-xl font-black text-white">조별 순위표</h2>
          <p className="mt-2 text-sm leading-6 text-white/65">
            조별리그 탭은 API/football-data.org/검색/저장 경기 결과로 계산한 실제 순위만 표시합니다.
            사용자가 직접 고르는 가상 결과표는 경우의 수 계산기 탭에만 분리해 둡니다.
          </p>
        </div>
        <div className="grid gap-2 text-sm font-black text-white sm:grid-cols-2">
          <div className="rounded border border-white/10 bg-pitch-900/80 px-3 py-2">{state.actualSourceLabel}</div>
          <div className="rounded border border-white/10 bg-pitch-900/80 px-3 py-2">{state.actualDetailLabel}</div>
        </div>
      </div>

      <StandingsPanel groups={groups} title="실제 API/검색 기반 순위" standings={state.actual} emptyCount={actualCount} />
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

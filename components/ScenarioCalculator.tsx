"use client";

import { useMemo, useState } from "react";
import Badge from "@/components/Badge";
import Bracket from "@/components/Bracket";
import {
  buildOfficialBracketWithWinners,
  createSeedMapFromRankings,
  getThirdPlaceNotice
} from "@/lib/bracket";
import { createDefaultGroupRankings, getDefaultThirdPlaceQualifiers } from "@/lib/scenario";
import { readStorage, storageKeys, writeStorage } from "@/lib/storage";
import type { BracketTeam } from "@/types/bracket";
import type { ScenarioCalculatorData } from "@/types/simulation";

type Mode = "official" | "free";

function moveTeam(teams: BracketTeam[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= teams.length) {
    return teams;
  }

  const next = [...teams];
  const currentTeam = next[index];
  next[index] = next[nextIndex];
  next[nextIndex] = currentTeam;
  return next;
}

export default function ScenarioCalculator() {
  const [mode, setMode] = useState<Mode>("official");
  const [groupRankings, setGroupRankings] = useState(() => createDefaultGroupRankings());
  const [thirdPlaceQualifiers, setThirdPlaceQualifiers] = useState(() => getDefaultThirdPlaceQualifiers(createDefaultGroupRankings()));
  const [winnerIds, setWinnerIds] = useState<Record<number, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const seedMap = useMemo(() => createSeedMapFromRankings(groupRankings, thirdPlaceQualifiers), [groupRankings, thirdPlaceQualifiers]);
  const bracket = useMemo(() => buildOfficialBracketWithWinners(seedMap, winnerIds), [seedMap, winnerIds]);
  const champion = bracket.find((match) => match.round === "결승")?.winner ?? null;

  function updateGroup(group: string, index: number, direction: -1 | 1) {
    setGroupRankings((current) => ({
      ...current,
      [group]: moveTeam(current[group], index, direction).map((team, teamIndex) => ({
        ...team,
        seed: `${teamIndex + 1}${group}`
      }))
    }));
    setWinnerIds({});
  }

  function toggleThirdPlace(team: BracketTeam) {
    setThirdPlaceQualifiers((current) => {
      const exists = current.some((item) => item.id === team.id);
      if (exists) {
        return current.filter((item) => item.id !== team.id);
      }
      if (current.length >= 8) {
        return current;
      }
      return [...current, { ...team, seed: `3${team.group}` }];
    });
    setWinnerIds({});
  }

  function chooseWinner(matchId: number, team: BracketTeam) {
    setWinnerIds((current) => {
      const next = { ...current, [matchId]: team.id };
      for (const id of Object.keys(next)) {
        if (Number(id) > matchId) {
          delete next[Number(id)];
        }
      }
      return next;
    });
  }

  function resetScenario() {
    const defaultRankings = createDefaultGroupRankings();
    setGroupRankings(defaultRankings);
    setThirdPlaceQualifiers(getDefaultThirdPlaceQualifiers(defaultRankings));
    setWinnerIds({});
    setMessage("처음부터 다시 설정했습니다.");
  }

  function saveScenario() {
    const data: ScenarioCalculatorData = {
      groupRankings,
      thirdPlaceQualifiers,
      roundOf32: bracket.filter((match) => match.round === "32강"),
      roundOf16: bracket.filter((match) => match.round === "16강"),
      quarterFinals: bracket.filter((match) => match.round === "8강"),
      semiFinals: bracket.filter((match) => match.round === "4강"),
      thirdPlaceMatch: bracket.find((match) => match.round === "3·4위전") ?? null,
      final: bracket.find((match) => match.round === "결승") ?? null,
      champion,
      source: "경우의 수 계산기"
    };
    writeStorage(storageKeys.scenarioCalculatorData, data);
    setMessage("현재 시나리오를 저장했습니다.");
  }

  function loadScenario() {
    const data = readStorage<ScenarioCalculatorData | null>(storageKeys.scenarioCalculatorData, null);
    if (!data) {
      setMessage("저장한 시나리오가 없습니다.");
      return;
    }
    setGroupRankings(data.groupRankings);
    setThirdPlaceQualifiers(data.thirdPlaceQualifiers);
    setMessage("저장한 시나리오를 불러왔습니다.");
  }

  return (
    <section className="space-y-5">
      <div className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-white">경우의 수 계산기</h2>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-white/65">
              원하는 조별리그 순위와 토너먼트 승자를 직접 선택해 나만의 월드컵 시나리오를 만들어보세요. 이 기능은 실제 경기 결과와 별도로 작동합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setMode("official")} className={`rounded border px-3 py-2 text-sm font-black ${mode === "official" ? "border-trophy/70 bg-trophy/20 text-white" : "border-white/10 bg-white/5 text-white/70"}`}>
              공식 대진 모드
            </button>
            <button type="button" onClick={() => setMode("free")} className={`rounded border px-3 py-2 text-sm font-black ${mode === "free" ? "border-trophy/70 bg-trophy/20 text-white" : "border-white/10 bg-white/5 text-white/70"}`}>
              사용자 자유 대진 모드
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="경우의 수">경우의 수</Badge>
          <Badge tone={thirdPlaceQualifiers.length === 8 ? "success" : "warning"}>3위 후보 {thirdPlaceQualifiers.length}/8</Badge>
          {champion ? <Badge tone="gold">우승팀 {champion.nameKo}</Badge> : <Badge tone="neutral">우승팀 선택 전</Badge>}
        </div>

        <p className="mt-4 rounded border border-white/10 bg-white/8 p-3 text-sm text-white/70">
          {mode === "official"
            ? "공식 대진 모드: FIFA 공식 브래킷 구조를 기준으로 대진을 생성합니다."
            : "사용자 자유 대진 모드: 공식 대진과 다를 수 있으며, 사용자가 직접 만든 가상 시나리오입니다."}
        </p>

        {mode === "official" ? (
          <p className="mt-3 rounded border border-amber-300/25 bg-amber-400/10 p-3 text-sm text-amber-50">{getThirdPlaceNotice()}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={resetScenario} className="rounded border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white hover:bg-white/10">
            처음부터 다시 설정
          </button>
          <button type="button" onClick={saveScenario} className="rounded border border-trophy/60 bg-trophy/20 px-4 py-2 text-sm font-black text-white hover:bg-trophy/30">
            현재 시나리오 저장
          </button>
          <button type="button" onClick={loadScenario} className="rounded border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white hover:bg-white/10">
            저장한 시나리오 불러오기
          </button>
          <button type="button" onClick={() => setMessage(champion ? `결과 요약: ${champion.nameKo} 우승 시나리오입니다.` : "결과 요약을 보려면 결승 승자를 선택하세요.")} className="rounded border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white hover:bg-white/10">
            결과 요약 보기
          </button>
        </div>

        {message ? <p className="mt-4 rounded border border-white/10 bg-white/8 p-3 text-sm text-white/75">{message}</p> : null}
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="space-y-4">
          <h3 className="font-black text-white">조별 순위 직접 설정</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(groupRankings).map(([group, teams]) => (
              <article key={group} className="rounded border border-white/10 bg-white/[0.06] p-4">
                <h4 className="mb-3 font-black text-white">{group}조</h4>
                <div className="space-y-2">
                  {teams.map((team, index) => {
                    const isThirdSelected = thirdPlaceQualifiers.some((item) => item.id === team.id);
                    return (
                      <div key={team.id} className="rounded border border-white/10 bg-pitch-900/75 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">{index + 1}위 · {team.nameKo}</p>
                            <p className="text-xs text-white/45">{team.seed}</p>
                          </div>
                          <div className="flex gap-1">
                            <button type="button" onClick={() => updateGroup(group, index, -1)} className="h-8 w-8 rounded border border-white/10 text-white/80 disabled:opacity-30" disabled={index === 0} aria-label="위로 이동">
                              ↑
                            </button>
                            <button type="button" onClick={() => updateGroup(group, index, 1)} className="h-8 w-8 rounded border border-white/10 text-white/80 disabled:opacity-30" disabled={index === teams.length - 1} aria-label="아래로 이동">
                              ↓
                            </button>
                          </div>
                        </div>
                        {index === 2 ? (
                          <button
                            type="button"
                            onClick={() => toggleThirdPlace(team)}
                            className={`mt-2 w-full rounded border px-3 py-2 text-left text-xs font-black ${
                              isThirdSelected ? "border-trophy/70 bg-trophy/20 text-white" : "border-white/10 bg-white/5 text-white/65"
                            }`}
                          >
                            {isThirdSelected ? "3위 와일드카드 선택됨" : "3위 와일드카드 선택"}
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-black text-white">토너먼트 승자 선택</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {bracket.map((match) => (
              <article key={match.matchId} className="rounded border border-white/10 bg-white/[0.06] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-black text-trophy">{match.matchId}번 · {match.round}</p>
                  {match.winner ? <Badge tone="gold">선택됨</Badge> : null}
                </div>
                <p className="mb-2 text-xs text-white/45">{match.label}</p>
                {[match.teamA, match.teamB].map((team) =>
                  team ? (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => chooseWinner(match.matchId, team)}
                      className={`mb-2 block w-full rounded border px-3 py-2 text-left text-sm font-semibold ${
                        match.winner?.id === team.id
                          ? "border-trophy/70 bg-trophy/20 text-white"
                          : "border-white/10 bg-white/5 text-white/75"
                      }`}
                    >
                      {team.nameKo}
                    </button>
                  ) : null
                )}
                {match.unresolvedReason ? <p className="text-xs text-amber-100/80">{match.unresolvedReason}</p> : null}
              </article>
            ))}
          </div>
        </section>
      </div>

      <Bracket matches={bracket} />
    </section>
  );
}

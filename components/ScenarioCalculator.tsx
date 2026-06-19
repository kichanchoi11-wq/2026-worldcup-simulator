"use client";

import { useMemo, useState } from "react";
import Badge from "@/components/Badge";
import Bracket from "@/components/Bracket";
import {
  buildOfficialBracketWithWinners,
  createSeedMapFromRankings,
  getThirdPlaceNotice
} from "@/lib/bracket";
import { getBaseGroups } from "@/lib/scenario";
import {
  applyStoredActualResultsToInputs,
  calculateScenarioStandings,
  createInitialScenarioMatchInputs,
  selectThirdPlaceQualifiers,
  standingsToGroupRankings
} from "@/lib/scenarioStandings";
import { readArrayStorage, readStorage, storageKeys, writeStorage } from "@/lib/storage";
import type { BracketTeam } from "@/types/bracket";
import type { FootballMatch, TeamGroup } from "@/types/football";
import type { SourcedFootballInfo } from "@/types/freshInfo";
import type { ScenarioCalculatorData, ScenarioMatchInput, ScenarioStandingRow } from "@/types/simulation";

type Mode = "official" | "free";

function scoreToResult(home: number | null, away: number | null): ScenarioMatchInput["selectedResult"] {
  if (home === null || away === null) return null;
  if (home > away) return "home";
  if (home < away) return "away";
  return "draw";
}

function resultScores(result: "home" | "draw" | "away") {
  if (result === "home") return { homeScore: 1, awayScore: 0 };
  if (result === "away") return { homeScore: 0, awayScore: 1 };
  return { homeScore: 1, awayScore: 1 };
}

function scoreInputValue(value: number | null) {
  return value === null ? "" : String(value);
}

function parseScoreInput(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.min(30, Math.trunc(parsed)));
}

function formatGoalDifference(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}

function sourceBadgeTone(input: ScenarioMatchInput): Parameters<typeof Badge>[0]["tone"] {
  if (input.status === "actual") return "success";
  if (input.status === "user") return "사용자 입력";
  return "neutral";
}

export default function ScenarioCalculator() {
  const groups = useMemo(() => getBaseGroups(), []);
  const initialInputs = useMemo(() => createInitialScenarioMatchInputs(groups), [groups]);
  const [mode, setMode] = useState<Mode>("official");
  const [matchInputs, setMatchInputs] = useState<ScenarioMatchInput[]>(initialInputs);
  const [winnerIds, setWinnerIds] = useState<Record<number, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const standingsByGroup = useMemo(() => calculateScenarioStandings(groups, matchInputs, "simulation"), [groups, matchInputs]);
  const groupRankings = useMemo(() => standingsToGroupRankings(groups, standingsByGroup), [groups, standingsByGroup]);
  const thirdPlaceQualifiers = useMemo(() => selectThirdPlaceQualifiers(groups, standingsByGroup), [groups, standingsByGroup]);
  const seedMap = useMemo(() => createSeedMapFromRankings(groupRankings, thirdPlaceQualifiers), [groupRankings, thirdPlaceQualifiers]);
  const bracket = useMemo(() => buildOfficialBracketWithWinners(seedMap, winnerIds), [seedMap, winnerIds]);
  const champion = bracket.find((match) => match.round === "결승")?.winner ?? null;
  const completedInputCount = matchInputs.filter((input) => input.homeScore !== null && input.awayScore !== null).length;
  const lockedInputCount = matchInputs.filter((input) => input.locked).length;

  function updateMatch(matchId: string, updater: (input: ScenarioMatchInput) => ScenarioMatchInput) {
    setMatchInputs((current) => current.map((input) => (input.matchId === matchId ? updater(input) : input)));
    setWinnerIds({});
  }

  function chooseResult(input: ScenarioMatchInput, result: "home" | "draw" | "away") {
    if (input.locked) return;
    const scores = resultScores(result);
    updateMatch(input.matchId, (current) => ({
      ...current,
      ...scores,
      selectedResult: result,
      status: "user",
      source: "user",
      sourceLabel: "사용자 승무패 선택",
      updatedAt: new Date().toISOString()
    }));
  }

  function updateScore(input: ScenarioMatchInput, side: "homeScore" | "awayScore", value: string) {
    if (input.locked) return;
    const parsed = parseScoreInput(value);
    updateMatch(input.matchId, (current) => {
      const next = { ...current, [side]: parsed };
      return {
        ...next,
        selectedResult: scoreToResult(next.homeScore, next.awayScore),
        status: next.homeScore === null || next.awayScore === null ? "pending" : "user",
        source: next.homeScore === null || next.awayScore === null ? "manual" : "user",
        sourceLabel: next.homeScore === null || next.awayScore === null ? "스코어 입력 대기" : "사용자 스코어 입력",
        updatedAt: new Date().toISOString()
      };
    });
  }

  function clearInput(input: ScenarioMatchInput) {
    if (input.locked) return;
    updateMatch(input.matchId, (current) => ({
      ...current,
      homeScore: null,
      awayScore: null,
      selectedResult: null,
      status: "pending",
      source: "manual",
      sourceLabel: "사용자 입력 대기",
      updatedAt: new Date().toISOString()
    }));
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
    setMatchInputs(initialInputs);
    setWinnerIds({});
    setMessage("조별리그 경기 입력과 토너먼트 선택을 처음 상태로 되돌렸습니다.");
  }

  function applyActualData() {
    const apiMatches = readArrayStorage<FootballMatch>(storageKeys.apiMatchesData);
    const sourcedItems = readArrayStorage<SourcedFootballInfo>(storageKeys.sourcedFootballInfoData);
    const result = applyStoredActualResultsToInputs(matchInputs, apiMatches, sourcedItems);
    setMatchInputs(result.inputs);
    setWinnerIds({});
    setMessage(
      result.appliedCount > 0
        ? `실제 데이터 ${result.appliedCount}경기를 입력하고 잠금 처리했습니다. 나머지 경기는 직접 선택할 수 있습니다.`
        : "저장된 실제 경기 결과를 찾지 못했습니다. 관리자 최신 정보 새로고침 또는 API 데이터 반영 후 다시 시도하세요."
    );
  }

  function saveScenario() {
    const data: ScenarioCalculatorData = {
      groupRankings,
      thirdPlaceQualifiers,
      matchInputs,
      scenarioStandings: standingsByGroup,
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
    setMessage("현재 경기별 입력값과 자동 계산 순위표를 저장했습니다.");
  }

  function loadScenario() {
    const data = readStorage<ScenarioCalculatorData | null>(storageKeys.scenarioCalculatorData, null);
    if (!data) {
      setMessage("저장한 시나리오가 없습니다.");
      return;
    }
    setMatchInputs(data.matchInputs ?? initialInputs);
    setWinnerIds({});
    setMessage(data.matchInputs ? "저장한 경기별 시나리오를 불러왔습니다." : "이전 형식의 시나리오입니다. 경기별 입력은 기본값으로 불러왔습니다.");
  }

  return (
    <section className="space-y-5">
      <div className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-white">경우의 수 계산기</h2>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-white/65">
              모든 조별리그 경기의 홈승/무/원정승 또는 스코어를 직접 입력하면 순위가 자동 계산됩니다. 끝난 경기는 실제 데이터 반영 버튼으로 입력하고 잠금 처리할 수 있습니다.
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
          <Badge tone={completedInputCount > 0 ? "success" : "warning"}>입력 경기 {completedInputCount}/{matchInputs.length}</Badge>
          <Badge tone={lockedInputCount > 0 ? "success" : "neutral"}>실제 데이터 잠금 {lockedInputCount}경기</Badge>
          <Badge tone={thirdPlaceQualifiers.length === 8 ? "success" : "warning"}>3위 후보 {thirdPlaceQualifiers.length}/8</Badge>
          {champion ? <Badge tone="gold">우승팀 {champion.nameKo}</Badge> : <Badge tone="neutral">우승팀 선택 전</Badge>}
        </div>

        <p className="mt-4 rounded border border-white/10 bg-white/8 p-3 text-sm text-white/70">
          {mode === "official"
            ? "공식 대진 모드: FIFA 공식 브래킷 구조를 기준으로 대진을 생성합니다."
            : "사용자 자유 대진 모드: 현재는 공식 브래킷을 사용하되, 조별 경기 결과와 토너먼트 승자를 사용자가 직접 조정하는 가상 시나리오입니다."}
        </p>
        <p className="mt-3 rounded border border-amber-300/25 bg-amber-400/10 p-3 text-sm text-amber-50">{getThirdPlaceNotice()}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={applyActualData} className="rounded border border-emerald-300/60 bg-emerald-400/15 px-4 py-2 text-sm font-black text-white hover:bg-emerald-400/25">
            실제 데이터 반영
          </button>
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

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-4">
          <h3 className="font-black text-white">조별리그 경기별 입력</h3>
          <div className="space-y-4">
            {groups.map((group) => (
              <GroupMatchEditor
                key={group.id}
                group={group}
                inputs={matchInputs.filter((input) => input.groupId === group.id)}
                standings={standingsByGroup[group.id] ?? []}
                onChooseResult={chooseResult}
                onScoreChange={updateScore}
                onClear={clearInput}
              />
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

function GroupMatchEditor({
  group,
  inputs,
  standings,
  onChooseResult,
  onScoreChange,
  onClear
}: {
  group: TeamGroup;
  inputs: ScenarioMatchInput[];
  standings: ScenarioStandingRow[];
  onChooseResult: (input: ScenarioMatchInput, result: "home" | "draw" | "away") => void;
  onScoreChange: (input: ScenarioMatchInput, side: "homeScore" | "awayScore", value: string) => void;
  onClear: (input: ScenarioMatchInput) => void;
}) {
  return (
    <article className="rounded border border-white/10 bg-white/[0.06] p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-black text-white">{group.name}</h4>
          <p className="text-sm text-white/50">6경기 결과를 입력하면 아래 순위가 즉시 계산됩니다.</p>
        </div>
        <Badge tone={standings.some((row) => row.played > 0) ? "success" : "warning"}>{standings.filter((row) => row.played > 0).length}팀 경기 반영</Badge>
      </div>

      <div className="grid gap-3">
        {inputs.map((input) => (
          <MatchInputCard
            key={input.matchId}
            input={input}
            onChooseResult={onChooseResult}
            onScoreChange={onScoreChange}
            onClear={onClear}
          />
        ))}
      </div>

      <StandingsMiniTable rows={standings} />
    </article>
  );
}

function MatchInputCard({
  input,
  onChooseResult,
  onScoreChange,
  onClear
}: {
  input: ScenarioMatchInput;
  onChooseResult: (input: ScenarioMatchInput, result: "home" | "draw" | "away") => void;
  onScoreChange: (input: ScenarioMatchInput, side: "homeScore" | "awayScore", value: string) => void;
  onClear: (input: ScenarioMatchInput) => void;
}) {
  return (
    <div className="rounded border border-white/10 bg-pitch-900/75 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-black text-white">
            {input.homeTeamName} vs {input.awayTeamName}
          </p>
          <p className="mt-1 text-xs text-white/45">{input.matchId}</p>
        </div>
        <Badge tone={sourceBadgeTone(input)}>{input.locked ? "실제 데이터 잠금" : input.sourceLabel}</Badge>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_1fr]">
        <ScoreInput
          label={input.homeTeamName}
          value={scoreInputValue(input.homeScore)}
          disabled={input.locked}
          onChange={(value) => onScoreChange(input, "homeScore", value)}
        />
        <div className="grid place-items-center text-sm font-black text-white/60">:</div>
        <ScoreInput
          label={input.awayTeamName}
          value={scoreInputValue(input.awayScore)}
          disabled={input.locked}
          onChange={(value) => onScoreChange(input, "awayScore", value)}
        />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        <ResultButton selected={input.selectedResult === "home"} disabled={input.locked} onClick={() => onChooseResult(input, "home")}>
          홈승
        </ResultButton>
        <ResultButton selected={input.selectedResult === "draw"} disabled={input.locked} onClick={() => onChooseResult(input, "draw")}>
          무
        </ResultButton>
        <ResultButton selected={input.selectedResult === "away"} disabled={input.locked} onClick={() => onChooseResult(input, "away")}>
          원정승
        </ResultButton>
        <button
          type="button"
          onClick={() => onClear(input)}
          disabled={input.locked}
          className="rounded border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white/65 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
        >
          비우기
        </button>
      </div>
      <p className="mt-2 text-xs leading-5 text-white/45">
        출처: {input.sourceLabel} {input.updatedAt ? `· ${new Date(input.updatedAt).toLocaleString("ko-KR")}` : ""}
      </p>
    </div>
  );
}

function ScoreInput({
  label,
  value,
  disabled,
  onChange
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="block truncate text-xs font-semibold text-white/55">{label}</span>
      <input
        type="number"
        min={0}
        max={30}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded border border-white/10 bg-white/[0.06] px-3 py-2 text-center text-sm font-black text-white outline-none transition focus:border-trophy/70 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}

function ResultButton({
  selected,
  disabled,
  onClick,
  children
}: {
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded border px-3 py-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-45 ${
        selected ? "border-trophy/70 bg-trophy/20 text-white" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function StandingsMiniTable({ rows }: { rows: ScenarioStandingRow[] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded border border-white/10">
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead className="bg-white/10 text-xs uppercase text-white/55">
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
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {rows.map((row) => (
            <tr key={`${row.groupId}-${row.teamId}`} className="bg-white/[0.035] text-white/80">
              <td className="px-2 py-2 font-black">{row.rank}</td>
              <td className="px-2 py-2 font-black">{row.teamName}</td>
              <td className="px-2 py-2 text-center">{row.played}</td>
              <td className="px-2 py-2 text-center">{row.won}</td>
              <td className="px-2 py-2 text-center">{row.drawn}</td>
              <td className="px-2 py-2 text-center">{row.lost}</td>
              <td className="px-2 py-2 text-center">{row.goalsFor}</td>
              <td className="px-2 py-2 text-center">{row.goalsAgainst}</td>
              <td className="px-2 py-2 text-center">{formatGoalDifference(row.goalDifference)}</td>
              <td className="px-2 py-2 text-center font-black text-white">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

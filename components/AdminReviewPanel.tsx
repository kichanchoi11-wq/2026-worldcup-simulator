"use client";

import { FormEvent, useEffect, useState } from "react";
import Badge from "@/components/Badge";
import { validateGroupStageForTournament } from "@/lib/bracket";
import { getGroupDataAudit } from "@/lib/scenario";
import { readStorage, removeStorageItem, storageKeys, writeStorage } from "@/lib/storage";
import type { FootballApiEnvelope, FootballMatch, StandingRow, WorldCupGroupSlot } from "@/types/football";
import type { GroupSimulationData, ScenarioCalculatorData } from "@/types/simulation";

type GroupId = WorldCupGroupSlot["groupId"];
type GroupPosition = WorldCupGroupSlot["position"];
type ManualGroupEntry = {
  groupId: GroupId;
  position: GroupPosition;
  teamName: string;
  teamCode: string;
  sourceName: string;
  sourceUrl: string;
  lastUpdated: string;
  verificationStatus: "수동 확인" | "공식 확인";
};

const groupIds: GroupId[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
const positions: GroupPosition[] = [1, 2, 3, 4];

const emptyManualEntry: ManualGroupEntry = {
  groupId: "A",
  position: 1,
  teamName: "",
  teamCode: "",
  sourceName: "",
  sourceUrl: "",
  lastUpdated: "",
  verificationStatus: "수동 확인"
};

type AdminStorageSnapshot = {
  aiGroup: GroupSimulationData | null;
  scenario: ScenarioCalculatorData | null;
  apiMatches: FootballMatch[];
  apiStandings: StandingRow[];
  manualEntries: ManualGroupEntry[];
};

const emptyStorageSnapshot: AdminStorageSnapshot = {
  aiGroup: null,
  scenario: null,
  apiMatches: [],
  apiStandings: [],
  manualEntries: []
};

export default function AdminReviewPanel() {
  const [version, setVersion] = useState(0);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [manualEntry, setManualEntry] = useState<ManualGroupEntry>(emptyManualEntry);
  const [storageSnapshot, setStorageSnapshot] = useState<AdminStorageSnapshot>(emptyStorageSnapshot);

  const audit = getGroupDataAudit();
  const snapshot = {
    aiGroup: storageSnapshot.aiGroup,
    scenario: storageSnapshot.scenario,
    aiValidation: validateGroupStageForTournament(storageSnapshot.aiGroup),
    scenarioValidation: validateGroupStageForTournament(storageSnapshot.scenario)
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setStorageSnapshot({
        aiGroup: readStorage<GroupSimulationData | null>(storageKeys.aiGroupSimulationData, null),
        scenario: readStorage<ScenarioCalculatorData | null>(storageKeys.scenarioCalculatorData, null),
        apiMatches: readStorage<FootballMatch[]>(storageKeys.apiMatchesData, []),
        apiStandings: readStorage<StandingRow[]>(storageKeys.apiStandingsData, []),
        manualEntries: readStorage<ManualGroupEntry[]>(storageKeys.adminManualGroupEntries, [])
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [version]);

  function removeKey(key: keyof typeof storageKeys) {
    removeStorageItem(storageKeys[key]);
    setVersion((current) => current + 1);
  }

  async function refreshApiData() {
    setApiMessage("API 데이터를 확인하는 중입니다.");

    try {
      const [matchesResponse, standingsResponse] = await Promise.all([
        fetch("/api/football/matches"),
        fetch("/api/football/standings")
      ]);

      const matchesPayload = (await matchesResponse.json()) as FootballApiEnvelope<FootballMatch[]>;
      const standingsPayload = (await standingsResponse.json()) as FootballApiEnvelope<StandingRow[]>;

      if (matchesPayload.ok && matchesPayload.data.length > 0) {
        writeStorage(storageKeys.apiMatchesData, matchesPayload.data);
      }

      if (standingsPayload.ok && standingsPayload.data.length > 0) {
        writeStorage(storageKeys.apiStandingsData, standingsPayload.data);
      }

      const messages = [matchesPayload.message, standingsPayload.message].filter(Boolean);
      setApiMessage(
        messages.length > 0
          ? messages.join(" ")
          : `API 새로고침 완료: 경기 ${matchesPayload.data.length}개, 순위 ${standingsPayload.data.length}개를 확인했습니다.`
      );
      setVersion((current) => current + 1);
    } catch {
      setApiMessage("API 새로고침에 실패했습니다. 저장된 API 데이터와 사용자 입력 데이터는 유지합니다.");
    }
  }

  function saveManualEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const requiredFields = [
      manualEntry.teamName.trim(),
      manualEntry.sourceName.trim(),
      manualEntry.sourceUrl.trim(),
      manualEntry.lastUpdated.trim()
    ];

    if (requiredFields.some((field) => field.length === 0)) {
      setSaveMessage("팀명, 출처명, 출처 URL, 확인 날짜가 모두 있어야 저장할 수 있습니다.");
      return;
    }

    if (manualEntry.verificationStatus === "공식 확인" && !manualEntry.sourceUrl.startsWith("http")) {
      setSaveMessage("공식 확인 데이터는 검증 가능한 URL이 필요합니다.");
      return;
    }

    const nextEntries = [
      ...storageSnapshot.manualEntries,
      {
        ...manualEntry,
        teamName: manualEntry.teamName.trim(),
        teamCode: manualEntry.teamCode.trim().toUpperCase(),
        sourceName: manualEntry.sourceName.trim(),
        sourceUrl: manualEntry.sourceUrl.trim(),
        lastUpdated: manualEntry.lastUpdated.trim()
      }
    ];

    writeStorage(storageKeys.adminManualGroupEntries, nextEntries);
    setManualEntry(emptyManualEntry);
    setSaveMessage("출처가 있는 수동 입력 검토 항목을 저장했습니다. 실제 기본 데이터 반영은 코드 리뷰 후 진행하세요.");
    setVersion((current) => current + 1);
  }

  return (
    <section className="space-y-5">
      <div className="rounded border border-red-300/25 bg-red-400/10 p-5">
        <h2 className="text-xl font-black text-white">관리자 검토 모드</h2>
        <p className="mt-2 text-sm leading-relaxed text-red-50/80">
          출처 없는 선수·감독·전술 정보는 확정 데이터로 저장하지 않습니다. 기존 저장소는 전체 삭제하지 않고 목적별 키만 관리합니다.
        </p>
      </div>

      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
        <StatusItem label="조 수" value={`${audit.groupCount}개`} tone="neutral" />
        <StatusItem label="국가명 표시" value={`${audit.teamCount - audit.emptySlots.length}팀`} tone="success" />
        <StatusItem label="공식 확정" value={`${audit.officiallyConfirmed.length}팀`} tone={audit.officiallyConfirmed.length > 0 ? "success" : "warning"} />
        <StatusItem label="공식 재확인" value={`${audit.sourceReviewRequired.length}팀`} tone="warning" />
        <StatusItem label="빈 자리" value={`${audit.emptySlots.length}개`} tone={audit.emptySlots.length > 0 ? "warning" : "success"} />
        <StatusItem label="수동 확인" value={`${audit.manuallyVerified.length}팀`} tone="warning" />
        <StatusItem label="저장 경기" value={`${storageSnapshot.apiMatches.length}개`} tone="API 실제 데이터" />
      </section>

      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-white">API 실제 데이터 새로고침</h3>
            <p className="mt-1 text-sm text-white/60">경기·순위 API 응답은 사용자 입력, AI 예측, 경우의 수 데이터와 분리해 저장합니다.</p>
          </div>
          <button
            type="button"
            onClick={refreshApiData}
            className="rounded border border-sky-300/60 bg-sky-400/15 px-4 py-2 text-sm font-black text-white transition hover:bg-sky-400/25"
          >
            API 데이터 확인
          </button>
        </div>
        {apiMessage ? <p className="mt-4 rounded border border-white/10 bg-white/8 p-3 text-sm text-white/75">{apiMessage}</p> : null}
      </section>

      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <h3 className="font-black text-white">조 편성 데이터 감사</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {audit.slotLabels.map(({ team, label }) => (
            <article key={team.id} className="rounded border border-white/10 bg-pitch-900/80 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-trophy">{label}</p>
                  <p className="mt-1 font-semibold text-white">{team.nameKo}</p>
                  <p className="mt-1 text-xs text-white/50">{team.teamCode ?? "팀 코드 확인 필요"}</p>
                </div>
                <Badge tone={team.verificationStatus}>{team.verificationStatus}</Badge>
              </div>
              <p className="mt-3 line-clamp-2 text-xs leading-5 text-white/55">
                {team.sourceName ?? "공식 출처 확인 필요"}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <h3 className="font-black text-white">수동 조 편성 입력 검토</h3>
        <form onSubmit={saveManualEntry} className="mt-4 grid gap-3 lg:grid-cols-6">
          <label className="space-y-1">
            <span className="text-xs font-semibold text-white/60">조</span>
            <select
              value={manualEntry.groupId}
              onChange={(event) => setManualEntry((current) => ({ ...current, groupId: event.target.value as GroupId }))}
              className="w-full rounded border border-white/15 bg-pitch-900 px-3 py-2 text-sm text-white"
            >
              {groupIds.map((groupId) => (
                <option key={groupId} value={groupId}>{groupId}조</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-white/60">자리</span>
            <select
              value={manualEntry.position}
              onChange={(event) => setManualEntry((current) => ({ ...current, position: Number(event.target.value) as GroupPosition }))}
              className="w-full rounded border border-white/15 bg-pitch-900 px-3 py-2 text-sm text-white"
            >
              {positions.map((position) => (
                <option key={position} value={position}>{position}번</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 lg:col-span-2">
            <span className="text-xs font-semibold text-white/60">팀명</span>
            <input
              value={manualEntry.teamName}
              onChange={(event) => setManualEntry((current) => ({ ...current, teamName: event.target.value }))}
              className="w-full rounded border border-white/15 bg-pitch-900 px-3 py-2 text-sm text-white"
              placeholder="예: 대한민국"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-white/60">팀 코드</span>
            <input
              value={manualEntry.teamCode}
              onChange={(event) => setManualEntry((current) => ({ ...current, teamCode: event.target.value }))}
              className="w-full rounded border border-white/15 bg-pitch-900 px-3 py-2 text-sm text-white"
              placeholder="KOR"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-white/60">상태</span>
            <select
              value={manualEntry.verificationStatus}
              onChange={(event) =>
                setManualEntry((current) => ({ ...current, verificationStatus: event.target.value as ManualGroupEntry["verificationStatus"] }))
              }
              className="w-full rounded border border-white/15 bg-pitch-900 px-3 py-2 text-sm text-white"
            >
              <option value="수동 확인">수동 확인</option>
              <option value="공식 확인">공식 확인</option>
            </select>
          </label>
          <label className="space-y-1 lg:col-span-2">
            <span className="text-xs font-semibold text-white/60">출처명</span>
            <input
              value={manualEntry.sourceName}
              onChange={(event) => setManualEntry((current) => ({ ...current, sourceName: event.target.value }))}
              className="w-full rounded border border-white/15 bg-pitch-900 px-3 py-2 text-sm text-white"
              placeholder="예: FIFA match centre"
            />
          </label>
          <label className="space-y-1 lg:col-span-3">
            <span className="text-xs font-semibold text-white/60">출처 URL</span>
            <input
              value={manualEntry.sourceUrl}
              onChange={(event) => setManualEntry((current) => ({ ...current, sourceUrl: event.target.value }))}
              className="w-full rounded border border-white/15 bg-pitch-900 px-3 py-2 text-sm text-white"
              placeholder="https://..."
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-white/60">확인 날짜</span>
            <input
              type="date"
              value={manualEntry.lastUpdated}
              onChange={(event) => setManualEntry((current) => ({ ...current, lastUpdated: event.target.value }))}
              className="w-full rounded border border-white/15 bg-pitch-900 px-3 py-2 text-sm text-white"
            />
          </label>
          <button
            type="submit"
            className="rounded border border-trophy/60 bg-trophy/20 px-4 py-2 text-sm font-black text-white transition hover:bg-trophy/30 lg:col-span-6"
          >
            출처 포함 검토 항목 저장
          </button>
        </form>
        {saveMessage ? <p className="mt-4 rounded border border-white/10 bg-white/8 p-3 text-sm text-white/75">{saveMessage}</p> : null}
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <button type="button" onClick={() => removeKey("aiGroupSimulationData")} className="rounded border border-white/10 bg-white/[0.06] p-4 text-left font-black text-white hover:bg-white/10">
          AI 조별리그 결과 삭제
        </button>
        <button type="button" onClick={() => removeKey("aiTournamentSimulationData")} className="rounded border border-white/10 bg-white/[0.06] p-4 text-left font-black text-white hover:bg-white/10">
          AI 토너먼트 결과 삭제
        </button>
        <button type="button" onClick={() => removeKey("scenarioCalculatorData")} className="rounded border border-white/10 bg-white/[0.06] p-4 text-left font-black text-white hover:bg-white/10">
          경우의 수 데이터 삭제
        </button>
        <button type="button" onClick={() => removeKey("apiMatchesData")} className="rounded border border-sky-300/30 bg-sky-400/10 p-4 text-left font-black text-white hover:bg-sky-400/20">
          저장 API 경기 삭제
        </button>
      </div>

      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <h3 className="font-black text-white">디버그 정보</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DebugItem label="관리자 새로고침 횟수" value={`${version}회`} />
          <DebugItem label="AI 조별리그 완료 여부" value={snapshot.aiGroup ? "있음" : "없음"} />
          <DebugItem label="AI 32강 진출팀 수" value={`${snapshot.aiValidation.count}팀`} />
          <DebugItem label="경우의 수 계산기 32강 진출팀 수" value={`${snapshot.scenarioValidation.count}팀`} />
          <DebugItem label="API 실제 경기 수" value={`${storageSnapshot.apiMatches.length}개`} />
          <DebugItem label="API 실제 순위 수" value={`${storageSnapshot.apiStandings.length}개`} />
          <DebugItem label="중복 팀 여부" value={snapshot.aiValidation.duplicateTeams.length > 0 ? "있음" : "없음"} />
          <DebugItem label="토너먼트 대진 생성 가능 여부" value={snapshot.aiValidation.canStart || snapshot.scenarioValidation.canStart ? "가능" : "확인 필요"} />
          <DebugItem label="현재 선택된 데이터 출처" value="관리자 검토" />
        </div>
      </section>
    </section>
  );
}

function StatusItem({ label, value, tone }: { label: string; value: string; tone: Parameters<typeof Badge>[0]["tone"] }) {
  return (
    <div className="rounded border border-white/10 bg-white/[0.06] p-4">
      <Badge tone={tone}>{label}</Badge>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function DebugItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/10 bg-pitch-900/80 p-3">
      <p className="text-xs text-white/50">{label}</p>
      <p className="mt-1 font-black text-white">{value}</p>
    </div>
  );
}

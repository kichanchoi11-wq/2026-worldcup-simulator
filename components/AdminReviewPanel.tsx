"use client";

import { useState } from "react";
import Badge from "@/components/Badge";
import { validateGroupStageForTournament } from "@/lib/bracket";
import { readStorage, removeStorageItem, storageKeys } from "@/lib/storage";
import type { GroupSimulationData, ScenarioCalculatorData } from "@/types/simulation";

export default function AdminReviewPanel() {
  const [version, setVersion] = useState(0);
  const aiGroup = readStorage<GroupSimulationData | null>(storageKeys.aiGroupSimulationData, null);
  const scenario = readStorage<ScenarioCalculatorData | null>(storageKeys.scenarioCalculatorData, null);
  const snapshot = {
    aiGroup,
    scenario,
    aiValidation: validateGroupStageForTournament(aiGroup),
    scenarioValidation: validateGroupStageForTournament(scenario)
  };

  void version;

  function removeKey(key: keyof typeof storageKeys) {
    removeStorageItem(storageKeys[key]);
    setVersion((current) => current + 1);
  }

  return (
    <section className="space-y-5">
      <div className="rounded border border-red-300/25 bg-red-400/10 p-5">
        <h2 className="text-xl font-black text-white">관리자 검토 모드</h2>
        <p className="mt-2 text-sm leading-relaxed text-red-50/80">
          기존 팀 정보는 신뢰할 수 없어 삭제됩니다. 공식 출처 또는 신뢰 가능한 출처를 기준으로 다시 수집합니다.
        </p>
      </div>

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
        <button type="button" onClick={() => setVersion((current) => current + 1)} className="rounded border border-trophy/60 bg-trophy/20 p-4 text-left font-black text-white hover:bg-trophy/30">
          디버그 정보 새로고침
        </button>
      </div>

      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <h3 className="font-black text-white">데이터 삭제·재검증 작업</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            "모든 팀 선수 명단 삭제",
            "모든 팀 감독 정보 삭제",
            "모든 팀 포메이션 삭제",
            "모든 팀 전술 정보 삭제",
            "모든 팀 예상 라인업 삭제",
            "출처 없는 데이터 전체 숨기기",
            "대한민국 데이터 전체 삭제",
            "대한민국 공식 소집 명단 다시 불러오기",
            "대한민국 최근 경기 라인업 다시 확인",
            "대한민국 포메이션 재검증",
            "대한민국 전술 설명 재검증",
            "대한민국 감독 정보 재검증"
          ].map((item) => (
            <div key={item} className="flex items-center justify-between gap-3 rounded border border-white/10 bg-pitch-900/80 p-3">
              <span className="text-sm font-semibold text-white">{item}</span>
              <Badge tone="확인 필요">대기</Badge>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <h3 className="font-black text-white">디버그 정보</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DebugItem label="AI 조별리그 완료 여부" value={snapshot.aiGroup ? "있음" : "없음"} />
          <DebugItem label="AI 32강 진출팀 수" value={`${snapshot.aiValidation.count}팀`} />
          <DebugItem label="사용자 32강 진출팀 수" value="0팀" />
          <DebugItem label="경우의 수 계산기 32강 진출팀 수" value={`${snapshot.scenarioValidation.count}팀`} />
          <DebugItem label="API 실제 32강 진출팀 수" value="0팀" />
          <DebugItem label="중복 팀 여부" value={snapshot.aiValidation.duplicateTeams.length > 0 ? "있음" : "없음"} />
          <DebugItem label="토너먼트 대진 생성 가능 여부" value={snapshot.aiValidation.canStart || snapshot.scenarioValidation.canStart ? "가능" : "확인 필요"} />
          <DebugItem label="현재 선택된 데이터 출처" value="관리자 검토" />
          <DebugItem label="마지막 시뮬레이션 시간" value={snapshot.aiGroup?.lastSimulatedAt ?? "없음"} />
        </div>
      </section>
    </section>
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

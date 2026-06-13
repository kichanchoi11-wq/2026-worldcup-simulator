"use client";

import { useMemo, useState } from "react";
import Badge from "@/components/Badge";
import { teamVerificationData } from "@/data/teamVerificationData";
import type { TeamRef } from "@/types/football";

export default function PlayerRosterVerificationPanel({ teams }: { teams: TeamRef[] }) {
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id ?? "");
  const selectedTeam = teams.find((team) => team.id === selectedTeamId) ?? teams[0];
  const verification = useMemo(
    () => teamVerificationData.find((item) => item.teamName === selectedTeam?.nameKo),
    [selectedTeam]
  );

  return (
    <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">선수 명단 검증 상태</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/65">
            공식 소집 명단 확인 전입니다. 선수 명단은 FIFA, 각국 축구협회, 공식 경기 리포트 등 신뢰 가능한 출처가 확인된 경우에만 표시됩니다.
          </p>
        </div>
        <select
          value={selectedTeamId}
          onChange={(event) => setSelectedTeamId(event.target.value)}
          className="rounded border border-white/15 bg-pitch-900 px-3 py-2 text-sm font-semibold text-white"
          aria-label="국가 선택"
        >
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.nameKo}
            </option>
          ))}
        </select>
      </div>

      {selectedTeam ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <article className="rounded border border-white/10 bg-pitch-900/80 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-2xl">{selectedTeam.flag}</p>
                <h3 className="mt-2 text-lg font-black text-white">{selectedTeam.nameKo}</h3>
                <p className="text-sm text-white/55">{selectedTeam.group}조 · {selectedTeam.position}번 자리</p>
              </div>
              <Badge tone="재검증 필요">재검증 필요</Badge>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <Info label="공식 소집 명단" value="확인 전" />
              <Info label="최근 경기 엔트리" value="확인 전" />
              <Info label="표시 가능한 선수 수" value="0명" />
              <Info label="표시 제외된 선수 수" value="출처 없는 선수 전체" />
            </dl>
          </article>
          <article className="rounded border border-amber-300/25 bg-amber-400/10 p-4">
            <h3 className="font-black text-amber-50">출처 없는 선수는 표시하지 않습니다</h3>
            <p className="mt-3 text-sm leading-6 text-amber-50/78">
              {verification?.notes.join(" ") ??
                "출처 없는 선수명은 오류 방지를 위해 표시하지 않습니다. 공식 출처가 확인되면 선수 명단 테이블에 표시됩니다."}
            </p>
          </article>
        </div>
      ) : null}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-white/55">{label}</dt>
      <dd className="text-right font-semibold text-white">{value}</dd>
    </div>
  );
}

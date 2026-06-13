"use client";

import { useMemo, useState } from "react";
import Badge from "@/components/Badge";
import FlagIcon from "@/components/FlagIcon";
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
            FIFA 최종 명단 공개 기준으로 참가국 스쿼드 등록 상태를 표시합니다. 경기별 선발 11명과 부상·징계는 공식 매치 리포트가 나와야 확정합니다.
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
                <FlagIcon src={selectedTeam.flagImageUrl} alt={selectedTeam.flagAlt} fallback={selectedTeam.flag} size="lg" />
                <h3 className="mt-2 text-lg font-black text-white">{selectedTeam.nameKo}</h3>
                <p className="text-sm text-white/55">{selectedTeam.group}조 · {selectedTeam.position}번 자리</p>
              </div>
              <Badge tone="공식 확인">공식 확인</Badge>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <Info label="감독" value={verification?.coachName ?? "확인 필요"} />
              <Info label="공식 소집 명단" value={verification?.squadSummary ?? "확인 필요"} />
              <Info label="표시 가능한 선수 수" value={`${verification?.squadPlayerCount ?? 0}명`} />
              <Info label="경기 선발 명단" value={verification?.lineupSummary ?? "공식 발표 확인 필요"} />
            </dl>
          </article>
          <article className="rounded border border-sky-300/25 bg-sky-400/10 p-4">
            <h3 className="font-black text-sky-50">출처와 갱신 기준</h3>
            <p className="mt-3 text-sm leading-6 text-sky-50/78">
              {verification?.notes.join(" ") ??
                "출처 없는 선수명은 오류 방지를 위해 표시하지 않습니다. 공식 출처가 확인되면 선수 명단 테이블에 표시됩니다."}
            </p>
            {verification?.squadSourceUrl ? (
              <a
                href={verification.squadSourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex rounded border border-sky-200/30 bg-sky-300/10 px-3 py-2 text-sm font-black text-sky-50"
              >
                최종 명단 출처 열기
              </a>
            ) : null}
          </article>
        </div>
      ) : null}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3">
      <dt className="text-white/55">{label}</dt>
      <dd className="min-w-0 break-words text-right font-semibold text-white">{value}</dd>
    </div>
  );
}

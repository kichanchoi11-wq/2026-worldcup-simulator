"use client";

import { useMemo, useState } from "react";
import Badge from "@/components/Badge";
import PlayerCard from "@/components/PlayerCard";
import type { Availability, PlayerData, PlayerPosition } from "@/types/team";

const positionFilters: Array<PlayerPosition | "전체"> = ["전체", "GK", "DF", "MF", "FW"];
const availabilityFilters: Array<Availability | "전체"> = ["전체", "출전 가능", "출전 불투명", "결장", "징계 결장", "출전 금지", "확인 필요"];

export default function TeamPlayerRoster({ players }: { players: PlayerData[] }) {
  const [positionFilter, setPositionFilter] = useState<PlayerPosition | "전체">("전체");
  const [availabilityFilter, setAvailabilityFilter] = useState<Availability | "전체">("전체");
  const [riskOnly, setRiskOnly] = useState(false);

  const filteredPlayers = useMemo(
    () =>
      players.filter((player) => {
        const matchesPosition = positionFilter === "전체" || player.position === positionFilter;
        const matchesAvailability = availabilityFilter === "전체" || player.availability === availabilityFilter;
        const matchesRisk = !riskOnly || player.injuryStatus !== "정상" || player.suspensionStatus !== "없음";
        return matchesPosition && matchesAvailability && matchesRisk;
      }),
    [availabilityFilter, players, positionFilter, riskOnly]
  );

  return (
    <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">선수 명단</h2>
          <p className="mt-2 text-sm leading-6 text-white/62">
            공식 소집 명단, 각국 축구협회, 공식 경기 리포트 등 신뢰 가능한 출처가 확인된 선수만 표시합니다.
          </p>
        </div>
        <Badge tone={players.length > 0 ? "공식 확인" : "확인 필요"}>{players.length}명 표시</Badge>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="space-y-1">
          <span className="text-xs font-semibold text-white/55">포지션</span>
          <select
            value={positionFilter}
            onChange={(event) => setPositionFilter(event.target.value as PlayerPosition | "전체")}
            className="w-full rounded border border-white/15 bg-pitch-900 px-3 py-2 text-sm font-semibold text-white"
          >
            {positionFilters.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-white/55">출전 가능 여부</span>
          <select
            value={availabilityFilter}
            onChange={(event) => setAvailabilityFilter(event.target.value as Availability | "전체")}
            className="w-full rounded border border-white/15 bg-pitch-900 px-3 py-2 text-sm font-semibold text-white"
          >
            {availabilityFilters.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 rounded border border-white/10 bg-pitch-900/70 px-3 py-2 text-sm font-semibold text-white">
          <input type="checkbox" checked={riskOnly} onChange={(event) => setRiskOnly(event.target.checked)} />
          부상/징계/카드 위험만 보기
        </label>
      </div>

      {players.length === 0 ? (
        <div className="mt-4 rounded border border-amber-300/25 bg-amber-400/10 p-4">
          <h3 className="font-black text-amber-50">공식 소집 명단 확인 전입니다.</h3>
          <p className="mt-2 text-sm leading-6 text-amber-50/78">
            선수 명단은 FIFA, 각국 축구협회, 공식 경기 리포트 등 신뢰 가능한 출처가 확인된 경우에만 표시됩니다.
            출처 없는 선수명은 오류 방지를 위해 표시하지 않습니다.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredPlayers.map((player) => (
            <PlayerCard key={player.playerId} player={player} />
          ))}
        </div>
      )}
    </section>
  );
}

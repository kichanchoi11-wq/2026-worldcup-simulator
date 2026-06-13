import Badge from "@/components/Badge";
import { hasCompleteSource } from "@/lib/teamDetails";
import type { FormationData, FormationPlayer } from "@/types/team";

function validateFormation(data: FormationData) {
  const duplicateNames = data.players
    .map((player) => player.playerName)
    .filter((name, index, names) => names.indexOf(name) !== index);
  const goalkeeperCount = data.players.filter((player) => player.position === "GK").length;
  const unavailablePlayers = data.players.filter((player) => ["결장", "징계 결장", "출전 금지"].includes(player.status));

  return {
    canRender:
      Boolean(data.formation) &&
      hasCompleteSource(data) &&
      data.players.length === 11 &&
      goalkeeperCount === 1 &&
      duplicateNames.length === 0 &&
      unavailablePlayers.length === 0,
    duplicateNames,
    goalkeeperCount,
    unavailablePlayers
  };
}

export default function FormationBoard({ data, title = "포메이션 그림" }: { data: FormationData; title?: string }) {
  const validation = validateFormation(data);

  if (!validation.canRender) {
    return (
      <section className="rounded border border-amber-300/25 bg-amber-400/10 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="확인 필요">포메이션 확인 필요</Badge>
          <Badge tone="표시 불가">그림 표시 보류</Badge>
        </div>
        <h2 className="mt-3 text-xl font-black text-white">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-amber-50/80">
          최근 실제 경기 선발 라인업 또는 공식 경기 리포트가 확인되지 않아 포메이션을 확정 표시하지 않습니다.
          출처 없는 4-2-3-1, 4-3-3 같은 추정 포메이션은 표시하지 않습니다.
        </p>
        <div className="mt-4 grid gap-2 text-sm text-amber-50/75 md:grid-cols-2">
          <CheckItem label="선발 11명" value={`${data.players.length}/11`} />
          <CheckItem label="골키퍼 1명" value={`${validation.goalkeeperCount}/1`} />
          <CheckItem label="중복 선수" value={validation.duplicateNames.length > 0 ? validation.duplicateNames.join(", ") : "없음"} />
          <CheckItem label="출처" value={hasCompleteSource(data) ? data.sourceName ?? "확인됨" : "출처 확인 필요"} />
        </div>
      </section>
    );
  }

  return (
    <section className="rounded border border-emerald-300/25 bg-emerald-400/10 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="공식 확인">{data.formation}</Badge>
        <Badge tone="공식 확인">{data.type}</Badge>
      </div>
      <h2 className="mt-3 text-xl font-black text-white">{title}</h2>
      <div className="relative mt-5 aspect-[7/10] overflow-hidden rounded border border-emerald-200/25 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0_8%,transparent_9%),linear-gradient(180deg,rgba(5,80,45,0.95),rgba(4,45,29,0.95))] sm:aspect-[16/9]">
        <div className="absolute inset-x-6 top-1/2 h-px bg-white/25" />
        <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25" />
        <div className="absolute inset-x-10 top-4 h-20 rounded-b border-x border-b border-white/25" />
        <div className="absolute inset-x-10 bottom-4 h-20 rounded-t border-x border-t border-white/25" />
        {data.players.map((player) => (
          <PlayerMarker key={player.playerId} player={player} />
        ))}
      </div>
      <p className="mt-3 text-xs font-semibold text-emerald-50/75">
        출처: {data.sourceName} · {data.lastUpdated}
      </p>
    </section>
  );
}

function PlayerMarker({ player }: { player: FormationPlayer }) {
  return (
    <div
      className="absolute min-w-20 -translate-x-1/2 -translate-y-1/2 rounded border border-white/30 bg-pitch-950/90 px-2 py-1 text-center shadow-panel"
      style={{ left: `${player.x}%`, top: `${player.y}%` }}
    >
      <p className="text-[11px] font-black text-trophy">{player.position}</p>
      <p className="truncate text-xs font-semibold text-white">{player.playerName}</p>
    </div>
  );
}

function CheckItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/10 bg-pitch-900/70 p-3">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}

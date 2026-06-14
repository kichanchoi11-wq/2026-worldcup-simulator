import Badge from "@/components/Badge";
import { hasCompleteSource } from "@/lib/teamDetails";
import { sanitizeDisplayText } from "@/lib/textSanitizer";
import type { FormationData, FormationPlayer, PlayerPosition } from "@/types/team";

type FormationMarker = {
  id: string;
  label: string;
  position: PlayerPosition;
  x: number;
  y: number;
  role?: string | null;
  status?: string | null;
  isPlaceholder: boolean;
};

function buildLines(formation: string) {
  const counts = formation
    .split("-")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
  const ySets: Record<number, number[]> = {
    2: [66, 34],
    3: [70, 50, 29],
    4: [72, 58, 43, 27],
    5: [74, 62, 50, 38, 24]
  };
  const ys = ySets[counts.length] ?? ySets[3];

  return [
    { position: "GK" as const, count: 1, y: 88 },
    ...counts.map((count, index) => ({
      count,
      y: ys[index] ?? 50,
      position: index === 0 ? ("DF" as const) : index === counts.length - 1 ? ("FW" as const) : ("MF" as const)
    }))
  ];
}

function buildMarkers(data: FormationData): FormationMarker[] {
  if (!data.formation) {
    return [];
  }

  const playersByPosition: Record<PlayerPosition, FormationPlayer[]> = {
    GK: data.players.filter((player) => player.position === "GK"),
    DF: data.players.filter((player) => player.position === "DF"),
    MF: data.players.filter((player) => player.position === "MF"),
    FW: data.players.filter((player) => player.position === "FW"),
    "확인 필요": []
  };
  const cursors: Record<PlayerPosition, number> = { GK: 0, DF: 0, MF: 0, FW: 0, "확인 필요": 0 };

  return buildLines(data.formation).flatMap((line, lineIndex) =>
    Array.from({ length: line.count }, (_, index) => {
      const x = ((index + 1) * 100) / (line.count + 1);
      const player = playersByPosition[line.position][cursors[line.position]++];

      return {
        id: player?.playerId ?? `${data.teamId}-${line.position}-${lineIndex}-${index}`,
        label: sanitizeDisplayText(player?.playerName, line.position),
        position: line.position,
        x,
        y: line.y,
        role: player?.role,
        status: player?.status,
        isPlaceholder: !player
      };
    })
  );
}

export default function FormationBoard({ data, title = "포메이션 그림" }: { data: FormationData; title?: string }) {
  const canRender = Boolean(data.formation) && hasCompleteSource(data);
  const markers = buildMarkers(data);

  if (!canRender) {
    return (
      <section className="rounded border border-amber-300/25 bg-amber-400/10 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="확인 필요">포메이션 확인 필요</Badge>
          <Badge tone="추가 수집 필요">추가 자료 필요</Badge>
        </div>
        <h2 className="mt-3 text-xl font-black text-white">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-amber-50/80">
          신뢰 가능한 포메이션 출처가 아직 부족합니다. 최근 경기 라인업, 스쿼드 가이드, 공식 경기 리포트가 확인되면 축구장 그림을 갱신합니다.
        </p>
        <div className="mt-4 grid gap-2 text-sm text-amber-50/75 md:grid-cols-2">
          <CheckItem label="포메이션" value={data.formation ?? "확인 필요"} />
          <CheckItem label="표시 선수" value={`${data.players.length}명`} />
          <CheckItem label="출처" value={hasCompleteSource(data) ? data.sourceName ?? "확인됨" : "출처 확인 필요"} />
          <CheckItem label="업데이트" value={data.lastUpdated ?? "확인 필요"} />
        </div>
      </section>
    );
  }

  return (
    <section className="rounded border border-emerald-300/25 bg-emerald-400/10 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="분석 참고">{data.formation}</Badge>
        <Badge tone={data.players.length >= 11 ? "신뢰도 높음" : "분석 참고"}>
          {data.players.length >= 11 ? "선수 배치 확인" : "포지션 보드"}
        </Badge>
      </div>
      <h2 className="mt-3 text-xl font-black text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-emerald-50/75">
        {data.matchBasis ?? "신뢰 가능한 스카우팅 자료 기반 포메이션입니다."} 실제 선발은 경기 전 공식 라인업으로 재확인해야 합니다.
      </p>
      <div className="relative mt-5 aspect-[7/10] overflow-hidden rounded border border-emerald-200/25 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0_8%,transparent_9%),linear-gradient(180deg,rgba(5,80,45,0.95),rgba(4,45,29,0.95))] sm:aspect-[16/9]">
        <div className="absolute inset-x-6 top-1/2 h-px bg-white/25" />
        <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25" />
        <div className="absolute inset-x-10 top-4 h-20 rounded-b border-x border-b border-white/25" />
        <div className="absolute inset-x-10 bottom-4 h-20 rounded-t border-x border-t border-white/25" />
        {markers.map((marker) => (
          <PlayerMarker key={marker.id} marker={marker} />
        ))}
      </div>
      <p className="mt-3 text-xs font-semibold text-emerald-50/75">
        출처: {data.sourceName} · 업데이트: {data.lastUpdated}
      </p>
    </section>
  );
}

function PlayerMarker({ marker }: { marker: FormationMarker }) {
  const isKey = marker.role === "핵심 선수";
  const hasRisk = marker.status && marker.status !== "출전 가능";

  return (
    <div
      className={`absolute min-w-16 -translate-x-1/2 -translate-y-1/2 rounded border px-2 py-1 text-center shadow-panel ${
        marker.isPlaceholder
          ? "border-white/15 bg-pitch-950/55 text-white/55"
          : isKey
            ? "border-trophy/70 bg-trophy/20 text-white"
            : hasRisk
              ? "border-amber-300/60 bg-amber-400/20 text-white"
              : "border-white/30 bg-pitch-950/90 text-white"
      }`}
      style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
    >
      <p className="text-[11px] font-black text-trophy">{marker.position}</p>
      <p className="max-w-24 break-words text-xs font-semibold leading-4">{marker.label}</p>
      {marker.role && !marker.isPlaceholder ? <p className="truncate text-[10px] text-white/65">{marker.role}</p> : null}
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

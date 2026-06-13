import Badge from "@/components/Badge";
import type { PlayerData } from "@/types/team";

export default function PlayerCard({ player }: { player: PlayerData }) {
  return (
    <article className="rounded border border-white/10 bg-white/[0.06] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-black text-white">{player.playerName}</h3>
          <p className="text-sm text-white/55">{player.position} · {player.club ?? "소속팀 확인 필요"}</p>
        </div>
        <Badge tone={player.confidence === "공식" ? "공식" : "확인 필요"}>{player.confidence}</Badge>
      </div>
      <p className="mt-3 text-sm text-white/70">{player.sourceName ?? "출처 확인 필요"}</p>
    </article>
  );
}

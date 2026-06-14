import Badge from "@/components/Badge";
import { sanitizeDisplayText } from "@/lib/textSanitizer";
import type { PlayerData } from "@/types/team";

export default function PlayerCard({ player }: { player: PlayerData }) {
  const safePlayerName = sanitizeDisplayText(player.playerName, "선수명 확인 필요");
  const safeClub = player.club ? sanitizeDisplayText(player.club, "소속팀 확인 필요") : "소속팀 확인 필요";

  return (
    <article className="rounded border border-white/10 bg-white/[0.06] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words font-black text-white">{safePlayerName}</h3>
          <p className="break-words text-sm text-white/55">{player.position} · {safeClub}</p>
          <p className="mt-1 text-xs font-semibold text-trophy">{player.squadStatus}</p>
        </div>
        <Badge tone={player.availability}>{player.availability}</Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone={player.isKeyPlayer ? "신뢰도 높음" : player.isNotablePlayer ? "분석 참고" : "neutral"}>{player.role}</Badge>
        <Badge tone={player.suspensionStatus === "없음" ? "neutral" : player.suspensionStatus}>{player.suspensionStatus}</Badge>
        <Badge tone={player.injuryStatus === "정상" ? "neutral" : player.injuryStatus === "확인 필요" ? "확인 필요" : "부상"}>
          {player.injuryStatus}
        </Badge>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/68">{player.notes}</p>
      <p className="mt-3 text-sm text-white/70">{player.sourceName ?? "출처 확인 필요"}</p>
      <p className="mt-1 text-xs text-white/45">
        {player.lastUpdated ?? "업데이트 날짜 확인 필요"} · {player.sourceLevel ?? player.confidence}
      </p>
      {player.sourceNotes ? <p className="mt-2 text-xs leading-5 text-white/45">{player.sourceNotes}</p> : null}
    </article>
  );
}

import Link from "next/link";
import Badge from "@/components/Badge";
import type { FootballMatch } from "@/types/football";

export default function MatchCard({ match }: { match: FootballMatch }) {
  const score =
    match.score.home === null || match.score.away === null
      ? "경기 전"
      : `${match.score.home} : ${match.score.away}`;

  return (
    <Link href={`/matches/${match.id}`} className="block rounded border border-white/10 bg-white/[0.06] p-4 transition hover:border-trophy/50 hover:bg-white/[0.09]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Badge tone="API 실제 데이터">API 실제 데이터</Badge>
        <span className="text-xs font-semibold text-white/55">{match.status}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <p className="text-right font-bold text-white">{match.homeTeam}</p>
        <p className="rounded bg-white/10 px-3 py-2 text-sm font-black text-white">{score}</p>
        <p className="font-bold text-white">{match.awayTeam}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/55">
        <span>{match.group ?? "조 확인 필요"}</span>
        <span>{match.utcDate ? new Date(match.utcDate).toLocaleString("ko-KR") : "일정 확인 필요"}</span>
        <span>{match.venue ?? "경기장 확인 필요"}</span>
      </div>
    </Link>
  );
}

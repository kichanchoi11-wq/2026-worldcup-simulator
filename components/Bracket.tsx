import Link from "next/link";
import Badge from "@/components/Badge";
import type { BracketMatch } from "@/types/bracket";

const roundOrder = ["32강", "16강", "8강", "4강", "3·4위전", "결승"] as const;

export default function Bracket({ matches }: { matches: BracketMatch[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-6">
      {roundOrder.map((round) => {
        const roundMatches = matches.filter((match) => match.round === round);

        return (
          <section key={round} className="rounded border border-white/10 bg-white/[0.05] p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-black text-white">{round}</h3>
              <Badge tone={round === "결승" ? "gold" : "공식"}>{roundMatches.length}경기</Badge>
            </div>
            <div className="space-y-3">
              {roundMatches.map((match) => (
                <Link key={match.matchId} href={`/matches/${match.matchId}`} className="block rounded border border-white/10 bg-pitch-900/80 p-3 transition hover:border-trophy/50 hover:bg-white/[0.08]">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-trophy">{match.matchId}번</span>
                    <span className="text-[11px] text-white/45">{match.teamASeed} / {match.teamBSeed}</span>
                  </div>
                  <div className="space-y-2">
                    <p className={`rounded px-2 py-2 text-sm font-semibold ${match.winner?.id === match.teamA?.id ? "bg-trophy/25 text-white" : "bg-white/8 text-white/82"}`}>
                      {match.teamA?.nameKo ?? match.teamASeed}
                    </p>
                    <p className={`rounded px-2 py-2 text-sm font-semibold ${match.winner?.id === match.teamB?.id ? "bg-trophy/25 text-white" : "bg-white/8 text-white/82"}`}>
                      {match.teamB?.nameKo ?? match.teamBSeed}
                    </p>
                  </div>
                  {match.unresolvedReason ? (
                    <p className="mt-2 text-xs leading-relaxed text-amber-100/80">{match.unresolvedReason}</p>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

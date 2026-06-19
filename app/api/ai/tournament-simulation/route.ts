import { NextResponse } from "next/server";
import { buildOfficialBracketWithWinners } from "@/lib/bracket";
import { validateQualifiedTeams } from "@/lib/validation";
import type { BracketTeam } from "@/types/bracket";

function stablePick(teamA: BracketTeam, teamB: BracketTeam) {
  const scoreA = Array.from(teamA.id).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const scoreB = Array.from(teamB.id).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return scoreA <= scoreB ? teamA : teamB;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { qualifiedTeams?: BracketTeam[] };
  const validation = validateQualifiedTeams(body.qualifiedTeams);

  if (!validation.canStart) {
    return NextResponse.json(
      {
        ok: false,
        message: validation.reason,
        validation
      },
      { status: 400 }
    );
  }

  const seedMap = Object.fromEntries(validation.qualifiedTeams.map((team) => [team.seed, team]));
  const winnerIds: Record<number, string> = {};

  for (let index = 0; index < 32; index += 1) {
    const matches = buildOfficialBracketWithWinners(seedMap, winnerIds);
    const match = matches[index];
    if (match?.teamA && match.teamB && !match.unresolvedReason) {
      winnerIds[match.matchId] = stablePick(match.teamA, match.teamB).id;
    }
  }

  const bracket = buildOfficialBracketWithWinners(seedMap, winnerIds);

  return NextResponse.json({
    ok: true,
    source: "AI 시뮬레이션",
    lastSimulatedAt: new Date().toISOString(),
    notice:
      "상세 정보가 검증되지 않은 항목은 선수·감독·전술·포메이션 기반 예측에서 제외했습니다. 공식 3위 배정표가 없는 자리는 임의 확정하지 않습니다.",
    validation,
    bracket
  });
}

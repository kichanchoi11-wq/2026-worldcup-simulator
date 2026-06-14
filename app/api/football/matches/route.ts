import { NextResponse } from "next/server";
import { fetchFootballData, normalizeMatches } from "@/lib/footballApi";

export const dynamic = "force-dynamic";

export async function GET() {
  const envelope = await fetchFootballData("/competitions/WC/matches", { matches: [] });
  const matches = normalizeMatches(envelope.data);

  return NextResponse.json({
    ...envelope,
    message:
      envelope.message ??
      (matches.length === 0
        ? "API-Football 또는 fallback API가 정상 응답했지만 표시할 경기 일정·결과가 아직 없습니다. 기존 저장 데이터는 유지합니다."
        : null),
    data: matches
  });
}

import { NextResponse } from "next/server";
import { fetchFootballData, normalizeMatches } from "@/lib/footballApi";

export const dynamic = "force-dynamic";

export async function GET() {
  const envelope = await fetchFootballData("/competitions/WC/matches", { matches: [] });

  return NextResponse.json({
    ...envelope,
    data: normalizeMatches(envelope.data)
  });
}

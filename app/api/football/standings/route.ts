import { NextResponse } from "next/server";
import { fetchFootballData, normalizeStandings } from "@/lib/footballApi";

export const dynamic = "force-dynamic";

export async function GET() {
  const envelope = await fetchFootballData("/competitions/WC/standings", { standings: [] });

  return NextResponse.json({
    ...envelope,
    data: normalizeStandings(envelope.data)
  });
}

import { NextResponse } from "next/server";
import { fetchFootballData } from "@/lib/footballApi";

export const dynamic = "force-dynamic";

export async function GET() {
  const envelope = await fetchFootballData("/competitions/WC", {});

  return NextResponse.json(envelope);
}

import { NextResponse } from "next/server";
import { refreshFootballData } from "@/lib/autoUpdateService";

export const dynamic = "force-dynamic";

export async function POST() {
  const snapshot = await refreshFootballData("manual");

  return NextResponse.json(snapshot, { status: snapshot.ok ? 200 : 207 });
}

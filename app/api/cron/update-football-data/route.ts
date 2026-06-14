import { NextResponse } from "next/server";
import { refreshFootballData } from "@/lib/autoUpdateService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const authHeader = request.headers.get("authorization");

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, message: "Unauthorized cron request" }, { status: 401 });
    }
  }

  const snapshot = await refreshFootballData("cron");

  return NextResponse.json(snapshot, { status: snapshot.ok ? 200 : 207 });
}

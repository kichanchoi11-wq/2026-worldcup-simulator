import { NextResponse } from "next/server";
import { createAdminUnauthorizedResponse, isAdminRequest, isCronRequestAuthorized } from "@/lib/adminAuth";
import { refreshFootballData } from "@/lib/autoUpdateService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isCronRequestAuthorized(request) && !isAdminRequest(request)) {
    return createAdminUnauthorizedResponse();
  }

  const snapshot = await refreshFootballData("cron");

  return NextResponse.json(snapshot, { status: snapshot.ok ? 200 : 207 });
}

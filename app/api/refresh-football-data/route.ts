import { NextResponse } from "next/server";
import { createAdminUnauthorizedResponse, isAdminRequest } from "@/lib/adminAuth";
import { refreshFootballData } from "@/lib/autoUpdateService";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return createAdminUnauthorizedResponse();
  }

  const snapshot = await refreshFootballData("manual");

  return NextResponse.json(snapshot, { status: snapshot.ok ? 200 : 207 });
}

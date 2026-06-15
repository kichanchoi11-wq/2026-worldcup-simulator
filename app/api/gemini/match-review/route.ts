import { NextResponse } from "next/server";
import { createMatchPageData, getMatchDetailById } from "@/data/matchDetails";
import { createAdminUnauthorizedResponse, isAdminRequest } from "@/lib/adminAuth";
import { createGeminiMatchReview } from "@/lib/geminiAnalysisService";

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return createAdminUnauthorizedResponse();
  }

  const body = (await request.json().catch(() => null)) as { matchId?: unknown } | null;
  const matchId = typeof body?.matchId === "string" || typeof body?.matchId === "number" ? String(body.matchId) : null;

  if (!matchId) {
    return NextResponse.json({ ok: false, message: "matchId가 필요합니다." }, { status: 400 });
  }

  const match = getMatchDetailById(matchId);

  if (!match) {
    return NextResponse.json({ ok: false, message: "경기를 찾을 수 없습니다." }, { status: 404 });
  }

  const pageData = createMatchPageData(match);
  const result = await createGeminiMatchReview(pageData);

  return NextResponse.json(result, { status: result.ok ? 200 : 409 });
}

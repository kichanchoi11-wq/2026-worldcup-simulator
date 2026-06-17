import { NextResponse } from "next/server";
import { createAdminUnauthorizedResponse, isAdminRequest } from "@/lib/adminAuth";
import { createMatchFreshInfo, getGeminiFreshInfoStatus } from "@/lib/geminiFreshInfoService";
import type { FootballMatch } from "@/types/football";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return createAdminUnauthorizedResponse();
  }

  try {
    const body = (await request.json()) as { matchId?: string; matches?: unknown[] };

    if (!body.matchId) {
      return NextResponse.json({ ok: false, message: "matchId가 필요합니다." }, { status: 400 });
    }

    const result = await createMatchFreshInfo(body.matchId, Array.isArray(body.matches) ? body.matches as FootballMatch[] : []);
    const status = getGeminiFreshInfoStatus(result ? [result] : []);

    return NextResponse.json({ ok: Boolean(result), data: result, status }, { status: result ? 200 : 404 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "경기 최신 정보 요청 처리 중 오류가 발생했습니다."
      },
      { status: 500 }
    );
  }
}

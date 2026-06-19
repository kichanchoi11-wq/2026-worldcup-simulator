import { NextResponse } from "next/server";
import { createAdminUnauthorizedResponse, isAdminRequest } from "@/lib/adminAuth";
import { createTeamFreshInfo, getAIFreshInfoStatus } from "@/lib/aiFreshInfoService";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return createAdminUnauthorizedResponse();
  }

  try {
    const body = (await request.json()) as { teamId?: string };

    if (!body.teamId) {
      return NextResponse.json({ ok: false, message: "teamId가 필요합니다." }, { status: 400 });
    }

    const result = await createTeamFreshInfo(body.teamId);
    const status = getAIFreshInfoStatus(result ? [result] : []);

    return NextResponse.json({ ok: Boolean(result), data: result, status }, { status: result ? 200 : 404 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "팀 최신 정보 요청 처리 중 오류가 발생했습니다."
      },
      { status: 500 }
    );
  }
}

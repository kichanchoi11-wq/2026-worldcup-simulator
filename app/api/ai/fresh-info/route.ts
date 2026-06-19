import { NextResponse } from "next/server";
import { createAdminUnauthorizedResponse, isAdminRequest } from "@/lib/adminAuth";
import { createAIFreshInfo } from "@/lib/aiFreshInfoService";
import type { AIFreshInfoRequest } from "@/types/freshInfo";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return createAdminUnauthorizedResponse();
  }

  try {
    const body = (await request.json()) as Partial<AIFreshInfoRequest>;

    if (!body.targetType || !body.targetId || !Array.isArray(body.infoNeeds) || body.infoNeeds.length === 0) {
      return NextResponse.json({ ok: false, message: "AI 최신 정보 요청 대상과 infoNeeds가 필요합니다." }, { status: 400 });
    }

    const result = await createAIFreshInfo({
      targetType: body.targetType,
      targetId: body.targetId,
      teamNames: body.teamNames,
      playerNames: body.playerNames,
      matchName: body.matchName,
      dateHint: body.dateHint ?? null,
      infoNeeds: body.infoNeeds,
      existingData: body.existingData ?? null,
      allowedSources: body.allowedSources,
      language: "ko"
    });

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "AI 최신 정보 요청 처리 중 오류가 발생했습니다."
      },
      { status: 500 }
    );
  }
}

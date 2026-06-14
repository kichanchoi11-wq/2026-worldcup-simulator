import { NextResponse } from "next/server";
import { getFootballProviderStatus } from "@/lib/footballApi";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "API-Football 우선, football-data.org fallback, 캐시, 정적 데이터 순서로 데이터 공급 상태를 확인했습니다.",
    data: getFootballProviderStatus()
  });
}

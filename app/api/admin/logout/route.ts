import { NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ ok: true, message: "관리자 로그아웃이 완료되었습니다." });
  clearAdminSessionCookie(response);

  return response;
}

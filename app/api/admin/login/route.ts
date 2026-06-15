import { NextResponse } from "next/server";
import { isValidAdminPassword, setAdminSessionCookie } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let password: unknown = null;

  try {
    const body = (await request.json()) as { password?: unknown };
    password = body.password;
  } catch {
    password = null;
  }

  if (!isValidAdminPassword(password)) {
    return NextResponse.json({ ok: false, message: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, message: "관리자 인증이 완료되었습니다." });
  setAdminSessionCookie(response);

  return response;
}

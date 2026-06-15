import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { adminSessionStorageKey } from "@/lib/adminConstants";

export { adminSessionStorageKey };
export const adminSessionCookieName = "worldcup_admin_session";

const fallbackAdminPassword = "091009";
const sessionCookieMaxAgeSeconds = 60 * 60 * 8;

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || fallbackAdminPassword;
}

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}

export function isValidAdminPassword(value: unknown) {
  return typeof value === "string" && safeEqual(value, getAdminPassword());
}

function createAdminSessionToken() {
  return createHmac("sha256", getAdminPassword()).update("2026-worldcup-admin-session").digest("hex");
}

function readCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return null;
  }

  for (const item of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = item.trim().split("=");
    if (rawName === name) {
      return rawValue.join("=");
    }
  }

  return null;
}

function hasValidAdminSession(request: Request) {
  const token = readCookie(request, adminSessionCookieName);
  return typeof token === "string" && safeEqual(token, createAdminSessionToken());
}

export function isAdminRequest(request: Request) {
  const providedPassword = request.headers.get("x-admin-password");

  if (isValidAdminPassword(providedPassword)) {
    return true;
  }

  return hasValidAdminSession(request);
}

export function setAdminSessionCookie(response: NextResponse) {
  response.cookies.set(adminSessionCookieName, createAdminSessionToken(), {
    httpOnly: true,
    maxAge: sessionCookieMaxAgeSeconds,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set(adminSessionCookieName, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
}

export function createAdminUnauthorizedResponse() {
  return NextResponse.json({ ok: false, message: "관리자 인증이 필요합니다." }, { status: 401 });
}

export function isCronRequestAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  const cronSecretHeader = request.headers.get("x-cron-secret");

  return authHeader === `Bearer ${cronSecret}` || cronSecretHeader === cronSecret;
}

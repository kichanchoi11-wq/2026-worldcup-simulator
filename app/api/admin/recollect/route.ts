import { NextResponse } from "next/server";
import { createAdminUnauthorizedResponse, isAdminRequest } from "@/lib/adminAuth";
import { runAdminRecollection } from "@/lib/recollectionService";
import type { RecollectionScope } from "@/types/recollection";

export const dynamic = "force-dynamic";

const allowedScopes = new Set<RecollectionScope>([
  "all",
  "coaches",
  "formations",
  "tactics",
  "lineups",
  "risks",
  "match-reviews",
  "hide-unverified-players",
  "hide-unverified-staff",
  "disable-invalid-data"
]);

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return createAdminUnauthorizedResponse();
  }

  let body: { scope?: unknown };

  try {
    body = (await request.json()) as { scope?: unknown };
  } catch {
    body = {};
  }

  const scope = typeof body.scope === "string" && allowedScopes.has(body.scope as RecollectionScope) ? (body.scope as RecollectionScope) : null;

  if (!scope) {
    return NextResponse.json({ ok: false, message: "유효한 재수집 scope가 필요합니다." }, { status: 400 });
  }

  const result = await runAdminRecollection(scope);

  return NextResponse.json(result, { status: result.status === "실패" ? 207 : 200 });
}

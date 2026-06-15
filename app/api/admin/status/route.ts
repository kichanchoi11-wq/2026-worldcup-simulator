import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return NextResponse.json({ ok: true, authenticated: isAdminRequest(request) });
}

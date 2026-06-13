import { NextResponse } from "next/server";
import { createInternalGroupSimulation } from "@/lib/aiSimulation";
import { getBaseGroups } from "@/lib/scenario";
import type { TeamGroup } from "@/types/football";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { groups?: TeamGroup[] };
  const groups = Array.isArray(body.groups) && body.groups.length > 0 ? body.groups : getBaseGroups();
  const simulation = createInternalGroupSimulation(groups);

  return NextResponse.json(simulation);
}

import { NextResponse } from "next/server";
import {
  createFullTournamentPrediction,
  createLegacyGroupSimulation,
  createLegacyTournamentSimulation
} from "@/lib/fullTournamentPrediction";
import { getBaseGroups } from "@/lib/scenario";
import type { TeamGroup } from "@/types/football";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { groups?: TeamGroup[] };
  const groups = Array.isArray(body.groups) && body.groups.length > 0 ? body.groups : getBaseGroups();
  const prediction = createFullTournamentPrediction(groups);

  return NextResponse.json({
    ok: true,
    prediction,
    legacyGroupSimulation: createLegacyGroupSimulation(prediction),
    legacyTournamentSimulation: createLegacyTournamentSimulation(prediction)
  });
}

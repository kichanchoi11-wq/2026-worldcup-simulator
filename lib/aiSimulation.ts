import { createFullTournamentPrediction, createLegacyGroupSimulation } from "@/lib/fullTournamentPrediction";
import type { TeamGroup } from "@/types/football";
import type { GroupSimulationData } from "@/types/simulation";

export function createInternalGroupSimulation(groups: TeamGroup[]): GroupSimulationData {
  return createLegacyGroupSimulation(createFullTournamentPrediction(groups));
}

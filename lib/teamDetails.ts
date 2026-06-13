import { getTeamVerificationDataById, teamVerificationData } from "@/data/teamVerificationData";
import { getBaseGroups } from "@/lib/scenario";
import type { TeamRef } from "@/types/football";
import type { TeamVerificationData } from "@/types/team";

export type TeamDetailRecord = {
  team: TeamRef;
  detail: TeamVerificationData;
};

export function getAllTeamDetailRecords(): TeamDetailRecord[] {
  const teams = getBaseGroups().flatMap((group) => group.teams);

  return teams.flatMap((team) => {
    const detail = getTeamVerificationDataById(team.teamSlug);
    return detail ? [{ team, detail }] : [];
  });
}

export function getTeamDetailRecord(teamId: string): TeamDetailRecord | null {
  return getAllTeamDetailRecords().find((record) => record.team.teamSlug === teamId || record.team.id.toLowerCase() === teamId) ?? null;
}

export function getAllTeamIds() {
  return teamVerificationData.map((team) => team.teamId);
}

export function hasCompleteSource(source: { sourceName?: string | null; sourceUrl?: string | null; lastUpdated?: string | null }) {
  return Boolean(source.sourceName && source.sourceUrl && source.lastUpdated);
}

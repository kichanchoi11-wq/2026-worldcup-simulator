import teamsBase from "@/data/teams.base.json";
import type { BracketTeam } from "@/types/bracket";
import type { TeamGroup, TeamRef } from "@/types/football";

interface TeamsBaseFile {
  groups: TeamGroup[];
}

const teamsFile = teamsBase as TeamsBaseFile;

export function getBaseGroups() {
  return teamsFile.groups;
}

export function toBracketTeam(team: TeamRef, seed: string): BracketTeam {
  return {
    id: team.id,
    nameKo: team.nameKo,
    group: team.group,
    seed,
    sourceType: "확인 필요 데이터"
  };
}

export function createDefaultGroupRankings() {
  return Object.fromEntries(
    getBaseGroups().map((group) => [
      group.id,
      group.teams.map((team, index) => toBracketTeam(team, `${index + 1}${group.id}`))
    ])
  ) as Record<string, BracketTeam[]>;
}

export function getDefaultThirdPlaceQualifiers(groupRankings: Record<string, BracketTeam[]>) {
  return Object.values(groupRankings)
    .map((teams) => teams[2])
    .filter(Boolean)
    .slice(0, 8);
}

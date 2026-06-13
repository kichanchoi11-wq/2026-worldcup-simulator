import type { BracketTeam, TournamentValidation } from "@/types/bracket";

export function findDuplicateTeams(teams: BracketTeam[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const team of teams) {
    const key = team.id || team.nameKo;
    if (seen.has(key)) {
      duplicates.add(team.nameKo);
    }
    seen.add(key);
  }

  return Array.from(duplicates);
}

export function validateQualifiedTeams(qualifiedTeams: BracketTeam[] | null | undefined): TournamentValidation {
  const teams = qualifiedTeams ?? [];
  const duplicateTeams = findDuplicateTeams(teams);

  if (teams.length !== 32) {
    return {
      canStart: false,
      reason: "32강 진출팀이 32팀이 아닙니다.",
      count: teams.length,
      duplicateTeams,
      qualifiedTeams: teams
    };
  }

  if (duplicateTeams.length > 0) {
    return {
      canStart: false,
      reason: "32강 진출팀에 중복 팀이 있습니다.",
      count: teams.length,
      duplicateTeams,
      qualifiedTeams: teams
    };
  }

  return {
    canStart: true,
    reason: null,
    count: teams.length,
    duplicateTeams,
    qualifiedTeams: teams
  };
}

import type { DataSourceType } from "@/types/football";

export type TournamentRound = "32강" | "16강" | "8강" | "4강" | "3·4위전" | "결승";

export interface BracketSlot {
  matchId: number;
  round: TournamentRound;
  teamASeed: string;
  teamBSeed: string;
  label: string;
}

export interface BracketTeam {
  id: string;
  nameKo: string;
  seed: string;
  group?: string;
  sourceType: DataSourceType;
}

export interface BracketMatch extends BracketSlot {
  teamA: BracketTeam | null;
  teamB: BracketTeam | null;
  winner: BracketTeam | null;
  lockedByApiResult: boolean;
  unresolvedReason: string | null;
}

export interface TournamentValidation {
  canStart: boolean;
  reason: string | null;
  count: number;
  duplicateTeams: string[];
  qualifiedTeams: BracketTeam[];
}

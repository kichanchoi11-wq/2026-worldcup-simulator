import thirdPlaceAllocation from "@/data/fifaThirdPlaceAllocationTable.json";
import {
  allOfficialBracketSlots,
  officialRoundOf32Slots
} from "@/data/fifaBracket";
import type { BracketMatch, BracketSlot, BracketTeam, TournamentValidation } from "@/types/bracket";
import { validateQualifiedTeams } from "@/lib/validation";

type SeedMap = Record<string, BracketTeam | undefined>;
type OutcomeMap = Record<number, { winner: BracketTeam | null; loser: BracketTeam | null }>;

interface ThirdPlaceAllocationFile {
  notice: string;
  slotEligibility: Record<string, string[]>;
  allocationCombinations: unknown[];
}

const thirdPlaceInfo = thirdPlaceAllocation as ThirdPlaceAllocationFile;

export function seedFor(group: string, position: number) {
  return `${position}${group}`;
}

export function createSeedMapFromRankings(
  groupRankings: Record<string, BracketTeam[]>,
  thirdPlaceQualifiers: BracketTeam[]
): SeedMap {
  const seedMap: SeedMap = {};

  for (const [group, teams] of Object.entries(groupRankings)) {
    teams.slice(0, 3).forEach((team, index) => {
      seedMap[seedFor(group, index + 1)] = {
        ...team,
        seed: seedFor(group, index + 1),
        group
      };
    });
  }

  for (const team of thirdPlaceQualifiers) {
    if (team.group) {
      seedMap[`3${team.group}`] = { ...team, seed: `3${team.group}` };
    }
  }

  return seedMap;
}

function resolveSeed(seed: string, seedMap: SeedMap, outcomes: OutcomeMap = {}): BracketTeam | null {
  if (/^[WL]\d+$/.test(seed)) {
    const matchId = Number(seed.slice(1));
    const outcome = outcomes[matchId];
    return seed.startsWith("W") ? outcome?.winner ?? null : outcome?.loser ?? null;
  }

  if (!seed.includes("/")) {
    return seedMap[seed] ?? null;
  }

  const slashCandidates = seed.split("/");
  if (slashCandidates.every((candidate) => candidate.startsWith("3")) && thirdPlaceInfo.allocationCombinations.length === 0) {
    return null;
  }

  for (const candidate of slashCandidates) {
    if (seedMap[candidate]) {
      return seedMap[candidate] ?? null;
    }
  }

  return null;
}

export function isThirdPlaceSeedAllowed(slot: BracketSlot, seed: string) {
  if (!slot.teamASeed.includes("/") && !slot.teamBSeed.includes("/")) {
    return true;
  }

  const group = seed.replace("3", "");
  const allowed = thirdPlaceInfo.slotEligibility[String(slot.matchId)] ?? [];
  return allowed.includes(group);
}

export function getThirdPlaceNotice() {
  return thirdPlaceInfo.notice;
}

function createMatch(slot: BracketSlot, seedMap: SeedMap, outcomes: OutcomeMap = {}): BracketMatch {
  const teamA = resolveSeed(slot.teamASeed, seedMap, outcomes);
  const teamB = resolveSeed(slot.teamBSeed, seedMap, outcomes);
  const hasThirdPlaceSlot = slot.teamASeed.includes("3") || slot.teamBSeed.includes("3");
  const unresolvedReason =
    !teamA || !teamB
      ? hasThirdPlaceSlot
        ? thirdPlaceInfo.notice
        : "이전 라운드 승자 또는 조별 순위 데이터 확인이 필요합니다."
      : null;

  return {
    ...slot,
    teamA,
    teamB,
    winner: null,
    lockedByApiResult: false,
    unresolvedReason
  };
}

export function buildOfficialBracket(seedMap: SeedMap = {}) {
  return allOfficialBracketSlots.map((slot) => createMatch(slot, seedMap));
}

export function buildRoundOf32(seedMap: SeedMap = {}) {
  return officialRoundOf32Slots.map((slot) => createMatch(slot, seedMap));
}

export function buildOfficialBracketWithWinners(
  seedMap: SeedMap = {},
  winnerIdsByMatch: Record<number, string | undefined> = {}
) {
  const outcomes: OutcomeMap = {};
  const matches: BracketMatch[] = [];

  for (const slot of allOfficialBracketSlots) {
    const match = createMatch(slot, seedMap, outcomes);
    const selectedWinnerId = winnerIdsByMatch[slot.matchId];
    const selectedWinner =
      selectedWinnerId && match.teamA?.id === selectedWinnerId
        ? match.teamA
        : selectedWinnerId && match.teamB?.id === selectedWinnerId
          ? match.teamB
          : null;
    const loser =
      selectedWinner && match.teamA && match.teamB
        ? selectedWinner.id === match.teamA.id
          ? match.teamB
          : match.teamA
        : null;

    const completedMatch = {
      ...match,
      winner: selectedWinner
    };

    outcomes[slot.matchId] = {
      winner: selectedWinner,
      loser
    };
    matches.push(completedMatch);
  }

  return matches;
}

export function extractQualifiedTeamsFromSource(sourceData: unknown): BracketTeam[] {
  if (!sourceData || typeof sourceData !== "object") {
    return [];
  }

  const record = sourceData as Record<string, unknown>;
  const candidates = [
    record.predictedQualifiedTeams,
    record.qualifiedTeams,
    record.thirdPlaceQualifiers,
    record.apiQualifiedTeams
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(Boolean) as BracketTeam[];
    }
  }

  if (record.groupRankings && typeof record.groupRankings === "object") {
    const teams: BracketTeam[] = [];
    Object.entries(record.groupRankings as Record<string, BracketTeam[]>).forEach(([group, groupTeams]) => {
      teams.push(
        ...groupTeams.slice(0, 2).map((team, index) => ({
          ...team,
          group,
          seed: seedFor(group, index + 1)
        }))
      );
    });
    teams.push(...((record.thirdPlaceQualifiers as BracketTeam[] | undefined) ?? []));
    return teams;
  }

  return [];
}

export function validateGroupStageForTournament(sourceData: unknown): TournamentValidation {
  return validateQualifiedTeams(extractQualifiedTeamsFromSource(sourceData));
}

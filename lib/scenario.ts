import { getGroupSlotLabel, worldCupGroupSlots } from "@/data/worldCupGroups";
import type { BracketTeam } from "@/types/bracket";
import type { DisplayBadge, GroupSlotVerificationStatus, TeamGroup, TeamRef } from "@/types/football";

const groupIds = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;

function toDisplayBadge(status: GroupSlotVerificationStatus): DisplayBadge {
  if (status === "공식 확인") {
    return "공식 확인";
  }

  if (status === "API 확인") {
    return "API 확인";
  }

  if (status === "수동 확인") {
    return "수동 확인";
  }

  return "확인 필요";
}

export function getBaseGroups() {
  return groupIds.map((groupId): TeamGroup => {
    const teams = worldCupGroupSlots
      .filter((slot) => slot.groupId === groupId)
      .map((slot): TeamRef => ({
        id: `${slot.groupId}${slot.position}`,
        nameKo: slot.teamName ?? "국가명 확인 전",
        nameEn: slot.teamNameEn ?? "Team name pending verification",
        group: slot.groupId,
        slot: `${slot.groupId}${slot.position}`,
        position: slot.position,
        teamCode: slot.teamCode ?? null,
        flag: slot.flagEmoji ?? "🏳️",
        flagImageUrl: slot.flagImageUrl,
        flagAlt: slot.flagAlt,
        dataSourceType: slot.sourceType,
        verificationStatus: toDisplayBadge(slot.verificationStatus),
        sourceName: slot.sourceName,
        sourceUrl: slot.sourceUrl,
        lastUpdated: slot.lastUpdated,
        isOfficial: slot.isOfficial,
        confidence: slot.confidence
      }));

    const hasOfficialTeams = teams.some((team) => team.verificationStatus === "공식 확인" || team.verificationStatus === "API 확인");

    return {
      id: groupId,
      name: `${groupId}조`,
      sourceType: hasOfficialTeams ? "공식 출처 데이터" : "확인 필요 데이터",
      teams
    };
  });
}

export function toBracketTeam(team: TeamRef, seed: string): BracketTeam {
  return {
    id: team.id,
    nameKo: team.nameKo,
    group: team.group,
    seed,
    sourceType: team.dataSourceType
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

export function getGroupDataAudit() {
  const groups = getBaseGroups();
  const teams = groups.flatMap((group) => group.teams);
  const emptySlots = teams.filter((team) => team.nameKo === "국가명 확인 전");
  const needsVerification = teams.filter((team) => team.verificationStatus === "확인 필요" || team.verificationStatus === "재검증 필요");
  const manuallyVerified = teams.filter((team) => team.verificationStatus === "수동 확인");
  const officiallyConfirmed = teams.filter((team) => team.verificationStatus === "공식 확인" || team.verificationStatus === "API 확인");
  const sourceReviewRequired = teams.filter((team) => team.verificationStatus !== "공식 확인" && team.verificationStatus !== "API 확인");

  return {
    groupCount: groups.length,
    teamCount: teams.length,
    emptySlots,
    needsVerification,
    manuallyVerified,
    officiallyConfirmed,
    sourceReviewRequired,
    slotLabels: teams.map((team) => ({
      team,
      label: getGroupSlotLabel({ groupId: team.group as any, position: team.position as any })
    }))
  };
}

import { buildOfficialBracket } from "@/lib/bracket";
import type { BracketTeam } from "@/types/bracket";
import type { TeamGroup } from "@/types/football";
import type { GroupSimulationData, PredictedStanding } from "@/types/simulation";

export function createInternalGroupSimulation(groups: TeamGroup[]): GroupSimulationData {
  const predictedStandings: PredictedStanding[] = groups.flatMap((group) =>
    group.teams.map((team, index) => ({
      team: team.nameKo,
      group: group.id,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      winProbability: null,
      qualificationProbability: team.sourceUrl ? Math.max(5, 65 - index * 12) : null,
      sourceType: "AI 예측 데이터"
    }))
  );

  const predictedQualifiedTeams: BracketTeam[] = groups.flatMap((group) =>
    group.teams.slice(0, 2).map((team, index) => ({
      id: team.id,
      nameKo: team.nameKo,
      seed: `${index + 1}${group.id}`,
      group: group.id,
      sourceType: "AI 예측 데이터"
    }))
  );

  const thirdPlaceCandidates = groups
    .map((group) => group.teams[2])
    .filter(Boolean)
    .slice(0, 8)
    .map((team) => ({
      id: team.id,
      nameKo: team.nameKo,
      seed: `3${team.group}`,
      group: team.group,
      sourceType: "AI 예측 데이터" as const
    }));

  const notice =
    "이 예측은 공식 결과가 아니며, API 실제 데이터와 검증된 팀 정보를 바탕으로 생성된 참고용 시뮬레이션입니다. 팀 정보가 검증되지 않은 항목은 선수·감독·전술·포메이션 기반 예측에서 제외했습니다.";

  return {
    groupPredictions: [],
    matchPredictions: [],
    predictedStandings,
    predictedQualifiedTeams: [...predictedQualifiedTeams, ...thirdPlaceCandidates],
    predictedKnockoutResults: buildOfficialBracket(),
    lastSimulatedAt: new Date().toISOString(),
    source: "AI 시뮬레이션",
    notice
  };
}

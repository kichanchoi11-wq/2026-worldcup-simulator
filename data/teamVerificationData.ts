import { teamScoutingProfiles } from "@/data/teamScoutingProfiles";
import { worldCupGroupSlots } from "@/data/worldCupGroups";
import type { SourceMeta } from "@/types/football";
import type {
  CoachData,
  FormationData,
  FormationPlayer,
  KoreaStrategyData,
  NotablePlayerAnalysis,
  PlayerData,
  PlayerStatus,
  TacticsData,
  TeamVerificationData,
  VerificationRequirement
} from "@/types/team";

const detailReviewDate = "2026-06-14";

function sourceMeta(source: Partial<SourceMeta> = {}): SourceMeta {
  return {
    sourceName: source.sourceName ?? null,
    sourceUrl: source.sourceUrl ?? null,
    lastUpdated: source.lastUpdated ?? null,
    isOfficial: source.isOfficial ?? false,
    confidence: source.confidence ?? "확인 필요",
    sourceLevel: source.sourceLevel,
    sourceNotes: source.sourceNotes ?? null
  };
}

function playerId(teamId: string, name: string) {
  return `${teamId}-${name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

function formationCoordinates(players: PlayerData[]): FormationPlayer[] {
  const byPosition = {
    GK: players.filter((player) => player.position === "GK"),
    DF: players.filter((player) => player.position === "DF"),
    MF: players.filter((player) => player.position === "MF"),
    FW: players.filter((player) => player.position === "FW")
  };

  const lineY = { GK: 87, DF: 68, MF: 49, FW: 28 };

  return (Object.keys(byPosition) as Array<keyof typeof byPosition>).flatMap((position) => {
    const line = byPosition[position];
    return line.map((player, index) => ({
      playerId: player.playerId,
      playerName: player.playerName,
      position,
      x: ((index + 1) * 100) / (line.length + 1),
      y: lineY[position],
      role: player.squadStatus,
      status: player.availability
    }));
  });
}

function createUnverifiedCoach(teamId: string, teamName: string): CoachData {
  return {
    teamId,
    teamName,
    coachName: null,
    nationality: null,
    appointedDate: null,
    tacticalNotes: null,
    status: "확인 필요",
    ...sourceMeta()
  };
}

function createUnverifiedFormation(teamId: string, teamName: string, label: string): FormationData {
  return {
    teamId,
    teamName,
    formation: null,
    matchBasis: null,
    players: [],
    type: "확인 필요",
    notes: [
      `${label} 추가 수집 필요`,
      "신뢰 가능한 명단·최근 경기 라인업·전술 분석 자료가 확보되면 즉시 갱신합니다."
    ],
    ...sourceMeta()
  };
}

function createUnverifiedTactics(teamId: string, teamName: string): TacticsData {
  return {
    teamId,
    teamName,
    summary: "추가 수집 필요: 현재 조 편성 외 전술 자료가 충분하지 않아 일반적인 분석만 표시합니다.",
    attackingStyle: null,
    defensiveStyle: null,
    pressingStyle: null,
    buildUpStyle: null,
    transitionStyle: null,
    setPieceStyle: null,
    strengths: [],
    weaknesses: [],
    evidenceMatches: [],
    uncertainty: "출처가 확인되는 자료를 찾는 대로 세부 전술을 보강합니다.",
    ...sourceMeta()
  };
}

function createKoreaStrategy(teamName: string, strengths: string[] = [], weaknesses: string[] = [], keywords: string[] = []): KoreaStrategyData {
  const firstStrength = strengths[0] ?? "전환 공격";
  const firstWeakness = weaknesses[0] ?? "후방 빌드업 압박 대응";
  const pressureTarget = keywords[0] ?? "중원 전개";
  const attackTarget = keywords[1] ?? "측면 공간";

  return {
    confidence: strengths.length > 0 ? "분석 참고" : "확인 필요",
    notice: `${teamName}전 대비 전략은 공개 명단과 신뢰 가능한 스카우팅 자료를 바탕으로 한 분석 참고 자료입니다. 확정 선발과 부상/징계는 경기 전 공식 발표로 재확인해야 합니다.`,
    strengths,
    weaknesses,
    pressurePlan: `${pressureTarget}가 시작되기 전 1차 압박 방향을 정하고, 패스가 중앙으로 들어오면 한국의 2선과 수비형 미드필더가 동시에 압축합니다.`,
    defensivePlan: `${firstStrength}을 막기 위해 풀백 뒤 공간을 혼자 두지 않고, 반대쪽 윙어가 빠르게 내려와 2대1 수비를 만듭니다.`,
    counterPlan: `${firstWeakness}이 드러나는 구간에서는 손흥민·황희찬 유형의 뒷공간 침투와 이강인 유형의 빠른 전환 패스를 우선 사용합니다.`,
    setPiecePlan: "상대 제공권과 세컨드볼 루트를 사전에 분리하고, 첫 클리어 이후 박스 앞 리바운드 슈팅을 막는 선수를 고정합니다.",
    riskWindow: `${teamName}이 ${attackTarget}을 빠르게 바꿀 때 한국의 풀백-센터백 사이 간격이 벌어질 수 있습니다.`,
    winScenario: "한국이 초반 압박 성공률을 높이고, 상대 핵심 전개 루트의 첫 패스를 끊은 뒤 빠른 전환으로 선제골을 노리는 흐름이 가장 현실적입니다.",
    avoidScenario: "불확실한 부상/징계 정보를 확정처럼 전제하지 않고, 경기 전 공식 라인업 확인 전까지는 여러 선발 시나리오를 열어둡니다."
  };
}

export const teamVerificationRequirements: VerificationRequirement[] = [
  {
    title: "선수 명단",
    status: "신뢰도 높음",
    description: "FourFourTwo 월드컵 스쿼드 가이드와 대회 스쿼드 참고 자료에서 확인 가능한 핵심/주목 선수 위주로 표시합니다.",
    requiredSources: ["FourFourTwo", "2026 FIFA World Cup squads reference", "FIFA match schedule"]
  },
  {
    title: "감독 정보",
    status: "신뢰도 높음",
    description: "감독명은 신뢰 가능한 스쿼드 가이드와 대회 스쿼드 참고 자료를 교차해 표시합니다.",
    requiredSources: ["FourFourTwo", "축구협회/대회 스쿼드 참고 자료", "FIFA 일정"]
  },
  {
    title: "포메이션",
    status: "분석 참고",
    description: "최근 대표팀 운영 경향과 스쿼드 구성을 바탕으로 주요/예상 포메이션을 표시하되, 확정 선발로 단정하지 않습니다.",
    requiredSources: ["최근 경기 자료", "스쿼드 가이드", "전술 분석 자료"]
  },
  {
    title: "전술 분석",
    status: "분석 참고",
    description: "공격 방식, 수비 방식, 압박, 빌드업, 전환, 세트피스 특징을 자료 기반 요약으로 제공합니다.",
    requiredSources: ["FourFourTwo", "경기 결과/라인업 자료", "전술 분석 자료"]
  },
  {
    title: "부상·징계·카드",
    status: "추가 수집 필요",
    description: "경기 직전 바뀔 수 있는 항목은 확정처럼 표시하지 않고 추가 확인 필요로 유지합니다.",
    requiredSources: ["FIFA 경기 리포트", "공식 팀 발표", "신뢰 가능한 경기 데이터"]
  }
];

export const teamVerificationData: TeamVerificationData[] = worldCupGroupSlots.map((slot) => {
  const teamId = slot.teamSlug;
  const teamName = slot.teamName ?? "국가명 확인 필요";
  const groupSource = sourceMeta({
    sourceName: slot.sourceName,
    sourceUrl: slot.sourceUrl,
    lastUpdated: slot.lastUpdated,
    isOfficial: slot.isOfficial,
    confidence: slot.confidence,
    sourceLevel: slot.isOfficial ? "공식 확인" : "확인 필요"
  });
  const profile = teamScoutingProfiles[teamId];

  if (!profile) {
    return {
      teamId,
      teamName,
      teamNameEn: slot.teamNameEn ?? "Team name pending verification",
      teamCode: slot.teamCode ?? null,
      groupId: slot.groupId,
      groupPosition: slot.position,
      confederation: null,
      powerIndex: "추가 수집 필요",
      recentAchievements: [],
      flag: slot.flagEmoji ?? "🏳️",
      flagImageUrl: slot.flagImageUrl,
      flagAlt: slot.flagAlt,
      dataStatus: {
        squad: "확인 필요",
        coach: "확인 필요",
        formation: "확인 필요",
        tactics: "추가 수집 필요",
        lineup: "표시 불가",
        risk: "추가 수집 필요",
        cards: "추가 수집 필요",
        fitness: "추가 수집 필요",
        recentLineup: "확인 필요",
        lastUpdated: null,
        confidence: "확인 필요"
      },
      coach: createUnverifiedCoach(teamId, teamName),
      players: [],
      formation: createUnverifiedFormation(teamId, teamName, "포메이션"),
      expectedLineup: createUnverifiedFormation(teamId, teamName, "예상 라인업"),
      tactics: createUnverifiedTactics(teamId, teamName),
      notablePlayers: [],
      playerStatuses: [],
      koreaStrategy: createKoreaStrategy(teamName),
      sources: [groupSource],
      lastUpdated: detailReviewDate,
      notes: ["팀별 보강 자료를 추가 수집해야 합니다."]
    };
  }

  const primarySource = profile.sources[1] ?? profile.sources[0] ?? groupSource;
  const players: PlayerData[] = profile.players.map((profilePlayer) => ({
    playerId: playerId(teamId, profilePlayer.name),
    teamId,
    teamName,
    playerName: profilePlayer.name,
    position: profilePlayer.position,
    club: profilePlayer.club,
    squadStatus: profilePlayer.role === "핵심 선수" ? "최근 경기 엔트리" : "예상",
    availability: "출전 가능",
    yellowCards: null,
    redCards: null,
    injuryStatus: "확인 필요",
    suspensionStatus: "확인 필요",
    ...sourceMeta(primarySource)
  }));

  const formationPlayers = formationCoordinates(players);

  const formation: FormationData = {
    teamId,
    teamName,
    formation: profile.recentFormation,
    matchBasis: "최근 대표팀 운용 경향과 월드컵 스쿼드 가이드 기반",
    players: formationPlayers,
    type: "예상",
    notes: [
      "포메이션은 최근 운용 경향과 스쿼드 구성을 바탕으로 한 분석 참고 자료입니다.",
      "확정 선발 11명은 경기 전 공식 라인업 발표 후 재확인해야 합니다."
    ],
    ...sourceMeta(primarySource)
  };

  const expectedLineup: FormationData = {
    ...formation,
    formation: profile.expectedFormation,
    type: "예상",
    notes: [
      "핵심/주목 선수 중심의 예상 라인업 참고 자료입니다.",
      "부상·징계·컨디션에 따라 실제 선발은 달라질 수 있습니다."
    ]
  };

  const tactics: TacticsData = {
    teamId,
    teamName,
    summary: `${profile.expectedFormation} 기반으로 ${profile.tacticalKeywords.join(", ")}가 두드러지는 팀입니다. 강점은 ${profile.strengths.join(", ")}이며, 한국은 ${profile.weaknesses.join(", ")} 구간을 공략할 수 있습니다.`,
    attackingStyle: `${profile.tacticalKeywords[0] ?? "전환"}와 ${profile.tacticalKeywords[1] ?? "측면 활용"}을 중심으로 찬스를 만듭니다.`,
    defensiveStyle: `${profile.tacticalKeywords[2] ?? "중앙 밀집"}을 활용하되, 상대 전환 속도에 따라 라인 간격 관리가 중요합니다.`,
    pressingStyle: `${profile.tacticalKeywords[0] ?? "중원 압박"} 상황에서 1차 압박을 걸고 세컨드볼을 노립니다.`,
    buildUpStyle: "센터백-수비형 미드필더 연결 후 측면 또는 하프스페이스로 빠르게 전개하는 흐름이 핵심입니다.",
    transitionStyle: `${profile.tacticalKeywords[1] ?? "측면"} 방향으로 첫 패스를 빠르게 보내는 전환이 위협적입니다.`,
    setPieceStyle: "주요 키커와 제공권 자원을 활용한 코너킥·프리킥 상황을 준비할 가능성이 큽니다.",
    strengths: profile.strengths,
    weaknesses: profile.weaknesses,
    evidenceMatches: ["최근 월드컵 스쿼드 가이드", "대회 조 편성 및 경기 일정", "최근 대표팀 운영 경향"],
    uncertainty: "전술 설명은 공개 스쿼드와 신뢰 가능한 스카우팅 자료 기반의 분석 참고이며, 경기별 선발·부상·징계에 따라 달라질 수 있습니다.",
    ...sourceMeta(primarySource)
  };

  const notablePlayers: NotablePlayerAnalysis[] = players.slice(0, 5).map((profilePlayer, index) => ({
    playerId: profilePlayer.playerId,
    playerName: profilePlayer.playerName,
    position: profilePlayer.position,
    club: profilePlayer.club,
    reason: profile.players[index]?.note ?? "핵심 영향력이 확인된 선수입니다.",
    matchImpact: `${profilePlayer.playerName}의 역할은 ${profile.tacticalKeywords.slice(0, 2).join("·")} 흐름에서 중요합니다.`,
    koreaRisk: index < 3 ? "높음" : "보통",
    variables: ["선발 여부", "컨디션", "상대 압박 강도"],
    ...sourceMeta(primarySource)
  }));

  const playerStatuses: PlayerStatus[] = players.map((profilePlayer) => ({
    playerId: profilePlayer.playerId,
    playerName: profilePlayer.playerName,
    teamId,
    teamName,
    position: profilePlayer.position,
    availability: profilePlayer.availability,
    yellowCards: null,
    redCards: null,
    suspensionStatus: "확인 필요",
    injuryStatus: "확인 필요",
    fitnessLevel: null,
    recentMinutesPlayed: null,
    fatigueRisk: "확인 필요",
    ...sourceMeta(primarySource)
  }));

  return {
    teamId,
    teamName,
    teamNameEn: slot.teamNameEn ?? "Team name pending verification",
    teamCode: slot.teamCode ?? null,
    groupId: slot.groupId,
    groupPosition: slot.position,
    confederation: profile.confederation,
    powerIndex: profile.powerIndex,
    recentAchievements: profile.recentAchievements,
    flag: slot.flagEmoji ?? "🏳️",
    flagImageUrl: slot.flagImageUrl,
    flagAlt: slot.flagAlt,
    dataStatus: {
      squad: "신뢰도 높음",
      coach: profile.coachName ? "신뢰도 높음" : "확인 필요",
      formation: "분석 참고",
      tactics: "분석 참고",
      lineup: "분석 참고",
      risk: "추가 수집 필요",
      cards: "추가 수집 필요",
      fitness: "체력 변수",
      recentLineup: "신뢰도 높음",
      lastUpdated: profile.lastUpdated,
      confidence: "신뢰도 높음"
    },
    coach: {
      teamId,
      teamName,
      coachName: profile.coachName,
      nationality: profile.coachNationality,
      appointedDate: null,
      tacticalNotes: `${profile.expectedFormation} 기반 ${profile.tacticalKeywords.join(", ")} 성향으로 정리했습니다.`,
      status: profile.coachName ? "신뢰도 높음" : "확인 필요",
      ...sourceMeta(primarySource)
    },
    players,
    formation,
    expectedLineup,
    tactics,
    notablePlayers,
    playerStatuses,
    koreaStrategy: createKoreaStrategy(teamName, profile.strengths, profile.weaknesses, profile.tacticalKeywords),
    sources: [groupSource, ...profile.sources],
    lastUpdated: profile.lastUpdated,
    notes: [
      "감독·핵심 선수·포메이션·전술은 신뢰 가능한 스쿼드 가이드와 대회 참고 자료를 바탕으로 보강했습니다.",
      "부상·징계·카드·확정 선발은 경기 직전 공식 발표에 따라 변동될 수 있어 추가 수집 필요로 표시합니다.",
      "선수는 전체 26명 명단 전체가 아니라 핵심/주목 선수 중심으로 우선 표시합니다."
    ]
  };
});

export function getTeamVerificationData(teamName: string) {
  return teamVerificationData.find((team) => team.teamName === teamName) ?? null;
}

export function getTeamVerificationDataById(teamId: string) {
  return teamVerificationData.find((team) => team.teamId === teamId) ?? null;
}

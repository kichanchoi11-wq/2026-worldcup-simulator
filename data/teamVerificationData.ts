import { worldCupGroupSlots } from "@/data/worldCupGroups";
import type { SourceMeta } from "@/types/football";
import type {
  CoachData,
  FormationData,
  KoreaStrategyData,
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
    confidence: source.confidence ?? "확인 필요"
  };
}

function createUnverifiedCoach(teamId: string, teamName: string): CoachData {
  return {
    teamId,
    teamName,
    coachName: null,
    nationality: null,
    appointedDate: null,
    tacticalNotes: null,
    status: "재검증 필요",
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
      `${label} 확인 필요`,
      "최근 실제 경기 선발 라인업 또는 공식 경기 리포트가 확인되지 않아 포메이션을 확정 표시하지 않습니다.",
      "출처 없는 4-2-3-1, 4-3-3 같은 추정 포메이션은 표시하지 않습니다."
    ],
    ...sourceMeta()
  };
}

function createUnverifiedTactics(teamId: string, teamName: string): TacticsData {
  return {
    teamId,
    teamName,
    summary: null,
    attackingStyle: null,
    defensiveStyle: null,
    pressingStyle: null,
    buildUpStyle: null,
    transitionStyle: null,
    setPieceStyle: null,
    strengths: [],
    weaknesses: [],
    evidenceMatches: [],
    uncertainty: "최근 실제 경기, 공식 경기 리포트, 감독 인터뷰 또는 신뢰 가능한 전술 분석 출처 확인이 필요합니다.",
    ...sourceMeta()
  };
}

function createKoreaStrategy(teamName: string): KoreaStrategyData {
  return {
    confidence: "확인 필요",
    notice: "상대팀의 최신 선수 명단, 전술, 포메이션이 검증되지 않아 구체적인 공략 전략은 제한적으로 제공합니다.",
    strengths: ["공식 데이터 확보 후 상대 강점을 구체화합니다."],
    weaknesses: ["확인되지 않은 선수명이나 약점은 단정하지 않습니다."],
    pressurePlan: "상대 빌드업 출처와 최근 경기 영상을 확인한 뒤 압박 위치를 업데이트합니다.",
    defensivePlan: "공식 라인업과 핵심 공격 루트가 확인되기 전까지 일반적인 중앙 보호와 전환 대비 원칙만 제공합니다.",
    counterPlan: "상대 수비 라인과 풀백 전진 성향이 검증되면 역습 공략 지점을 구체화합니다.",
    setPiecePlan: "세트피스 키커와 제공권 데이터가 확인되면 공격/수비 세트피스 대응을 업데이트합니다.",
    riskWindow: `${teamName}의 최근 경기 흐름이 검증되지 않아 위험 시간대는 확정하지 않습니다.`,
    winScenario: "대한민국은 실점 위험을 줄이고, 공식 데이터가 확인된 뒤 상대 약점 기반 시나리오를 반영해야 합니다.",
    avoidScenario: "확인되지 않은 선수 상태나 전술을 전제로 무리한 맞춤 전략을 세우지 않습니다."
  };
}

export const teamVerificationRequirements: VerificationRequirement[] = [
  {
    title: "선수 명단",
    status: "확인 필요",
    description: "공식 소집 명단 또는 최근 경기 엔트리가 확인된 선수만 표시합니다.",
    requiredSources: ["FIFA", "각국 축구협회", "공식 경기 리포트"]
  },
  {
    title: "감독 정보",
    status: "재검증 필요",
    description: "감독명은 출처명, 출처 URL, 업데이트 날짜가 모두 있을 때만 확정 표시합니다.",
    requiredSources: ["FIFA", "각국 축구협회 공식 홈페이지", "국가대표팀 공식 SNS"]
  },
  {
    title: "포메이션",
    status: "확인 필요",
    description: "최근 실제 경기 선발 라인업 또는 공식 경기 리포트가 있어야 축구장 보드를 표시합니다.",
    requiredSources: ["최근 실제 경기 라인업", "FIFA 공식 경기 리포트"]
  },
  {
    title: "전술 분석",
    status: "재검증 필요",
    description: "감독 인터뷰, 공식 리포트, 신뢰 가능한 분석 출처가 확인된 경우에만 구체 설명을 표시합니다.",
    requiredSources: ["감독 인터뷰", "공식 경기 리포트", "신뢰 가능한 전술 분석 기사"]
  },
  {
    title: "예상 라인업",
    status: "표시 불가",
    description: "공식 명단, 최근 경기 라인업, 부상/징계/카드 정보가 모두 검증되어야 표시합니다.",
    requiredSources: ["공식 소집 명단", "최근 경기 라인업", "부상/징계 공식 정보"]
  },
  {
    title: "카드·부상·징계",
    status: "확인 필요",
    description: "경고, 퇴장, 부상, 징계는 API 실제 데이터 또는 공식 경기 기록 기준으로만 확정합니다.",
    requiredSources: ["football-data.org", "FIFA 징계 리포트", "공식 경기 기록"]
  }
];

export const teamVerificationData: TeamVerificationData[] = worldCupGroupSlots.map((slot) => {
  const teamId = slot.teamSlug;
  const teamName = slot.teamName ?? "국가명 확인 전";
  const groupSource = sourceMeta({
    sourceName: slot.sourceName,
    sourceUrl: slot.sourceUrl,
    lastUpdated: slot.lastUpdated,
    isOfficial: slot.isOfficial,
    confidence: slot.confidence
  });

  return {
    teamId,
    teamName,
    teamNameEn: slot.teamNameEn ?? "Team name pending verification",
    teamCode: slot.teamCode ?? null,
    groupId: slot.groupId,
    groupPosition: slot.position,
    flag: slot.flagEmoji ?? "🏳️",
    flagImageUrl: slot.flagImageUrl,
    flagAlt: slot.flagAlt,
    dataStatus: {
      squad: "확인 필요",
      coach: "재검증 필요",
      formation: "확인 필요",
      tactics: "재검증 필요",
      lineup: "표시 불가",
      risk: "확인 필요",
      cards: "확인 필요",
      fitness: "확인 필요",
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
    notes: [
      "이 국가의 조 편성은 공식 경기 일정 출처를 기준으로 표시합니다.",
      "감독, 선수 명단, 전술, 포메이션, 예상 라인업, 부상/징계/카드는 별도 공식 출처 확인 전까지 확정 정보로 표시하지 않습니다.",
      "관리자 모드에서 수동 입력할 때도 출처명, 출처 URL, 업데이트 날짜가 모두 필요합니다."
    ]
  };
});

export function getTeamVerificationData(teamName: string) {
  return teamVerificationData.find((team) => team.teamName === teamName) ?? null;
}

export function getTeamVerificationDataById(teamId: string) {
  return teamVerificationData.find((team) => team.teamId === teamId) ?? null;
}

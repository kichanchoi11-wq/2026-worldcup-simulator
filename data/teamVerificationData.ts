import { worldCupGroupSlots } from "@/data/worldCupGroups";
import type { TeamVerificationData, VerificationRequirement } from "@/types/team";

export const teamVerificationRequirements: VerificationRequirement[] = [
  {
    title: "선수 명단",
    status: "재검증 필요",
    description: "공식 소집 명단 또는 최근 경기 엔트리가 확인되기 전까지 선수 명단을 확정 표시하지 않습니다.",
    requiredSources: ["FIFA", "각국 축구협회", "공식 경기 리포트"]
  },
  {
    title: "감독 정보",
    status: "확인 필요",
    description: "현재 감독명은 공식 출처가 확인되지 않아 표시하지 않습니다.",
    requiredSources: ["FIFA", "각국 축구협회 공식 홈페이지", "국가대표팀 공식 SNS"]
  },
  {
    title: "포메이션",
    status: "확인 필요",
    description: "최근 실제 경기 선발 라인업 또는 공식 경기 리포트가 확인되지 않아 포메이션을 확정 표시하지 않습니다.",
    requiredSources: ["최근 실제 경기 라인업", "FIFA 공식 경기 리포트", "FotMob 또는 SofaScore"]
  },
  {
    title: "전술 분석",
    status: "재검증 필요",
    description: "감독 인터뷰, 공식 리포트, 신뢰 가능한 전술 분석이 확인되기 전까지 전술 설명을 생성하지 않습니다.",
    requiredSources: ["감독 인터뷰", "공식 경기 리포트", "신뢰 가능한 전술 분석 기사"]
  },
  {
    title: "예상 라인업",
    status: "표시 불가",
    description: "공식 소집 명단, 최근 경기 라인업, 부상/징계 정보가 검증되어야 예상 라인업을 표시할 수 있습니다.",
    requiredSources: ["공식 소집 명단", "최근 경기 라인업", "부상/징계 공식 정보"]
  },
  {
    title: "부상·징계 정보",
    status: "확인 필요",
    description: "출처가 있는 부상, 카드, 징계, 체력 정보만 확정 정보로 표시합니다.",
    requiredSources: ["FIFA 징계 리포트", "각국 축구협회 발표", "공식 경기 기록"]
  }
];

export const teamVerificationData: TeamVerificationData[] = worldCupGroupSlots.map((slot) => ({
  teamName: slot.teamName ?? "국가명 확인 전",
  groupId: slot.groupId,
  groupPosition: slot.position,
  squadStatus: "재검증 필요",
  coachStatus: "확인 필요",
  formationStatus: "확인 필요",
  tacticsStatus: "재검증 필요",
  lineupStatus: "표시 불가",
  injurySuspensionStatus: "확인 필요",
  squadSourceName: null,
  squadSourceUrl: null,
  coachSourceName: null,
  coachSourceUrl: null,
  formationSourceName: null,
  formationSourceUrl: null,
  lastUpdated: null,
  notes: [
    "이 팀의 세부 정보는 공식 출처 확인 전입니다.",
    "출처 없는 선수 명단, 감독, 전술, 포메이션은 확정 정보로 표시하지 않습니다.",
    "공식 소집 명단과 최근 경기 라인업 검증 전에는 예상 라인업을 표시하지 않습니다."
  ]
}));

export function getTeamVerificationData(teamName: string) {
  return teamVerificationData.find((team) => team.teamName === teamName) ?? null;
}

import { worldCupGroupSlots } from "@/data/worldCupGroups";
import type { TeamVerificationData, VerificationRequirement } from "@/types/team";

const verifiedAt = "2026-06-14";
const squadSourceName = "2026 FIFA World Cup squads - FIFA final squad list summary";
const squadSourceUrl = "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads";

type TeamProfile = {
  coachName: string;
  formationSummary: string;
  tacticsSummary: string;
};

const profileByTeamName: Record<string, TeamProfile> = {
  멕시코: {
    coachName: "Javier Aguirre",
    formationSummary: "4-3-3 또는 4-2-3-1",
    tacticsSummary: "중앙 압박과 빠른 측면 전개를 섞고, 전방 공격수에게 이른 크로스와 세컨드볼을 연결하는 운영이 핵심입니다."
  },
  남아프리카공화국: {
    coachName: "Hugo Broos",
    formationSummary: "4-2-3-1 또는 4-3-3",
    tacticsSummary: "간격을 좁힌 미드블록에서 공을 빼앗은 뒤 빠르게 전환하고, 측면 속도와 중거리 슈팅을 활용합니다."
  },
  대한민국: {
    coachName: "Hong Myung-bo",
    formationSummary: "4-2-3-1",
    tacticsSummary: "수비 전환 속도를 중시하면서 2선의 움직임과 측면 침투로 찬스를 만들고, 빌드업은 센터백과 수비형 미드필더를 중심으로 시작합니다."
  },
  체코: {
    coachName: "Miroslav Koubek",
    formationSummary: "3-4-2-1 또는 4-2-3-1",
    tacticsSummary: "피지컬 우위와 세트피스, 직접적인 전진 패스를 활용하며 박스 안 제공권 싸움에 강점을 둡니다."
  },
  캐나다: {
    coachName: "Jesse Marsch",
    formationSummary: "4-2-2-2 또는 4-3-3",
    tacticsSummary: "강한 전방 압박과 빠른 역습을 기본으로 하며, 넓은 측면 공간을 적극적으로 사용합니다."
  },
  "보스니아 헤르체고비나": {
    coachName: "Sergej Barbarez",
    formationSummary: "4-2-3-1",
    tacticsSummary: "중원에서 경기 속도를 조절하고 전방 타깃과 2선 침투를 연결하는 점유 기반 운영을 선호합니다."
  },
  카타르: {
    coachName: "Julen Lopetegui",
    formationSummary: "5-3-2 또는 3-5-2",
    tacticsSummary: "후방 숫자를 안정적으로 두고 짧은 패스로 탈압박한 뒤 윙백을 통해 전진하는 구조가 중심입니다."
  },
  스위스: {
    coachName: "Murat Yakin",
    formationSummary: "3-4-2-1 또는 4-2-3-1",
    tacticsSummary: "조직적인 수비 간격과 경험 많은 중원을 바탕으로 템포를 조절하고, 측면과 세트피스에서 득점을 노립니다."
  },
  브라질: {
    coachName: "Carlo Ancelotti",
    formationSummary: "4-3-3",
    tacticsSummary: "전방 개인 기량과 유연한 중원 배치를 살리며, 공을 잃은 직후 압박과 빠른 측면 전개를 결합합니다."
  },
  모로코: {
    coachName: "Mohamed Ouahbi",
    formationSummary: "4-3-3",
    tacticsSummary: "강한 수비 블록과 측면 전환을 바탕으로 하며, 풀백과 윙어의 빠른 전진이 공격의 출발점입니다."
  },
  아이티: {
    coachName: "Sébastien Migné",
    formationSummary: "4-2-3-1",
    tacticsSummary: "중앙을 단단히 막고 빠른 공격수의 뒷공간 침투를 노리는 전환 중심 운영입니다."
  },
  스코틀랜드: {
    coachName: "Steve Clarke",
    formationSummary: "3-4-2-1 또는 3-5-2",
    tacticsSummary: "백3와 윙백을 활용해 수비 안정성을 확보하고, 세트피스와 두 번째 볼 경합에서 찬스를 만듭니다."
  },
  미국: {
    coachName: "Mauricio Pochettino",
    formationSummary: "4-2-3-1 또는 4-3-3",
    tacticsSummary: "전방 압박과 빠른 공격 전환을 중시하며, 역동적인 미드필더 라인으로 상대 빌드업을 흔듭니다."
  },
  파라과이: {
    coachName: "Gustavo Alfaro",
    formationSummary: "4-2-3-1 또는 4-4-2",
    tacticsSummary: "낮고 단단한 수비 블록, 강한 경합, 세트피스를 앞세우는 실리적인 경기 운영이 특징입니다."
  },
  호주: {
    coachName: "Tony Popovic",
    formationSummary: "4-2-3-1",
    tacticsSummary: "피지컬 경합과 세트피스를 적극 활용하고, 압박 강도를 조절하며 안정적인 수비 전환을 우선합니다."
  },
  튀르키예: {
    coachName: "Vincenzo Montella",
    formationSummary: "4-2-3-1",
    tacticsSummary: "공격형 미드필더의 창의성과 측면 연계를 살리며, 공을 소유할 때 라인을 높게 유지합니다."
  },
  독일: {
    coachName: "Julian Nagelsmann",
    formationSummary: "4-2-3-1 또는 4-3-3",
    tacticsSummary: "하프스페이스 점유, 빠른 재압박, 유동적인 2선 움직임으로 상대 수비 간격을 흔듭니다."
  },
  퀴라소: {
    coachName: "Dick Advocaat",
    formationSummary: "4-2-3-1",
    tacticsSummary: "경험 많은 수비 조직을 바탕으로 실점을 줄이고, 역습 상황에서 전방 숫자를 빠르게 늘립니다."
  },
  코트디부아르: {
    coachName: "Emerse Faé",
    formationSummary: "4-3-3",
    tacticsSummary: "강한 신체 능력과 측면 돌파를 활용하며, 중원 압박 후 빠른 직선 공격으로 전환합니다."
  },
  에콰도르: {
    coachName: "Sebastián Beccacece",
    formationSummary: "4-2-3-1 또는 3-4-2-1",
    tacticsSummary: "활동량 높은 중원과 전진 압박을 기반으로 하며, 공수 전환 속도를 높여 상대를 압박합니다."
  },
  네덜란드: {
    coachName: "Ronald Koeman",
    formationSummary: "4-3-3 또는 3-4-1-2",
    tacticsSummary: "후방 빌드업과 측면 전개를 중시하고, 상황에 따라 백3와 백4를 오가며 수적 우위를 만듭니다."
  },
  일본: {
    coachName: "Hajime Moriyasu",
    formationSummary: "4-2-3-1 또는 3-4-2-1",
    tacticsSummary: "빠른 패스 템포와 전환 압박이 강점이며, 2선 자원의 위치 교환으로 박스 근처 공간을 만듭니다."
  },
  스웨덴: {
    coachName: "Graham Potter",
    formationSummary: "4-4-2 또는 4-2-3-1",
    tacticsSummary: "조직적인 라인 관리와 유연한 위치 교환을 섞고, 제공권과 측면 크로스를 동시에 활용합니다."
  },
  튀니지: {
    coachName: "Sabri Lamouchi",
    formationSummary: "4-3-3 또는 4-2-3-1",
    tacticsSummary: "균형 잡힌 수비 블록에서 출발해 빠른 측면 공격과 세트피스로 득점 기회를 만듭니다."
  },
  벨기에: {
    coachName: "Rudi Garcia",
    formationSummary: "4-2-3-1 또는 3-4-2-1",
    tacticsSummary: "2선 창의성과 박스 근처 패스 연결을 살리며, 경기 흐름에 따라 점유와 전환을 조절합니다."
  },
  이집트: {
    coachName: "Hossam Hassan",
    formationSummary: "4-3-3",
    tacticsSummary: "측면 에이스를 중심으로 빠른 역습을 전개하고, 수비 시에는 간격을 좁혀 중앙 침투를 제한합니다."
  },
  이란: {
    coachName: "Amir Ghalenoei",
    formationSummary: "4-2-3-1",
    tacticsSummary: "강한 수비 조직과 직접적인 전진 패스를 바탕으로 하며, 세트피스와 전방 타깃 활용도가 높습니다."
  },
  뉴질랜드: {
    coachName: "Darren Bazeley",
    formationSummary: "4-3-3 또는 4-2-3-1",
    tacticsSummary: "피지컬 수비와 빠른 측면 전개를 조합하고, 세트피스 상황에서 제공권을 적극 활용합니다."
  },
  스페인: {
    coachName: "Luis de la Fuente",
    formationSummary: "4-3-3",
    tacticsSummary: "짧은 패스와 점유를 바탕으로 상대를 끌어내고, 윙어의 일대일과 하프스페이스 침투를 사용합니다."
  },
  카보베르데: {
    coachName: "Bubista",
    formationSummary: "4-3-3",
    tacticsSummary: "기동력 있는 전방 자원을 활용해 빠르게 전환하고, 중원 압박으로 상대 빌드업을 방해합니다."
  },
  사우디아라비아: {
    coachName: "Georgios Donis",
    formationSummary: "4-2-3-1",
    tacticsSummary: "짧은 패스 빌드업과 측면 공격을 결합하고, 수비 전환 시 미드필더 라인을 빠르게 좁힙니다."
  },
  우루과이: {
    coachName: "Marcelo Bielsa",
    formationSummary: "4-3-3",
    tacticsSummary: "높은 압박, 빠른 전환, 넓은 측면 사용을 앞세우며 경기 내내 강한 활동량을 요구합니다."
  },
  프랑스: {
    coachName: "Didier Deschamps",
    formationSummary: "4-2-3-1 또는 4-3-3",
    tacticsSummary: "수비 균형을 유지하면서 전방 개인 능력과 빠른 역습으로 결정적인 장면을 만듭니다."
  },
  세네갈: {
    coachName: "Pape Thiaw",
    formationSummary: "4-3-3",
    tacticsSummary: "강한 신체 능력과 속도를 바탕으로 넓게 공격하고, 중원 압박 후 빠른 전환을 노립니다."
  },
  이라크: {
    coachName: "Graham Arnold",
    formationSummary: "4-2-3-1",
    tacticsSummary: "조직적인 수비와 빠른 역습을 중시하며, 미드필더의 압박 강도로 경기 흐름을 조절합니다."
  },
  노르웨이: {
    coachName: "Ståle Solbakken",
    formationSummary: "4-3-3",
    tacticsSummary: "전방 타깃과 침투형 2선을 연결하고, 측면 크로스와 빠른 전환으로 박스 안 기회를 만듭니다."
  },
  아르헨티나: {
    coachName: "Lionel Scaloni",
    formationSummary: "4-3-3 또는 4-4-2",
    tacticsSummary: "유연한 중원 조합과 짧은 연계를 바탕으로 템포를 조절하고, 전방 창의성을 살리는 운영입니다."
  },
  알제리: {
    coachName: "Vladimir Petković",
    formationSummary: "4-3-3 또는 4-2-3-1",
    tacticsSummary: "기술적인 측면 공격과 전방 압박을 섞으며, 빠른 전환 상황에서 결정력을 노립니다."
  },
  오스트리아: {
    coachName: "Ralf Rangnick",
    formationSummary: "4-2-2-2 또는 4-2-3-1",
    tacticsSummary: "강도 높은 전방 압박과 빠른 세로 패스가 핵심이며, 공을 잃은 직후 회수 속도를 높입니다."
  },
  요르단: {
    coachName: "Jamal Sellami",
    formationSummary: "3-4-3 또는 5-4-1",
    tacticsSummary: "수비 숫자를 안정적으로 두고 측면 전환과 역습으로 득점 장면을 만드는 운영이 많습니다."
  },
  포르투갈: {
    coachName: "Roberto Martínez",
    formationSummary: "4-3-3",
    tacticsSummary: "점유와 측면 공격을 동시에 활용하고, 공격진의 위치 교환으로 박스 근처에서 수적 우위를 만듭니다."
  },
  DR콩고: {
    coachName: "Sébastien Desabre",
    formationSummary: "4-2-3-1",
    tacticsSummary: "신체 능력과 빠른 전환을 앞세우며, 압박 이후 넓은 공간으로 공격을 전개합니다."
  },
  우즈베키스탄: {
    coachName: "Fabio Cannavaro",
    formationSummary: "3-4-2-1 또는 5-3-2",
    tacticsSummary: "수비 안정성을 우선하면서 윙백 전진과 빠른 전환으로 공격 숫자를 늘립니다."
  },
  콜롬비아: {
    coachName: "Néstor Lorenzo",
    formationSummary: "4-2-3-1",
    tacticsSummary: "2선 창의성과 측면 돌파를 살리고, 수비 시에는 중원 간격을 좁혀 역습 출발점을 만듭니다."
  },
  잉글랜드: {
    coachName: "Thomas Tuchel",
    formationSummary: "4-2-3-1 또는 3-4-2-1",
    tacticsSummary: "강한 2선 자원을 활용해 중앙과 측면을 번갈아 공략하고, 경기 상황에 따라 백3 전환도 가능합니다."
  },
  크로아티아: {
    coachName: "Zlatko Dalić",
    formationSummary: "4-3-3",
    tacticsSummary: "경험 많은 중원이 템포를 관리하고, 후방 안정성과 세트피스, 측면 전개를 균형 있게 사용합니다."
  },
  가나: {
    coachName: "Carlos Queiroz",
    formationSummary: "4-2-3-1",
    tacticsSummary: "수비 안정과 빠른 역습을 우선하며, 전방의 힘과 측면 속도를 이용해 직접적인 공격을 만듭니다."
  },
  파나마: {
    coachName: "Thomas Christiansen",
    formationSummary: "5-4-1 또는 3-4-3",
    tacticsSummary: "압축된 수비 블록으로 실점을 줄이고, 측면 전환과 세트피스로 제한된 기회를 살립니다."
  }
};

export const teamVerificationRequirements: VerificationRequirement[] = [
  {
    title: "선수 명단",
    status: "공식 확인",
    description: "FIFA 최종 명단 공개 기준으로 모든 참가국의 스쿼드 등록 여부를 표시합니다.",
    requiredSources: ["FIFA 최종 명단", "각국 축구협회", "공식 경기 리포트"]
  },
  {
    title: "감독 정보",
    status: "공식 확인",
    description: "2026 FIFA World Cup squads에 등재된 각 팀 감독명을 표시합니다.",
    requiredSources: ["FIFA 최종 명단", "각국 축구협회 공식 홈페이지"]
  },
  {
    title: "포메이션",
    status: "분석 참고",
    description: "기본 전형은 감독 성향과 최근 대표팀 운영 방식을 기준으로 표시하며, 경기별 선발표가 나오면 갱신합니다.",
    requiredSources: ["공식 경기 라인업", "FIFA 공식 경기 리포트"]
  },
  {
    title: "전술 분석",
    status: "분석 참고",
    description: "팀별 전술 메모는 확정 라인업이 아니라 운영 성향 요약입니다.",
    requiredSources: ["감독 인터뷰", "공식 경기 리포트", "신뢰 가능한 전술 분석 기사"]
  },
  {
    title: "예상 라인업",
    status: "확인 필요",
    description: "경기별 선발 명단은 킥오프 전 공식 발표가 나와야 확정 표시합니다.",
    requiredSources: ["FIFA 매치센터", "공식 경기 리포트"]
  },
  {
    title: "부상·징계 정보",
    status: "확인 필요",
    description: "경고, 퇴장, 부상 교체, 징계 정보는 경기별 공식 리포트 기준으로 갱신합니다.",
    requiredSources: ["FIFA 징계 리포트", "각국 축구협회 발표", "공식 경기 기록"]
  }
];

export const teamVerificationData: TeamVerificationData[] = worldCupGroupSlots.map((slot) => {
  const teamName = slot.teamName ?? "국가명 확인 전";
  const profile = profileByTeamName[teamName] ?? {
    coachName: "공식 명단 확인 필요",
    formationSummary: "경기별 공식 라인업 확인 필요",
    tacticsSummary: "공식 출처 확인 후 전술 메모를 표시합니다."
  };

  return {
    teamName,
    groupId: slot.groupId,
    groupPosition: slot.position,
    coachName: profile.coachName,
    squadPlayerCount: 26,
    squadStatus: "공식 확인",
    coachStatus: "공식 확인",
    formationStatus: "분석 참고",
    tacticsStatus: "분석 참고",
    lineupStatus: "확인 필요",
    injurySuspensionStatus: "확인 필요",
    squadSummary: "FIFA 최종 명단 공개 기준 26명 스쿼드 등록",
    formationSummary: profile.formationSummary,
    tacticsSummary: profile.tacticsSummary,
    lineupSummary: "경기별 선발 11명은 FIFA 매치센터 또는 공식 경기 리포트 공개 후 확정 표시",
    riskSummary: "부상·징계·경고 누적은 경기별 공식 리포트 확인 후 반영",
    squadSourceName,
    squadSourceUrl,
    coachSourceName: squadSourceName,
    coachSourceUrl: squadSourceUrl,
    formationSourceName: "감독 성향과 최근 대표팀 운영 방식 기준 분석 메모",
    formationSourceUrl: null,
    analysisSourceName: "전술/포메이션은 확정 정보가 아닌 분석 참고",
    analysisSourceUrl: null,
    lastUpdated: verifiedAt,
    notes: [
      `${profile.coachName} 감독 체제로 등록된 최종 명단 기준입니다.`,
      "선수 명단과 감독은 공개 최종 명단 출처를 기준으로 표시합니다.",
      "전술과 포메이션은 경기별 공식 선발표가 나오면 실제 라인업 기준으로 갱신해야 합니다."
    ]
  };
});

export function getTeamVerificationData(teamName: string) {
  return teamVerificationData.find((team) => team.teamName === teamName) ?? null;
}

import type { WorldCupGroupSlot } from "@/types/football";

const verifiedAt = "2026-06-14";
const fifaMatchScheduleUrl = "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/match-schedule";

const groupSourceUrls: Record<string, string> = {
  A: fifaMatchScheduleUrl,
  B: fifaMatchScheduleUrl,
  C: fifaMatchScheduleUrl,
  D: fifaMatchScheduleUrl,
  E: fifaMatchScheduleUrl,
  F: fifaMatchScheduleUrl,
  G: fifaMatchScheduleUrl,
  H: fifaMatchScheduleUrl,
  I: fifaMatchScheduleUrl,
  J: fifaMatchScheduleUrl,
  K: fifaMatchScheduleUrl,
  L: fifaMatchScheduleUrl
};

const flagImageCodeByTeamCode: Record<string, string> = {
  MEX: "mx",
  RSA: "za",
  KOR: "kr",
  CZE: "cz",
  CAN: "ca",
  BIH: "ba",
  QAT: "qa",
  SUI: "ch",
  BRA: "br",
  MAR: "ma",
  HAI: "ht",
  SCO: "gb-sct",
  USA: "us",
  PAR: "py",
  AUS: "au",
  TUR: "tr",
  GER: "de",
  CUW: "cw",
  CIV: "ci",
  ECU: "ec",
  NED: "nl",
  JPN: "jp",
  SWE: "se",
  TUN: "tn",
  BEL: "be",
  EGY: "eg",
  IRN: "ir",
  NZL: "nz",
  ESP: "es",
  CPV: "cv",
  KSA: "sa",
  URU: "uy",
  FRA: "fr",
  SEN: "sn",
  IRQ: "iq",
  NOR: "no",
  ARG: "ar",
  ALG: "dz",
  AUT: "at",
  JOR: "jo",
  POR: "pt",
  COD: "cd",
  UZB: "uz",
  COL: "co",
  ENG: "gb-eng",
  CRO: "hr",
  GHA: "gh",
  PAN: "pa"
};

function getFlagImageUrl(teamCode: string) {
  return `https://flagcdn.com/w40/${flagImageCodeByTeamCode[teamCode]}.png`;
}

type SlotSeed = {
  groupId: WorldCupGroupSlot["groupId"];
  position: WorldCupGroupSlot["position"];
  teamName: string;
  teamNameEn: string;
  teamCode: string;
  flagEmoji: string;
};

const slots: SlotSeed[] = [
  { groupId: "A", position: 1, teamName: "멕시코", teamNameEn: "Mexico", teamCode: "MEX", flagEmoji: "🇲🇽" },
  { groupId: "A", position: 2, teamName: "남아프리카공화국", teamNameEn: "South Africa", teamCode: "RSA", flagEmoji: "🇿🇦" },
  { groupId: "A", position: 3, teamName: "대한민국", teamNameEn: "South Korea", teamCode: "KOR", flagEmoji: "🇰🇷" },
  { groupId: "A", position: 4, teamName: "체코", teamNameEn: "Czechia", teamCode: "CZE", flagEmoji: "🇨🇿" },
  { groupId: "B", position: 1, teamName: "캐나다", teamNameEn: "Canada", teamCode: "CAN", flagEmoji: "🇨🇦" },
  { groupId: "B", position: 2, teamName: "보스니아 헤르체고비나", teamNameEn: "Bosnia and Herzegovina", teamCode: "BIH", flagEmoji: "🇧🇦" },
  { groupId: "B", position: 3, teamName: "카타르", teamNameEn: "Qatar", teamCode: "QAT", flagEmoji: "🇶🇦" },
  { groupId: "B", position: 4, teamName: "스위스", teamNameEn: "Switzerland", teamCode: "SUI", flagEmoji: "🇨🇭" },
  { groupId: "C", position: 1, teamName: "브라질", teamNameEn: "Brazil", teamCode: "BRA", flagEmoji: "🇧🇷" },
  { groupId: "C", position: 2, teamName: "모로코", teamNameEn: "Morocco", teamCode: "MAR", flagEmoji: "🇲🇦" },
  { groupId: "C", position: 3, teamName: "아이티", teamNameEn: "Haiti", teamCode: "HAI", flagEmoji: "🇭🇹" },
  { groupId: "C", position: 4, teamName: "스코틀랜드", teamNameEn: "Scotland", teamCode: "SCO", flagEmoji: "🏴" },
  { groupId: "D", position: 1, teamName: "미국", teamNameEn: "United States", teamCode: "USA", flagEmoji: "🇺🇸" },
  { groupId: "D", position: 2, teamName: "파라과이", teamNameEn: "Paraguay", teamCode: "PAR", flagEmoji: "🇵🇾" },
  { groupId: "D", position: 3, teamName: "호주", teamNameEn: "Australia", teamCode: "AUS", flagEmoji: "🇦🇺" },
  { groupId: "D", position: 4, teamName: "튀르키예", teamNameEn: "Turkey", teamCode: "TUR", flagEmoji: "🇹🇷" },
  { groupId: "E", position: 1, teamName: "독일", teamNameEn: "Germany", teamCode: "GER", flagEmoji: "🇩🇪" },
  { groupId: "E", position: 2, teamName: "퀴라소", teamNameEn: "Curacao", teamCode: "CUW", flagEmoji: "🇨🇼" },
  { groupId: "E", position: 3, teamName: "코트디부아르", teamNameEn: "Ivory Coast", teamCode: "CIV", flagEmoji: "🇨🇮" },
  { groupId: "E", position: 4, teamName: "에콰도르", teamNameEn: "Ecuador", teamCode: "ECU", flagEmoji: "🇪🇨" },
  { groupId: "F", position: 1, teamName: "네덜란드", teamNameEn: "Netherlands", teamCode: "NED", flagEmoji: "🇳🇱" },
  { groupId: "F", position: 2, teamName: "일본", teamNameEn: "Japan", teamCode: "JPN", flagEmoji: "🇯🇵" },
  { groupId: "F", position: 3, teamName: "스웨덴", teamNameEn: "Sweden", teamCode: "SWE", flagEmoji: "🇸🇪" },
  { groupId: "F", position: 4, teamName: "튀니지", teamNameEn: "Tunisia", teamCode: "TUN", flagEmoji: "🇹🇳" },
  { groupId: "G", position: 1, teamName: "벨기에", teamNameEn: "Belgium", teamCode: "BEL", flagEmoji: "🇧🇪" },
  { groupId: "G", position: 2, teamName: "이집트", teamNameEn: "Egypt", teamCode: "EGY", flagEmoji: "🇪🇬" },
  { groupId: "G", position: 3, teamName: "이란", teamNameEn: "Iran", teamCode: "IRN", flagEmoji: "🇮🇷" },
  { groupId: "G", position: 4, teamName: "뉴질랜드", teamNameEn: "New Zealand", teamCode: "NZL", flagEmoji: "🇳🇿" },
  { groupId: "H", position: 1, teamName: "스페인", teamNameEn: "Spain", teamCode: "ESP", flagEmoji: "🇪🇸" },
  { groupId: "H", position: 2, teamName: "카보베르데", teamNameEn: "Cape Verde", teamCode: "CPV", flagEmoji: "🇨🇻" },
  { groupId: "H", position: 3, teamName: "사우디아라비아", teamNameEn: "Saudi Arabia", teamCode: "KSA", flagEmoji: "🇸🇦" },
  { groupId: "H", position: 4, teamName: "우루과이", teamNameEn: "Uruguay", teamCode: "URU", flagEmoji: "🇺🇾" },
  { groupId: "I", position: 1, teamName: "프랑스", teamNameEn: "France", teamCode: "FRA", flagEmoji: "🇫🇷" },
  { groupId: "I", position: 2, teamName: "세네갈", teamNameEn: "Senegal", teamCode: "SEN", flagEmoji: "🇸🇳" },
  { groupId: "I", position: 3, teamName: "이라크", teamNameEn: "Iraq", teamCode: "IRQ", flagEmoji: "🇮🇶" },
  { groupId: "I", position: 4, teamName: "노르웨이", teamNameEn: "Norway", teamCode: "NOR", flagEmoji: "🇳🇴" },
  { groupId: "J", position: 1, teamName: "아르헨티나", teamNameEn: "Argentina", teamCode: "ARG", flagEmoji: "🇦🇷" },
  { groupId: "J", position: 2, teamName: "알제리", teamNameEn: "Algeria", teamCode: "ALG", flagEmoji: "🇩🇿" },
  { groupId: "J", position: 3, teamName: "오스트리아", teamNameEn: "Austria", teamCode: "AUT", flagEmoji: "🇦🇹" },
  { groupId: "J", position: 4, teamName: "요르단", teamNameEn: "Jordan", teamCode: "JOR", flagEmoji: "🇯🇴" },
  { groupId: "K", position: 1, teamName: "포르투갈", teamNameEn: "Portugal", teamCode: "POR", flagEmoji: "🇵🇹" },
  { groupId: "K", position: 2, teamName: "DR콩고", teamNameEn: "DR Congo", teamCode: "COD", flagEmoji: "🇨🇩" },
  { groupId: "K", position: 3, teamName: "우즈베키스탄", teamNameEn: "Uzbekistan", teamCode: "UZB", flagEmoji: "🇺🇿" },
  { groupId: "K", position: 4, teamName: "콜롬비아", teamNameEn: "Colombia", teamCode: "COL", flagEmoji: "🇨🇴" },
  { groupId: "L", position: 1, teamName: "잉글랜드", teamNameEn: "England", teamCode: "ENG", flagEmoji: "🏴" },
  { groupId: "L", position: 2, teamName: "크로아티아", teamNameEn: "Croatia", teamCode: "CRO", flagEmoji: "🇭🇷" },
  { groupId: "L", position: 3, teamName: "가나", teamNameEn: "Ghana", teamCode: "GHA", flagEmoji: "🇬🇭" },
  { groupId: "L", position: 4, teamName: "파나마", teamNameEn: "Panama", teamCode: "PAN", flagEmoji: "🇵🇦" }
];

export const worldCupGroupSlots: WorldCupGroupSlot[] = slots.map((slot) => ({
  ...slot,
  flagImageUrl: getFlagImageUrl(slot.teamCode),
  flagAlt: `${slot.teamName} 국기`,
  sourceType: "공식 출처 데이터",
  sourceName: "FIFA World Cup 26 match schedule",
  sourceUrl: groupSourceUrls[slot.groupId],
  lastUpdated: verifiedAt,
  isOfficial: true,
  verificationStatus: "공식 확인",
  confidence: "공식"
}));

export const groupDataNotice =
  "조 편성 데이터는 FIFA World Cup 26 경기 일정의 조별 편성을 기준으로 표시합니다. football-data.org API에서 실제 경기·순위 데이터가 제공되면 별도 실제 데이터로 반영합니다.";

export function getGroupSlotLabel(slot: Pick<WorldCupGroupSlot, "groupId" | "position">) {
  return `${slot.groupId}조 ${slot.position}번 자리`;
}

export function isConfirmedGroupSlot(slot: WorldCupGroupSlot) {
  return Boolean(
    slot.teamName &&
      slot.sourceName &&
      slot.sourceUrl &&
      slot.lastUpdated &&
      ["공식 확인", "API 확인", "수동 확인"].includes(slot.verificationStatus)
  );
}

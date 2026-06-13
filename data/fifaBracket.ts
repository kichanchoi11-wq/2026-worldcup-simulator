import type { BracketSlot } from "@/types/bracket";

export const officialRoundOf32Slots: BracketSlot[] = [
  { matchId: 73, round: "32강", teamASeed: "2A", teamBSeed: "2B", label: "A조 2위 vs B조 2위" },
  { matchId: 74, round: "32강", teamASeed: "1E", teamBSeed: "3A/3B/3C/3D/3F", label: "E조 1위 vs A/B/C/D/F조 3위 중 배정팀" },
  { matchId: 75, round: "32강", teamASeed: "1F", teamBSeed: "2C", label: "F조 1위 vs C조 2위" },
  { matchId: 76, round: "32강", teamASeed: "1C", teamBSeed: "2F", label: "C조 1위 vs F조 2위" },
  { matchId: 77, round: "32강", teamASeed: "1I", teamBSeed: "3C/3D/3F/3G/3H", label: "I조 1위 vs C/D/F/G/H조 3위 중 배정팀" },
  { matchId: 78, round: "32강", teamASeed: "2E", teamBSeed: "2I", label: "E조 2위 vs I조 2위" },
  { matchId: 79, round: "32강", teamASeed: "1A", teamBSeed: "3C/3E/3F/3H/3I", label: "A조 1위 vs C/E/F/H/I조 3위 중 배정팀" },
  { matchId: 80, round: "32강", teamASeed: "1L", teamBSeed: "3E/3H/3I/3J/3K", label: "L조 1위 vs E/H/I/J/K조 3위 중 배정팀" },
  { matchId: 81, round: "32강", teamASeed: "1D", teamBSeed: "3B/3E/3F/3I/3J", label: "D조 1위 vs B/E/F/I/J조 3위 중 배정팀" },
  { matchId: 82, round: "32강", teamASeed: "1G", teamBSeed: "3A/3E/3H/3I/3J", label: "G조 1위 vs A/E/H/I/J조 3위 중 배정팀" },
  { matchId: 83, round: "32강", teamASeed: "2K", teamBSeed: "2L", label: "K조 2위 vs L조 2위" },
  { matchId: 84, round: "32강", teamASeed: "1H", teamBSeed: "2J", label: "H조 1위 vs J조 2위" },
  { matchId: 85, round: "32강", teamASeed: "1B", teamBSeed: "3E/3F/3G/3I/3J", label: "B조 1위 vs E/F/G/I/J조 3위 중 배정팀" },
  { matchId: 86, round: "32강", teamASeed: "1J", teamBSeed: "2H", label: "J조 1위 vs H조 2위" },
  { matchId: 87, round: "32강", teamASeed: "1K", teamBSeed: "3D/3E/3I/3J/3L", label: "K조 1위 vs D/E/I/J/L조 3위 중 배정팀" },
  { matchId: 88, round: "32강", teamASeed: "2D", teamBSeed: "2G", label: "D조 2위 vs G조 2위" }
];

export const officialRoundOf16Slots: BracketSlot[] = [
  { matchId: 89, round: "16강", teamASeed: "W74", teamBSeed: "W77", label: "74번 경기 승자 vs 77번 경기 승자" },
  { matchId: 90, round: "16강", teamASeed: "W73", teamBSeed: "W75", label: "73번 경기 승자 vs 75번 경기 승자" },
  { matchId: 91, round: "16강", teamASeed: "W76", teamBSeed: "W78", label: "76번 경기 승자 vs 78번 경기 승자" },
  { matchId: 92, round: "16강", teamASeed: "W79", teamBSeed: "W80", label: "79번 경기 승자 vs 80번 경기 승자" },
  { matchId: 93, round: "16강", teamASeed: "W83", teamBSeed: "W84", label: "83번 경기 승자 vs 84번 경기 승자" },
  { matchId: 94, round: "16강", teamASeed: "W81", teamBSeed: "W82", label: "81번 경기 승자 vs 82번 경기 승자" },
  { matchId: 95, round: "16강", teamASeed: "W86", teamBSeed: "W88", label: "86번 경기 승자 vs 88번 경기 승자" },
  { matchId: 96, round: "16강", teamASeed: "W85", teamBSeed: "W87", label: "85번 경기 승자 vs 87번 경기 승자" }
];

export const officialQuarterFinalSlots: BracketSlot[] = [
  { matchId: 97, round: "8강", teamASeed: "W89", teamBSeed: "W90", label: "89번 경기 승자 vs 90번 경기 승자" },
  { matchId: 98, round: "8강", teamASeed: "W93", teamBSeed: "W94", label: "93번 경기 승자 vs 94번 경기 승자" },
  { matchId: 99, round: "8강", teamASeed: "W91", teamBSeed: "W92", label: "91번 경기 승자 vs 92번 경기 승자" },
  { matchId: 100, round: "8강", teamASeed: "W95", teamBSeed: "W96", label: "95번 경기 승자 vs 96번 경기 승자" }
];

export const officialSemiFinalSlots: BracketSlot[] = [
  { matchId: 101, round: "4강", teamASeed: "W97", teamBSeed: "W98", label: "97번 경기 승자 vs 98번 경기 승자" },
  { matchId: 102, round: "4강", teamASeed: "W99", teamBSeed: "W100", label: "99번 경기 승자 vs 100번 경기 승자" }
];

export const officialThirdPlaceMatch: BracketSlot = {
  matchId: 103,
  round: "3·4위전",
  teamASeed: "L101",
  teamBSeed: "L102",
  label: "101번 경기 패자 vs 102번 경기 패자"
};

export const officialFinalMatch: BracketSlot = {
  matchId: 104,
  round: "결승",
  teamASeed: "W101",
  teamBSeed: "W102",
  label: "101번 경기 승자 vs 102번 경기 승자"
};

export const allOfficialBracketSlots: BracketSlot[] = [
  ...officialRoundOf32Slots,
  ...officialRoundOf16Slots,
  ...officialQuarterFinalSlots,
  ...officialSemiFinalSlots,
  officialThirdPlaceMatch,
  officialFinalMatch
];

import type { DisplayBadge, SourceMeta, VerificationConfidence } from "@/types/football";

export type PlayerPosition = "GK" | "DF" | "MF" | "FW" | "확인 필요";
export type Availability = "출전 가능" | "출전 불투명" | "결장" | "확인 필요";
export type SquadStatus = "공식 소집" | "최근 경기 엔트리" | "예상" | "확인 필요" | "제외";

export interface PlayerData extends SourceMeta {
  team: string;
  playerName: string;
  position: PlayerPosition;
  club: string | null;
  squadStatus: SquadStatus;
  availability: Availability;
}

export interface CoachData extends SourceMeta {
  team: string;
  coachName: string | null;
  status: "공식" | "확인 필요" | "표시 금지";
}

export interface FormationData extends SourceMeta {
  team: string;
  match: string | null;
  formation: string | null;
  type: "최근 실제 경기" | "예상" | "확인 필요";
  notes: string;
}

export interface TacticsData extends SourceMeta {
  team: string;
  summary: string | null;
  attackingStyle: string | null;
  defensiveStyle: string | null;
  pressingStyle: string | null;
  buildUpStyle: string | null;
  transitionStyle: string | null;
  setPieceStyle: string | null;
  evidenceMatches: string[];
  uncertainty: string;
}

export interface PlayerStatus extends SourceMeta {
  playerName: string;
  team: string;
  position: PlayerPosition;
  availability: Availability;
  yellowCards: number | null;
  redCards: number | null;
  suspensionStatus: "없음" | "경고 누적 위험" | "징계 결장" | "확인 필요";
  injuryStatus: "정상" | "경미한 부상" | "출전 불투명" | "결장" | "확인 필요";
  fitnessLevel: number | null;
  recentMinutesPlayed: number | null;
  fatigueRisk: "낮음" | "보통" | "높음" | "확인 필요";
}

export interface TeamDataStatus {
  squad: DisplayBadge;
  coach: DisplayBadge;
  formation: DisplayBadge;
  tactics: DisplayBadge;
  lineup: DisplayBadge;
  risk: DisplayBadge;
  lastUpdated: string | null;
  confidence: VerificationConfidence;
}

export interface TeamInformation {
  teamId: string;
  teamName: string;
  group: string;
  flag: string;
  dataStatus: TeamDataStatus;
  coach: CoachData;
  players: PlayerData[];
  formation: FormationData;
  tactics: TacticsData;
  playerStatuses: PlayerStatus[];
  sources: SourceMeta[];
}

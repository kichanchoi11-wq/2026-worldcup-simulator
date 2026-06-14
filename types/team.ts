import type { DisplayBadge, SourceMeta, VerificationConfidence } from "@/types/football";

export type VerificationStatus =
  | "공식 확인"
  | "신뢰도 높음"
  | "분석 참고"
  | "추가 수집 필요"
  | "재검증 필요"
  | "확인 필요"
  | "표시 불가";

export type PlayerPosition = "GK" | "DF" | "MF" | "FW" | "확인 필요";
export type Availability = "출전 가능" | "출전 불투명" | "결장" | "징계 결장" | "출전 금지" | "확인 필요";
export type SquadStatus = "공식 소집" | "최근 경기 엔트리" | "예상" | "확인 필요" | "제외";
export type PlayerRole = "핵심 선수" | "주전 후보" | "주목 선수" | "백업" | "예상 명단" | "확인 필요";

export interface PlayerData extends SourceMeta {
  playerId: string;
  teamId: string;
  teamName: string;
  playerName: string;
  position: PlayerPosition;
  club: string | null;
  role: PlayerRole;
  squadStatus: SquadStatus;
  availability: Availability;
  isKeyPlayer: boolean;
  isNotablePlayer: boolean;
  notes: string;
  yellowCards: number | null;
  redCards: number | null;
  injuryStatus: "정상" | "경미한 부상" | "출전 불투명" | "결장" | "확인 필요";
  suspensionStatus: "없음" | "경고 누적 위험" | "징계 결장" | "출전 금지" | "확인 필요";
}

export interface CoachData extends SourceMeta {
  teamId: string;
  teamName: string;
  coachName: string | null;
  nationality?: string | null;
  appointedDate?: string | null;
  tacticalNotes?: string | null;
  status: VerificationStatus;
}

export interface FormationPlayer {
  playerId: string;
  playerName: string;
  position: PlayerPosition;
  x: number;
  y: number;
  role?: string | null;
  status: Availability;
}

export interface FormationData extends SourceMeta {
  teamId: string;
  teamName: string;
  formation: string | null;
  matchBasis: string | null;
  players: FormationPlayer[];
  type: "최근 실제 경기" | "예상" | "확인 필요";
  notes: string[];
}

export interface TacticsData extends SourceMeta {
  teamId: string;
  teamName: string;
  summary: string | null;
  attackingStyle: string | null;
  defensiveStyle: string | null;
  pressingStyle: string | null;
  buildUpStyle: string | null;
  transitionStyle: string | null;
  setPieceStyle: string | null;
  strengths: string[];
  weaknesses: string[];
  evidenceMatches: string[];
  uncertainty: string;
}

export interface PlayerStatus extends SourceMeta {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  position: PlayerPosition;
  availability: Availability;
  yellowCards: number | null;
  redCards: number | null;
  suspensionStatus: "없음" | "경고 누적 위험" | "징계 결장" | "출전 금지" | "확인 필요";
  injuryStatus: "정상" | "경미한 부상" | "출전 불투명" | "결장" | "확인 필요";
  fitnessLevel: number | null;
  recentMinutesPlayed: number | null;
  fatigueRisk: "낮음" | "보통" | "높음" | "확인 필요";
}

export interface NotablePlayerAnalysis extends SourceMeta {
  playerId: string;
  playerName: string;
  position: PlayerPosition;
  club: string | null;
  reason: string;
  matchImpact: string;
  koreaRisk: "낮음" | "보통" | "높음" | "확인 필요";
  variables: string[];
}

export interface KoreaStrategyData {
  confidence: VerificationConfidence;
  notice: string;
  strengths: string[];
  weaknesses: string[];
  pressurePlan: string;
  defensivePlan: string;
  counterPlan: string;
  setPiecePlan: string;
  riskWindow: string;
  winScenario: string;
  avoidScenario: string;
}

export interface TeamDataStatus {
  squad: DisplayBadge;
  coach: DisplayBadge;
  formation: DisplayBadge;
  tactics: DisplayBadge;
  lineup: DisplayBadge;
  risk: DisplayBadge;
  cards: DisplayBadge;
  fitness: DisplayBadge;
  recentLineup: DisplayBadge;
  lastUpdated: string | null;
  confidence: VerificationConfidence;
}

export interface TeamVerificationData {
  teamId: string;
  teamName: string;
  teamNameEn: string;
  teamCode: string | null;
  groupId: string | null;
  groupPosition: number | null;
  confederation?: string | null;
  powerIndex?: string | null;
  recentAchievements?: string[];
  flag: string;
  flagImageUrl?: string | null;
  flagAlt?: string | null;
  dataStatus: TeamDataStatus;
  coach: CoachData;
  players: PlayerData[];
  formation: FormationData;
  expectedLineup: FormationData;
  tactics: TacticsData;
  notablePlayers: NotablePlayerAnalysis[];
  playerStatuses: PlayerStatus[];
  koreaStrategy: KoreaStrategyData;
  sources: SourceMeta[];
  lastUpdated: string | null;
  notes: string[];
}

export interface VerificationRequirement {
  title: string;
  status: VerificationStatus;
  description: string;
  requiredSources: string[];
}

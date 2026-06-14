import type { DataSourceType, SourceMeta } from "@/types/football";
import type { Availability, FormationData, PlayerPosition } from "@/types/team";
import type { DataSource, EvidenceConfidence } from "@/types/team";

export interface MatchDetailData {
  matchId: string | number;
  competition: string;
  round: string;
  groupId?: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  dateTime: string | null;
  stadium: string | null;
  status: "예정" | "진행 중" | "종료" | "연기" | "취소" | "확인 필요";
  score: {
    home: number | null;
    away: number | null;
  };
  sourceType: DataSourceType;
  sourceName: string | null;
  sourceUrl: string | null;
  lastUpdated: string | null;
}

export interface MatchPlayerStatus extends Partial<SourceMeta> {
  matchId: string | number;
  teamId: string;
  playerId: string;
  playerName: string;
  position: PlayerPosition;
  expectedStarter: boolean | null;
  availability: Availability;
  yellowCards: number | null;
  redCards: number | null;
  suspensionStatus: "없음" | "경고 누적 위험" | "징계 결장" | "출전 금지" | "확인 필요";
  injuryStatus: "정상" | "경미한 부상" | "출전 불투명" | "결장" | "확인 필요";
  fatigueRisk: "낮음" | "보통" | "높음" | "확인 필요";
  notes: string[];
}

export interface MatchPredictionData {
  homeWinProbability: number | null;
  drawProbability: number | null;
  awayWinProbability: number | null;
  expectedScore: string | null;
  confidence: "공식" | "공식 확인" | "신뢰도 높음" | "분석 참고" | "예상" | "추가 수집 필요" | "확인 필요";
  variables: string[];
  uncertainty: string;
  lastUpdated: string | null;
}

export interface MatchPageData {
  detail: MatchDetailData;
  homeFormation: FormationData;
  awayFormation: FormationData;
  expectedPlayers: MatchPlayerStatus[];
  suspendedPlayers: MatchPlayerStatus[];
  injuryPlayers: MatchPlayerStatus[];
  cardRiskPlayers: MatchPlayerStatus[];
  prediction: MatchPredictionData;
  koreaAnalysis: {
    applies: boolean;
    notice: string;
    points: string[];
  };
  sources: SourceMeta[];
}

export interface MatchReview {
  matchId: string | number;
  homeTeamName: string;
  awayTeamName: string;
  finalScore: {
    home: number;
    away: number;
  };
  matchSummary: string;
  keyMoments: string[];
  tacticalReview: {
    homeTeam: string;
    awayTeam: string;
  };
  formationChanges: string[];
  substitutionImpact: string[];
  playerHighlights: string[];
  cardAndInjuryImpact: string[];
  fatigueImpact: string[];
  predictionComparison: {
    predictedWinner: string | null;
    actualWinner: string | null;
    wasPredictionCorrect: boolean | null;
    notes: string;
  };
  nextMatchImpact: string[];
  koreaPerspectiveReview?: string | null;
  confidence: EvidenceConfidence;
  sources: DataSource[];
  reviewedAt: string;
}

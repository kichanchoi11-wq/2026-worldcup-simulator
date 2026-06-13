import type { DataSourceType } from "@/types/football";
import type { BracketMatch, BracketTeam } from "@/types/bracket";

export interface PredictedMatch {
  matchId: string;
  group: string | null;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  confidence: "낮음" | "보통" | "높음" | "확인 필요";
  uncertaintyFactors: string[];
}

export interface PredictedStanding {
  team: string;
  group: string;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  winProbability: number | null;
  qualificationProbability: number | null;
  sourceType: "AI 예측 데이터";
}

export interface GroupSimulationData {
  groupPredictions: PredictedMatch[];
  matchPredictions: PredictedMatch[];
  predictedStandings: PredictedStanding[];
  predictedQualifiedTeams: BracketTeam[];
  predictedKnockoutResults: BracketMatch[];
  lastSimulatedAt: string | null;
  source: "AI 시뮬레이션";
  notice: string;
}

export interface UserSimulationData {
  userSelectedResults: PredictedMatch[];
  userSelectedStandings: PredictedStanding[];
  userSelectedBracket: BracketMatch[];
  champion: BracketTeam | null;
  source: "사용자 직접 입력";
}

export interface ScenarioCalculatorData {
  groupRankings: Record<string, BracketTeam[]>;
  thirdPlaceQualifiers: BracketTeam[];
  roundOf32: BracketMatch[];
  roundOf16: BracketMatch[];
  quarterFinals: BracketMatch[];
  semiFinals: BracketMatch[];
  thirdPlaceMatch: BracketMatch | null;
  final: BracketMatch | null;
  champion: BracketTeam | null;
  source: "경우의 수 계산기";
}

export interface TournamentDataSourceOption {
  id: string;
  label: string;
  sourceType: DataSourceType;
  qualifiedTeams: BracketTeam[];
  disabledReason: string | null;
}

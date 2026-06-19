import type { DataSourceType } from "@/types/football";
import type { BracketMatch, BracketTeam, TournamentRound } from "@/types/bracket";

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

export type PredictionDataConfidence =
  | "공식 확인"
  | "신뢰도 높음"
  | "참고 자료"
  | "추정"
  | "확인 필요";

export type PredictionRound = "조별리그" | TournamentRound;

export interface PredictionSourceSummary {
  sourceName: string;
  sourceUrl: string | null;
  lastUpdated: string | null;
  confidence: PredictionDataConfidence;
  notes: string | null;
}

export interface PredictionDataCard {
  id: string;
  title: string;
  value: string;
  confidence: PredictionDataConfidence;
  description: string;
  sourceCount: number;
  items: string[];
  details?: string[];
  missingReasons?: string[];
  dataSources?: string[];
}

export interface PredictionResourceDiagnostic {
  resource: "fixtures" | "events" | "lineups" | "injuries" | "statistics" | "predictions";
  label: string;
  source: string;
  count: number;
  dataQuality: string;
  message: string | null;
  fallbackChain: string[];
  lastUpdated: string | null;
  fixtureCoverage: number;
}

export interface PredictionDataDiagnostics {
  schedule: {
    officialStructureMatches: number;
    apiFixtureMatches: number;
    datedMatches: number;
    venueMatches: number;
    restComputableMatches: number;
    source: string;
    fallbackNotes: string[];
  };
  risk: {
    cardRecords: number;
    apiCardEvents: number;
    injuries: number;
    lineups: number;
    statistics: number;
    predictions: number;
    source: string;
    fallbackNotes: string[];
  };
  resources: PredictionResourceDiagnostic[];
  reflectedData: string[];
  missingData: string[];
  fallbackExplanations: string[];
}

export interface PredictionTeamSnapshot {
  id: string;
  nameKo: string;
  teamCode: string | null;
  group: string | null;
  seed: string | null;
  flag: string;
  flagImageUrl?: string | null;
  flagAlt?: string | null;
  sourceType: DataSourceType;
  strengthScore: number;
  attackScore: number;
  defenseScore: number;
  formScore: number;
  riskScore: number;
  confidence: PredictionDataConfidence;
  coachName: string | null;
  formation: string | null;
  keyPlayers: string[];
  tacticalKeywords: string[];
  strengths: string[];
  weaknesses: string[];
  sourceCount: number;
  dataGaps: string[];
}

export interface MatchPrediction {
  matchId: string | number;
  round: PredictionRound;
  group: string | null;
  label: string;
  teamA: PredictionTeamSnapshot;
  teamB: PredictionTeamSnapshot;
  probabilities: {
    teamAWin: number;
    draw: number | null;
    teamBWin: number;
  };
  expectedScore: {
    teamA: number;
    teamB: number;
  };
  keyFactors: string[];
  riskFactors: string[];
  uncertaintyFactors: string[];
  confidence: PredictionDataConfidence;
  sources: PredictionSourceSummary[];
  predictedWinner: PredictionTeamSnapshot | null;
  bracketSeedNote: string | null;
}

export interface PredictedTournamentStanding {
  team: PredictionTeamSnapshot;
  group: string;
  rank: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  qualificationProbability: number;
  sourceType: "AI 예측 데이터";
}

export interface GroupPrediction {
  group: string;
  predictedMatches: MatchPrediction[];
  predictedStandings: PredictedTournamentStanding[];
  qualifiedTeams: PredictionTeamSnapshot[];
  thirdPlaceCandidate: PredictionTeamSnapshot | null;
  notice: string;
}

export interface TournamentRoundPrediction {
  round: TournamentRound;
  matches: MatchPrediction[];
  notice: string | null;
}

export interface FullTournamentPrediction {
  generatedAt: string;
  source: "AI 시뮬레이션";
  modelVersion: string;
  confidence: PredictionDataConfidence;
  notice: string;
  aiAnalysis?: {
    status: "success" | "partial" | "fallback" | "cache" | "failed";
    provider: "groq" | "openrouter" | "cache" | "rule-based";
    model: string | null;
    summary: string;
    bulletPoints: string[];
    dataGaps: string[];
    generatedAt: string;
    message: string;
  };
  refreshStatus: {
    stable: boolean;
    message: string;
  };
  dataCards: PredictionDataCard[];
  dataDiagnostics?: PredictionDataDiagnostics;
  sourceSummary: PredictionSourceSummary[];
  teamProfiles: PredictionTeamSnapshot[];
  groupStage: GroupPrediction[];
  qualifiedTeams: PredictionTeamSnapshot[];
  thirdPlaceQualifiers: PredictionTeamSnapshot[];
  roundOf32: TournamentRoundPrediction;
  roundOf16: TournamentRoundPrediction;
  quarterFinals: TournamentRoundPrediction;
  semiFinals: TournamentRoundPrediction;
  thirdPlaceMatch: MatchPrediction | null;
  final: MatchPrediction | null;
  champion: PredictionTeamSnapshot | null;
  runnerUp: PredictionTeamSnapshot | null;
  thirdPlace: PredictionTeamSnapshot | null;
  uncertaintyFactors: string[];
}

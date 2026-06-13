export type DataSourceType =
  | "API 실제 데이터"
  | "AI 예측 데이터"
  | "사용자 입력 데이터"
  | "경우의 수 계산기 데이터"
  | "공식 출처 데이터"
  | "확인 필요 데이터";

export type DisplayBadge =
  | "공식"
  | "공식 확인"
  | "API 확인"
  | "수동 확인"
  | "API 실제 데이터"
  | "AI 예측"
  | "사용자 입력"
  | "경우의 수"
  | "확인 필요"
  | "재검증 필요"
  | "표시 금지"
  | "오래된 정보"
  | "부상"
  | "징계"
  | "경고 누적 위험"
  | "체력 저하";

export type VerificationConfidence =
  | "공식"
  | "신뢰도 높음"
  | "예상"
  | "확인 필요"
  | "표시 금지";

export type GroupSlotVerificationStatus =
  | "공식 확인"
  | "API 확인"
  | "수동 확인"
  | "확인 필요";

export interface WorldCupGroupSlot extends Partial<SourceMeta> {
  groupId: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L";
  position: 1 | 2 | 3 | 4;
  teamName: string | null;
  teamNameEn: string | null;
  teamCode?: string | null;
  flagEmoji?: string | null;
  sourceType: DataSourceType;
  verificationStatus: GroupSlotVerificationStatus;
  confidence: VerificationConfidence;
}

export interface SourceMeta {
  sourceName: string | null;
  sourceUrl: string | null;
  lastUpdated: string | null;
  isOfficial: boolean;
  confidence: VerificationConfidence;
}

export interface TeamRef extends Partial<SourceMeta> {
  id: string;
  nameKo: string;
  nameEn: string;
  group: string;
  slot: string;
  position: number;
  teamCode?: string | null;
  flag: string;
  dataSourceType: DataSourceType;
  verificationStatus: DisplayBadge;
}

export interface TeamGroup {
  id: string;
  name: string;
  sourceType: DataSourceType;
  teams: TeamRef[];
}

export interface FootballScore {
  home: number | null;
  away: number | null;
}

export interface FootballMatch {
  id: string;
  apiId?: number;
  matchNumber: number | null;
  stage: string;
  group: string | null;
  utcDate: string | null;
  status: string;
  venue: string | null;
  homeTeam: string;
  awayTeam: string;
  score: FootballScore;
  winner: string | null;
  sourceType: "API 실제 데이터";
  locked: boolean;
  lastUpdated: string | null;
}

export interface StandingRow {
  team: string;
  group: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  sourceType: DataSourceType;
}

export interface FootballApiEnvelope<T> {
  ok: boolean;
  source: "football-data.org";
  lastUpdated: string;
  message: string | null;
  data: T;
}

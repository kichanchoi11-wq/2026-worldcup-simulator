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
  | "신뢰도 높음"
  | "예상"
  | "API 확인"
  | "수동 확인"
  | "API 실제 데이터"
  | "AI 예측"
  | "사용자 입력"
  | "경우의 수"
  | "확인 필요"
  | "추가 수집 필요"
  | "분석 참고"
  | "최근 자료 기준 추정"
  | "재검증 필요"
  | "표시 불가"
  | "표시 금지"
  | "오래된 정보"
  | "출전 가능"
  | "출전 불투명"
  | "출전 금지"
  | "결장"
  | "징계 결장"
  | "부상"
  | "징계"
  | "경고 누적 위험"
  | "체력 저하"
  | "체력 변수";

export type VerificationConfidence =
  | "공식"
  | "공식 확인"
  | "신뢰도 높음"
  | "분석 참고"
  | "예상"
  | "최근 자료 기준 추정"
  | "추가 수집 필요"
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
  flagImageUrl: string;
  flagAlt: string;
  teamSlug: string;
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
  sourceLevel?: "공식 확인" | "신뢰도 높음" | "참고 자료" | "확인 필요";
  sourceNotes?: string | null;
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
  flagImageUrl?: string | null;
  flagAlt?: string | null;
  teamSlug: string;
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

export type FootballApiProvider = "api-football" | "football-data.org" | "cache" | "static";
export type FootballDataQuality = "live" | "fresh-cache" | "fallback" | "stale-cache" | "static-default" | "unavailable";

export interface ApiFootballUsageSnapshot {
  dateKey: string;
  used: number;
  limit: number;
  softLimit: number;
  remaining: number;
  resetAt: string;
  blocked: boolean;
  warning: string | null;
}

export interface ApiFootballUsageLog {
  id: string;
  provider: FootballApiProvider;
  endpoint: string;
  resource: string;
  counted: boolean;
  status: "success" | "failed" | "blocked" | "cache-hit" | "fallback";
  httpStatus: number | null;
  message: string;
  createdAt: string;
}

export interface ApiFootballSyncLog {
  id: string;
  resource: string;
  preferredProvider: FootballApiProvider;
  resolvedProvider: FootballApiProvider;
  status: "success" | "fallback" | "cache" | "static";
  count: number;
  message: string;
  createdAt: string;
}

export interface ApiFootballTeamRecord {
  id: number | null;
  name: string;
  code: string | null;
  country: string | null;
  logo: string | null;
  source: "api-football";
  lastUpdated: string | null;
}

export type ApiFootballTrackedResource =
  | "fixtures"
  | "standings"
  | "teams"
  | "players"
  | "coaches"
  | "lineups"
  | "events"
  | "injuries"
  | "statistics"
  | "predictions";

export interface ApiFootballResourceSnapshot {
  resource: ApiFootballTrackedResource;
  label: string;
  source: FootballApiProvider;
  lastUpdated: string;
  cacheExpiresAt: string | null;
  isFallbackData: boolean;
  dataQuality: FootballDataQuality;
  count: number;
  rawData: unknown;
  message: string | null;
}

export interface FootballApiEnvelope<T> {
  ok: boolean;
  source: FootballApiProvider;
  lastUpdated: string;
  cacheExpiresAt?: string | null;
  isFallbackData?: boolean;
  dataQuality?: FootballDataQuality;
  cachedProvider?: FootballApiProvider | null;
  fallbackChain?: string[];
  usage?: ApiFootballUsageSnapshot;
  rawData?: unknown;
  message: string | null;
  data: T;
}

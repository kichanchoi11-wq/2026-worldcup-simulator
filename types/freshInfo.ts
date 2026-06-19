export type FreshInfoNeed =
  | "actualResult"
  | "matchStatus"
  | "venue"
  | "cards"
  | "injuries"
  | "suspensions"
  | "fitness"
  | "lineups"
  | "formations"
  | "coachTactics"
  | "matchReview"
  | "predictionComparison";

export type FreshInfoCategory =
  | "경기 결과"
  | "경기 상태"
  | "경기장"
  | "카드"
  | "부상"
  | "징계"
  | "체력"
  | "라인업"
  | "포메이션"
  | "감독 전술"
  | "경기 리뷰"
  | "예측 비교";

export type FreshInfoStatus = "확정" | "복수 출처 확인" | "추정" | "추가 확인 필요";
export type FreshInfoConfidence = "높음" | "보통" | "낮음" | "추가 확인 필요";
export type FreshInfoSourceType =
  | "공식 발표"
  | "축구 데이터 사이트"
  | "스포츠 언론"
  | "Tavily 검색"
  | "Exa 검색"
  | "football-data.org"
  | "정적 데이터"
  | "관리자 입력"
  | "내부 계산";

export type AIFreshInfoRequest = {
  targetType: "match" | "team" | "player" | "coach" | "group" | "tournament";
  targetId: string;
  teamNames?: string[];
  playerNames?: string[];
  matchName?: string;
  dateHint?: string | null;
  infoNeeds: FreshInfoNeed[];
  existingData: unknown;
  allowedSources?: string[];
  language: "ko";
};

export type FreshInfoSource = {
  name: string;
  url?: string;
  sourceType: FreshInfoSourceType;
  checkedAt: string;
};

export type FreshInfoItem = {
  category: FreshInfoCategory;
  title: string;
  value: string;
  status: FreshInfoStatus;
  sourceNames: string[];
  sourceUrls?: string[];
  lastCheckedAt: string;
};

export type AIFreshInfoResult = {
  ok: boolean;
  targetType: string;
  targetId: string;
  generatedAt: string;
  searchedAt: string;
  searchUsed: boolean;
  providerUsed: "tavily" | "exa" | "none" | null;
  items: FreshInfoItem[];
  summary: string;
  limitations: string[];
  sources: FreshInfoSource[];
  confidence: FreshInfoConfidence;
  fallbackUsed: boolean;
  error?: string | null;
};

export type AIFreshInfoStatus = {
  enabled: boolean;
  searchEnabled: boolean;
  searchAvailable: boolean;
  searchProviders: Array<"tavily" | "exa">;
  lastSearchedAt: string | null;
  targetMatchCount: number;
  targetTeamCount: number;
  reflectedCounts: {
    cards: number;
    injuries: number;
    suspensions: number;
    lineupsAndFormations: number;
    reviews: number;
    fitness: number;
  };
  needsReviewCount: number;
  sourceBackedItemCount: number;
  sourceMissingItemCount: number;
  cacheHitCount: number;
  failureCount: number;
  timeoutCount: number;
  fallbackCount: number;
  message: string;
};

export type SourcedFootballInfoCategory =
  | "match_result"
  | "match_status"
  | "venue"
  | "card"
  | "injury"
  | "suspension"
  | "fitness"
  | "lineup"
  | "formation"
  | "tactics"
  | "match_review";

export type SourcedFootballInfoStatus =
  | "confirmed"
  | "multiple_sources"
  | "single_source"
  | "ai_inferred"
  | "needs_verification";

export type SourcedFootballInfoConfidence = "high" | "medium" | "low" | "needs_check";

export type SourcedFootballInfoProvider =
  | "Tavily"
  | "Exa"
  | "football-data.org"
  | "API-Football"
  | "manual"
  | "AI"
  | "static";

export type SourcedFootballInfo = {
  id: string;
  targetType: "match" | "team" | "player" | "coach";
  targetId: string;
  targetName: string;
  category: SourcedFootballInfoCategory;
  title: string;
  summary: string;
  value?: string | null;
  playerName?: string | null;
  teamName?: string | null;
  matchId?: string | number | null;
  status: SourcedFootballInfoStatus;
  confidence: SourcedFootballInfoConfidence;
  sources: {
    title: string;
    url?: string;
    provider: SourcedFootballInfoProvider;
    publishedAt?: string | null;
    checkedAt: string;
  }[];
  generatedBy: "search" | "ai_summary" | "internal_rule" | "manual";
  createdAt: string;
  updatedAt: string;
};

export type RefreshSnapshotMeta = {
  snapshotId: string;
  createdAt: string;
  updatedAt: string;
  targetSummary: {
    matches: number;
    teams: number;
    players: number;
  };
  counts: {
    sourcedItems: number;
    cards: number;
    injuries: number;
    suspensions: number;
    lineups: number;
    formations: number;
    reviews: number;
    fitness: number;
  };
  sourceProviders: string[];
  status: "success" | "partial" | "failed";
  storageMode: "server-cache" | "compressed" | "indexeddb" | "localStorage-meta-only";
};

export type FreshInfoTargetMapping = {
  infoId: string;
  targetType: "match" | "team" | "player";
  resolvedTargetId: string | number | null;
  confidence: "exact" | "name_match" | "date_team_match" | "manual_needed" | "failed";
  reason?: string | null;
};

export type FreshInfoReflectionDiagnostics = {
  checkedAt: string;
  collectedResults: number;
  normalizedItems: number;
  sourceBackedItems: number;
  aiInferredItems: number;
  targetMappingSuccess: number;
  matchDetailReflected: number;
  teamDetailReflected: number;
  unmatchedItems: number;
  counts: {
    cards: number;
    injuries: number;
    suspensions: number;
    fitness: number;
    lineups: number;
    formations: number;
    reviews: number;
  };
  storage: {
    mode: RefreshSnapshotMeta["storageMode"];
    originalSnapshotBytes: number;
    metaBytes: number;
    normalizedBytes: number;
    localStorageOk: boolean;
    message: string;
  };
  mappings: FreshInfoTargetMapping[];
  unmatchedReasons: string[];
  message: string;
};

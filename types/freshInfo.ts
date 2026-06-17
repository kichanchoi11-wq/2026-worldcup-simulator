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
  | "Gemini 검색"
  | "football-data.org"
  | "정적 데이터"
  | "관리자 입력"
  | "내부 계산";

export type GeminiFreshInfoRequest = {
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

export type GeminiFreshInfoResult = {
  ok: boolean;
  targetType: string;
  targetId: string;
  generatedAt: string;
  searchedAt: string;
  searchUsed: boolean;
  modelUsed: string | null;
  items: FreshInfoItem[];
  summary: string;
  limitations: string[];
  sources: FreshInfoSource[];
  confidence: FreshInfoConfidence;
  fallbackUsed: boolean;
  error?: string | null;
};

export type GeminiFreshInfoStatus = {
  enabled: boolean;
  groundingEnabled: boolean;
  groundingAvailable: boolean;
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

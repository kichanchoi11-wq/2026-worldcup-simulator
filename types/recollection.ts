import type { FootballDataRefreshSnapshot } from "@/lib/autoUpdateService";
import type { ApiFootballResourceSnapshot, ApiFootballTeamRecord, FootballMatch, StandingRow } from "@/types/football";
import type { MatchReview } from "@/types/match";
import type { CardRecord } from "@/types/card";
import type { AIAnalysisRecord, AIProviderStatus } from "@/types/ai";
import type { AIFreshInfoResult, AIFreshInfoStatus } from "@/types/freshInfo";
import type { CoachTacticalProfile, KoreaVsTeamPrediction, PlayerData, PlayerStatus, TeamFormationProfile, TeamRiskProfile } from "@/types/team";

export type RecollectionScope =
  | "all"
  | "coaches"
  | "formations"
  | "tactics"
  | "lineups"
  | "risks"
  | "match-reviews"
  | "ai-coach-tactics"
  | "ai-formations"
  | "ai-risks"
  | "ai-refresh-summary"
  | "ai-all"
  | "hide-unverified-players"
  | "hide-unverified-staff"
  | "disable-invalid-data";

export type RecollectionJobStatus = "대기" | "실행 중" | "성공" | "부분 성공" | "실패" | "건너뜀";

export type RecollectionResourceStatus = "success" | "partial" | "failed" | "skipped";

export type RecollectionJobDefinition = {
  scope: RecollectionScope;
  label: string;
  description: string;
};

export type RecollectionResourceResult = {
  id: string;
  label: string;
  status: RecollectionResourceStatus;
  count: number;
  source: string;
  message: string;
};

export type RecollectionJob = {
  jobId: string;
  scope: RecollectionScope;
  label: string;
  status: RecollectionJobStatus;
  requestedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  updatedCount: number;
  failedCount: number;
  skippedCount: number;
  sourcesUsed: string[];
  message: string;
  error?: string | null;
  results: RecollectionResourceResult[];
};

export type RecollectionDataPayload = {
  refreshSnapshot: FootballDataRefreshSnapshot;
  matches: FootballMatch[];
  standings: StandingRow[];
  teams: ApiFootballTeamRecord[];
  resourceSnapshots: ApiFootballResourceSnapshot[];
  providerStatus: FootballDataRefreshSnapshot["data"]["providerStatus"];
  players: PlayerData[];
  coaches: FootballDataRefreshSnapshot["data"]["fallbackResources"]["coaches"];
  lineups: FootballDataRefreshSnapshot["data"]["fallbackResources"]["lineups"];
  events: unknown[];
  injuries: PlayerStatus[];
  statistics: unknown[];
  predictions: KoreaVsTeamPrediction[];
  apiPlayers: unknown[];
  apiCoaches: unknown[];
  apiLineups: unknown[];
  apiEvents: unknown[];
  apiInjuries: unknown[];
  apiStatistics: unknown[];
  apiPredictions: unknown[];
  cardRecords: CardRecord[];
  freshInfoResults: AIFreshInfoResult[];
  freshInfoStatus: AIFreshInfoStatus;
  aiAnalyses: AIAnalysisRecord[];
  aiStatus: AIProviderStatus;
  teamTactics: CoachTacticalProfile[];
  teamFormations: TeamFormationProfile[];
  teamRiskProfiles: TeamRiskProfile[];
  koreaPredictions: KoreaVsTeamPrediction[];
  matchReviews: MatchReview[];
  audit: FootballDataRefreshSnapshot["data"]["audit"];
  brokenPlayerNames: FootballDataRefreshSnapshot["data"]["brokenPlayerNames"];
};

export type RecollectionResponse = {
  ok: boolean;
  status: RecollectionJobStatus;
  job: RecollectionJob;
  data: RecollectionDataPayload;
  message: string;
};

export const recollectionJobDefinitions: RecollectionJobDefinition[] = [
  {
    scope: "coaches",
    label: "감독 정보 재검증",
    description: "API-Football 팀/감독 조회와 fallback 데이터를 다시 묶어 감독 정보를 갱신합니다."
  },
  {
    scope: "formations",
    label: "포메이션 정보 재검증",
    description: "경기 lineups, 팀 포메이션 분석, 캐시 데이터를 다시 확인합니다."
  },
  {
    scope: "tactics",
    label: "전술 정보 재검증",
    description: "감독 전술 프로필과 경기 통계/정적 분석 데이터를 재생성합니다."
  },
  {
    scope: "lineups",
    label: "예상 라인업 재검증",
    description: "fixture lineups와 기존 예상 명단 fallback을 다시 저장합니다."
  },
  {
    scope: "risks",
    label: "경기별 카드/징계/부상 정보 재검증",
    description: "events, injuries, 정적 위험 프로필을 다시 수집합니다."
  },
  {
    scope: "ai-coach-tactics",
    label: "AI 감독 전술 재분석",
    description: "서버 Route에서 AI로 감독 전술 요약을 생성하고 호출 로그를 저장합니다."
  },
  {
    scope: "ai-formations",
    label: "AI 포메이션 재분석",
    description: "최근/예상/대체 포메이션 설명을 AI 또는 내부 fallback으로 다시 생성합니다."
  },
  {
    scope: "ai-risks",
    label: "AI 카드·부상·징계 설명",
    description: "카드, 부상, 징계, 체력 데이터의 결측 사유와 확인 대상을 분석합니다."
  },
  {
    scope: "ai-refresh-summary",
    label: "AI 새로고침 결과 요약",
    description: "최근 새로고침 결과, API 호출 제한, 캐시/fallback 사용 상태를 요약합니다."
  },
  {
    scope: "ai-all",
    label: "전체 AI 분석 재실행",
    description: "감독 전술, 포메이션, 리스크, 새로고침 요약을 한 번에 다시 생성합니다."
  },
  {
    scope: "hide-unverified-players",
    label: "출처 없는 선수 데이터 숨기기",
    description: "출처 없는 선수 데이터와 깨진 선수명을 점검하고 저장소 정리 결과를 갱신합니다."
  },
  {
    scope: "hide-unverified-staff",
    label: "출처 없는 감독/전술/포메이션 숨기기",
    description: "감독, 전술, 포메이션 출처 품질을 재검사합니다."
  },
  {
    scope: "disable-invalid-data",
    label: "잘못된 데이터 비활성화",
    description: "캐시, 정적 fallback, API 상태를 다시 확인해 사용할 수 없는 항목을 분리합니다."
  }
];

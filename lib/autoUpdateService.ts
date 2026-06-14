import { matchDetails, createMatchPageData } from "@/data/matchDetails";
import { fetchFootballData, normalizeMatches, normalizeStandings } from "@/lib/footballApi";
import { createMatchReview } from "@/lib/matchReviewService";
import { getAdvancedTeamDataAudit, getAllTeamAnalysisBundles, getBrokenPlayerNameAudit } from "@/lib/teamAnalysis";

export type RefreshStatus = "success" | "partial" | "failed" | "skipped";

export type RefreshResultItem = {
  id: string;
  label: string;
  status: RefreshStatus;
  message: string;
  count: number;
};

export type FootballDataRefreshSnapshot = {
  ok: boolean;
  mode: "manual" | "cron";
  refreshedAt: string;
  message: string;
  results: RefreshResultItem[];
  data: {
    matches: ReturnType<typeof normalizeMatches>;
    standings: ReturnType<typeof normalizeStandings>;
    teamAnalysisBundles: ReturnType<typeof getAllTeamAnalysisBundles>;
    matchReviews: NonNullable<ReturnType<typeof createMatchReview>>[];
    brokenPlayerNames: ReturnType<typeof getBrokenPlayerNameAudit>;
    audit: ReturnType<typeof getAdvancedTeamDataAudit>;
  };
  autoUpdate: {
    cronEnabled: boolean;
    stable: boolean;
    message: string;
  };
};

function item(id: string, label: string, status: RefreshStatus, message: string, count: number): RefreshResultItem {
  return { id, label, status, message, count };
}

export async function refreshFootballData(mode: "manual" | "cron" = "manual"): Promise<FootballDataRefreshSnapshot> {
  const refreshedAt = new Date().toISOString();
  const [matchesEnvelope, standingsEnvelope] = await Promise.all([
    fetchFootballData("/competitions/WC/matches", { matches: [] }),
    fetchFootballData("/competitions/WC/standings", { standings: [] })
  ]);
  const matches = normalizeMatches(matchesEnvelope.data);
  const standings = normalizeStandings(standingsEnvelope.data);
  const teamAnalysisBundles = getAllTeamAnalysisBundles();
  const matchReviews = matchDetails.map((match) => createMatchReview(createMatchPageData(match))).filter((review): review is NonNullable<typeof review> => Boolean(review));
  const brokenPlayerNames = getBrokenPlayerNameAudit();
  const audit = getAdvancedTeamDataAudit();
  const results: RefreshResultItem[] = [
    item(
      "matches",
      "경기 데이터",
      matchesEnvelope.ok ? (matches.length > 0 ? "success" : "partial") : "failed",
      matchesEnvelope.message ?? (matches.length > 0 ? "경기 일정/결과를 갱신했습니다." : "표시할 경기 데이터가 아직 없습니다."),
      matches.length
    ),
    item(
      "standings",
      "조별 순위",
      standingsEnvelope.ok ? (standings.length > 0 ? "success" : "partial") : "failed",
      standingsEnvelope.message ?? (standings.length > 0 ? "순위표를 갱신했습니다." : "표시할 순위 데이터가 아직 없습니다."),
      standings.length
    ),
    item(
      "team-analysis",
      "감독/전술/포메이션",
      teamAnalysisBundles.length > 0 ? "success" : "failed",
      "정적 팀 상세 데이터와 신뢰 가능한 스쿼드/전술 참고 자료 기준으로 분석 묶음을 생성했습니다.",
      teamAnalysisBundles.length
    ),
    item(
      "risks",
      "카드/부상/징계/체력",
      audit.riskProfiles > 0 ? "partial" : "failed",
      "공식 이벤트 데이터가 부족한 항목은 추가 확인 필요로 유지하고, 핵심 선수 기준 확인 대상을 표시했습니다.",
      audit.riskProfiles
    ),
    item(
      "match-reviews",
      "경기 리뷰",
      matchReviews.length > 0 ? "success" : "skipped",
      matchReviews.length > 0
        ? "종료 경기 기준 리뷰를 생성했습니다."
        : "종료 경기 또는 실제 스코어가 없어 리뷰를 준비 중 상태로 유지합니다.",
      matchReviews.length
    ),
    item(
      "name-audit",
      "깨진 선수명 검사",
      brokenPlayerNames.length === 0 ? "success" : "partial",
      brokenPlayerNames.length === 0 ? "깨진 선수명을 찾지 못했습니다." : "표시 단계에서 보정할 깨진 선수명이 남아 있습니다.",
      brokenPlayerNames.length
    )
  ];
  const ok = results.some((result) => result.status === "success" || result.status === "partial");

  return {
    ok,
    mode,
    refreshedAt,
    message: ok ? "최신 정보 새로고침을 완료했습니다. 실패한 항목은 기존 저장 데이터를 유지하세요." : "최신 정보를 불러오지 못했습니다. 기존 저장 데이터를 유지합니다.",
    results,
    data: {
      matches,
      standings,
      teamAnalysisBundles,
      matchReviews,
      brokenPlayerNames,
      audit
    },
    autoUpdate: {
      cronEnabled: true,
      stable: true,
      message:
        "Vercel Cron은 서버 API Route만 호출하고 브라우저 크롤링을 하지 않습니다. 외부 API 키가 없거나 응답이 비어도 기존 데이터는 덮어쓰지 않습니다."
    }
  };
}

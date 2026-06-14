import { getTeamVerificationDataById } from "@/data/teamVerificationData";
import type { MatchDetailData, MatchPageData, MatchReview } from "@/types/match";

const reviewDate = "2026-06-14";

function isFinished(match: MatchDetailData) {
  return match.status === "종료" || (match.score.home !== null && match.score.away !== null);
}

function actualWinner(match: MatchDetailData) {
  if (match.score.home === null || match.score.away === null) {
    return null;
  }

  if (match.score.home > match.score.away) {
    return match.homeTeamName;
  }

  if (match.score.away > match.score.home) {
    return match.awayTeamName;
  }

  return "무승부";
}

function predictedWinner(pageData: MatchPageData) {
  const { prediction, detail } = pageData;

  if (
    prediction.homeWinProbability === null ||
    prediction.awayWinProbability === null ||
    prediction.drawProbability === null
  ) {
    return null;
  }

  const max = Math.max(prediction.homeWinProbability, prediction.awayWinProbability, prediction.drawProbability);

  if (max === prediction.drawProbability) {
    return "무승부";
  }

  return max === prediction.homeWinProbability ? detail.homeTeamName : detail.awayTeamName;
}

export function createMatchReview(pageData: MatchPageData): MatchReview | null {
  const match = pageData.detail;

  if (!isFinished(match) || match.score.home === null || match.score.away === null) {
    return null;
  }

  const homeTeam = match.homeTeamId ? getTeamVerificationDataById(match.homeTeamId) : null;
  const awayTeam = match.awayTeamId ? getTeamVerificationDataById(match.awayTeamId) : null;
  const actual = actualWinner(match);
  const predicted = predictedWinner(pageData);

  return {
    matchId: match.matchId,
    homeTeamName: match.homeTeamName ?? "홈팀 확인 필요",
    awayTeamName: match.awayTeamName ?? "원정팀 확인 필요",
    finalScore: {
      home: match.score.home,
      away: match.score.away
    },
    matchSummary: `${match.homeTeamName ?? "홈팀"} ${match.score.home}-${match.score.away} ${match.awayTeamName ?? "원정팀"} 결과를 기준으로 한 간단 리뷰입니다. 세부 경기 리포트가 들어오면 핵심 장면과 선수 평가를 더 구체화합니다.`,
    keyMoments: [
      "공식 이벤트 타임라인 연동 전까지 득점·카드·교체 장면은 간단 리뷰로 표시합니다.",
      "경기 후 리포트와 데이터 사이트 이벤트가 확인되면 승부처를 자동 갱신합니다."
    ],
    tacticalReview: {
      homeTeam: homeTeam?.tactics.summary ?? "홈팀 전술 리뷰 추가 수집 필요",
      awayTeam: awayTeam?.tactics.summary ?? "원정팀 전술 리뷰 추가 수집 필요"
    },
    formationChanges: [
      `${match.homeTeamName ?? "홈팀"} 기본 형태: ${homeTeam?.expectedLineup.formation ?? "확인 필요"}`,
      `${match.awayTeamName ?? "원정팀"} 기본 형태: ${awayTeam?.expectedLineup.formation ?? "확인 필요"}`,
      "실제 포메이션 변화는 경기 리포트 연동 후 보강합니다."
    ],
    substitutionImpact: [
      "교체 시간과 출전 선수 이벤트 데이터가 들어오면 교체 흐름을 평가합니다.",
      "현재는 공식 결과 기준의 간단 리뷰로 유지합니다."
    ],
    playerHighlights: [
      ...(homeTeam?.notablePlayers.slice(0, 2).map((player) => `${homeTeam.teamName}: ${player.playerName}`) ?? []),
      ...(awayTeam?.notablePlayers.slice(0, 2).map((player) => `${awayTeam.teamName}: ${player.playerName}`) ?? [])
    ],
    cardAndInjuryImpact: [
      "카드·부상 영향은 공식 매치 리포트 또는 이벤트 API가 확인되면 확정 리뷰로 갱신합니다."
    ],
    fatigueImpact: [
      "휴식일, 이동 거리, 연장전 여부가 확인되면 다음 경기 체력 리스크에 반영합니다."
    ],
    predictionComparison: {
      predictedWinner: predicted,
      actualWinner: actual,
      wasPredictionCorrect: predicted && actual ? predicted === actual : null,
      notes:
        predicted && actual
          ? predicted === actual
            ? "AI 예측의 승패 방향이 실제 결과와 일치했습니다. 득점 흐름과 카드 변수는 세부 이벤트 데이터로 추가 비교합니다."
            : "AI 예측의 승패 방향이 실제 결과와 달랐습니다. 결정력, 카드, 교체, 부상 변수의 영향이 추가 분석 대상입니다."
          : "경기 전 예측 확률 또는 실제 결과 비교 데이터가 부족해 적중 여부를 보류합니다."
    },
    nextMatchImpact: [
      "승점과 골득실은 조별 순위/경우의 수 계산에 반영합니다.",
      "카드 누적과 부상 정보가 확인되면 다음 경기 출전 가능성에 반영합니다."
    ],
    koreaPerspectiveReview:
      match.homeTeamId === "korea-republic" || match.awayTeamId === "korea-republic"
        ? "대한민국 관련 경기입니다. 압박 성공률, 전환 속도, 세트피스 대응, 카드 관리가 다음 경기 과제로 연결됩니다."
        : null,
    confidence: "참고 자료",
    sources: pageData.sources,
    reviewedAt: reviewDate
  };
}

export function createMatchReviewPlaceholder(match: MatchDetailData) {
  return {
    title: isFinished(match) ? "경기 리뷰 준비 중" : "경기 전 프리뷰",
    body: isFinished(match)
      ? "경기 결과와 주요 데이터가 수집되면 전술 리뷰, 선수 평가, 카드/부상 영향, 다음 경기 영향을 분석합니다."
      : "예정된 경기입니다. 예상 라인업, 카드/부상/징계/체력 변수, 전술 매치업과 AI 승률을 중심으로 프리뷰를 표시합니다."
  };
}

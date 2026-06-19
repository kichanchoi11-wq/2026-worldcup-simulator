import { getTeamVerificationDataById } from "@/data/teamVerificationData";
import type { MatchDetailData, MatchPageData, MatchReview, MatchReviewMetadata } from "@/types/match";

const reviewDate = "2026-06-15";

export function isFinishedMatch(match: MatchDetailData) {
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

export function createMatchReviewCacheKey(pageData: MatchPageData) {
  const match = pageData.detail;
  return [
    match.matchId,
    match.lastUpdated ?? "no-match-update",
    match.score.home ?? "no-home-score",
    match.score.away ?? "no-away-score",
    pageData.dataGaps.map((gap) => gap.id).join(".")
  ].join(":");
}

function sourceNames(pageData: MatchPageData) {
  return pageData.sources.map((source) => source.sourceName).filter((name): name is string => Boolean(name));
}

export function createRulesReviewMetadata(pageData: MatchPageData, generatedBy: MatchReviewMetadata["generatedBy"] = "rules"): MatchReviewMetadata {
  return {
    generatedBy,
    generatedAt: reviewDate,
    model: null,
    dataSources: sourceNames(pageData),
    confidence: pageData.dataGaps.some((gap) => gap.severity === "critical") ? "추가 확인 필요" : "참고 자료",
    cacheKey: createMatchReviewCacheKey(pageData)
  };
}

function gapMessage(pageData: MatchPageData, id: string, fallback: string) {
  return pageData.dataGaps.find((gap) => gap.id === id)?.reason ?? fallback;
}

function cardAndDisciplineImpact(pageData: MatchPageData) {
  const suspended = pageData.suspensionStatuses.filter((item) => item.appliesToMatch === true);
  const cardRisks = pageData.cardStatuses.filter((item) => item.status === "경고 누적 위험");

  return [
    suspended.length > 0
      ? `출전 제한 가능성이 표시된 선수: ${suspended.map((item) => item.playerName).join(", ")}`
      : gapMessage(pageData, "suspensions", "징계 결장 또는 출전 금지 선수는 공식 공지 확인 전입니다."),
    cardRisks.length > 0
      ? `경고 누적 위험 확인 대상: ${cardRisks.map((item) => item.playerName).join(", ")}`
      : gapMessage(pageData, "player-card-totals", "선수별 카드 누적 수가 아직 저장되지 않았습니다."),
    pageData.matchCardEvents.length > 0
      ? "카드 이벤트 타임라인이 저장되어 리뷰에 반영되었습니다."
      : gapMessage(pageData, "card-events", "카드 이벤트 타임라인이 아직 연결되지 않았습니다.")
  ];
}

function injuryImpact(pageData: MatchPageData) {
  const unavailable = pageData.injuryStatuses.filter((item) => item.status === "결장" || item.status === "출전 불투명" || item.status === "경미한 부상");

  return unavailable.length > 0
    ? unavailable.map((item) => `${item.playerName}: ${item.status} / ${item.availability}`)
    : [gapMessage(pageData, "injuries", "경기별 부상자 명단은 공식 발표 확인 전입니다.")];
}

function fitnessImpact(pageData: MatchPageData) {
  if (pageData.teamFitnessProfiles.length === 0) {
    return [gapMessage(pageData, "fitness", "체력/휴식일 계산 데이터가 없습니다.")];
  }

  return pageData.teamFitnessProfiles.map((profile) => {
    const players = profile.overloadedPlayers.map((player) => player.playerName).join(", ");
    return `${profile.teamName}: 휴식일 ${profile.restDays ?? "계산 보류"}, 피로도 ${profile.fatigueLevel}, 이동 부담 ${profile.travelLoad}. 확인 대상 ${players || "없음"}. ${profile.missingReason ?? ""}`.trim();
  });
}

export function createMatchReview(pageData: MatchPageData): MatchReview | null {
  const match = pageData.detail;

  if (!isFinishedMatch(match) || match.score.home === null || match.score.away === null) {
    return null;
  }

  const homeTeam = match.homeTeamId ? getTeamVerificationDataById(match.homeTeamId) : null;
  const awayTeam = match.awayTeamId ? getTeamVerificationDataById(match.awayTeamId) : null;
  const actual = actualWinner(match);
  const predicted = predictedWinner(pageData);
  const cardDiscipline = cardAndDisciplineImpact(pageData);
  const injuries = injuryImpact(pageData);
  const fatigue = fitnessImpact(pageData);

  return {
    matchId: match.matchId,
    reviewType: "rules",
    homeTeamName: match.homeTeamName ?? "홈팀 확인 필요",
    awayTeamName: match.awayTeamName ?? "원정팀 확인 필요",
    finalScore: {
      home: match.score.home,
      away: match.score.away
    },
    matchSummary: `${match.homeTeamName ?? "홈팀"} ${match.score.home}-${match.score.away} ${match.awayTeamName ?? "원정팀"} 결과를 기준으로 한 규칙 기반 리뷰입니다. AI 리뷰는 관리자 인증 후 서버 Route에서 생성할 수 있으며, 사실 데이터는 저장된 경기/팀/이벤트 구조만 사용합니다.`,
    keyMoments: [
      pageData.matchCardEvents.length > 0
        ? "저장된 이벤트 타임라인을 기준으로 승부처를 반영했습니다."
        : gapMessage(pageData, "card-events", "공식 이벤트 타임라인 연동 전이라 득점·카드·교체 장면은 결측 사유와 함께 표시합니다."),
      "경기 후 상세 통계가 들어오면 슈팅, 점유율, 압박 성공률, 교체 효과를 추가 비교합니다."
    ],
    tacticalReview: {
      homeTeam: homeTeam?.tactics.summary ?? "홈팀 전술 리뷰 추가 수집 필요",
      awayTeam: awayTeam?.tactics.summary ?? "원정팀 전술 리뷰 추가 수집 필요"
    },
    formationChanges: [
      `${match.homeTeamName ?? "홈팀"} 기본 형태: ${homeTeam?.expectedLineup.formation ?? "확인 필요"}`,
      `${match.awayTeamName ?? "원정팀"} 기본 형태: ${awayTeam?.expectedLineup.formation ?? "확인 필요"}`,
      "실제 포메이션 변화는 API-Football lineups 또는 공식 경기 리포트가 저장되면 확정 리뷰로 갱신합니다."
    ],
    substitutionImpact: [
      "교체 시간과 출전 선수 이벤트 데이터가 들어오면 교체 흐름을 평가합니다.",
      "현재는 공식 결과 기준의 간단 리뷰로 유지하며, 선수 교체 사실을 임의로 만들지 않습니다."
    ],
    playerHighlights: [
      ...(homeTeam?.notablePlayers.slice(0, 2).map((player) => `${homeTeam.teamName}: ${player.playerName}`) ?? []),
      ...(awayTeam?.notablePlayers.slice(0, 2).map((player) => `${awayTeam.teamName}: ${player.playerName}`) ?? [])
    ],
    cardAndInjuryImpact: [...cardDiscipline, ...injuries],
    cardAndDisciplineImpact: cardDiscipline,
    injuryImpact: injuries,
    fatigueImpact: fatigue,
    predictionComparison: {
      predictedWinner: predicted,
      predictedScore: pageData.prediction.expectedScore,
      actualWinner: actual,
      wasPredictionCorrect: predicted && actual ? predicted === actual : null,
      notes:
        predicted && actual
          ? predicted === actual
            ? "AI 예측의 승패 방향이 실제 결과와 일치했습니다. 득점 흐름, 카드, 교체, 부상 변수는 이벤트 데이터가 저장되면 더 자세히 비교합니다."
            : "AI 예측의 승패 방향이 실제 결과와 달랐습니다. 결정력, 카드, 교체, 부상 변수의 영향이 추가 분석 대상입니다."
          : "경기 전 예측 확률 또는 실제 결과 비교 데이터가 부족해 적중 여부를 보류합니다."
    },
    nextMatchImpact: [
      "승점과 골득실은 조별 순위/경우의 수 계산에 반영합니다.",
      "카드 누적과 부상 정보가 확인되면 다음 경기 출전 가능성에 반영합니다.",
      "휴식일과 이동 부담 데이터가 채워지면 다음 경기 체력 리스크를 재계산합니다."
    ],
    koreaPerspectiveReview:
      match.homeTeamId === "korea-republic" || match.awayTeamId === "korea-republic"
        ? "대한민국 관련 경기입니다. 압박 성공률, 전환 속도, 세트피스 대응, 카드 관리가 다음 경기 과제로 연결됩니다."
        : null,
    confidence: pageData.dataGaps.some((gap) => gap.severity === "critical") ? "추가 확인 필요" : "참고 자료",
    sources: pageData.sources,
    dataGaps: pageData.dataGaps,
    metadata: createRulesReviewMetadata(pageData),
    reviewedAt: reviewDate
  };
}

export function createMatchReviewPlaceholder(match: MatchDetailData) {
  return {
    title: isFinishedMatch(match) ? "경기 리뷰 준비 중" : "경기 전 프리뷰",
    body: isFinishedMatch(match)
      ? "경기 결과와 주요 데이터가 수집되면 전술 리뷰, 선수 평가, 카드/부상 영향, 다음 경기 영향을 분석합니다."
      : "예정된 경기입니다. 예상 라인업, 카드/부상/징계/체력 변수, 전술 매치업과 AI 승률을 중심으로 프리뷰를 표시합니다."
  };
}

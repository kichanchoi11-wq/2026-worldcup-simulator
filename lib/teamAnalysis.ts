import { teamVerificationData } from "@/data/teamVerificationData";
import { hasBrokenDisplayText, sanitizeDisplayText } from "@/lib/textSanitizer";
import type { SourceMeta } from "@/types/football";
import type {
  CoachTacticalProfile,
  EvidenceConfidence,
  KoreaVsTeamPrediction,
  PlayerData,
  PlayerRiskItem,
  TeamFormationProfile,
  TeamRiskProfile,
  TeamVerificationData
} from "@/types/team";

const analysisDate = "2026-06-14";

const footballDataSource: SourceMeta = {
  sourceName: "football-data.org API documentation",
  sourceUrl: "https://www.football-data.org/documentation/api",
  lastUpdated: analysisDate,
  isOfficial: false,
  confidence: "분석 참고",
  sourceLevel: "참고 자료",
  sourceNotes: "경기 일정, 결과, 순위, 일부 이벤트 데이터 연동 가능 범위 확인용"
};

function unique(items: Array<string | null | undefined>) {
  return Array.from(new Set(items.filter((item): item is string => Boolean(item && item.trim().length > 0))));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toEvidenceConfidence(team: TeamVerificationData): EvidenceConfidence {
  if (team.sources.some((source) => source.sourceLevel === "공식 확인")) {
    return team.players.length >= 23 ? "신뢰도 높음" : "참고 자료";
  }

  if (team.players.length > 0 && team.tactics.summary) {
    return "최근 자료 기준 추정";
  }

  return "추가 확인 필요";
}

function sourceName(team: TeamVerificationData) {
  return team.sources.find((source) => source.sourceUrl)?.sourceName ?? "신뢰 가능한 축구 자료";
}

function sourceUrl(team: TeamVerificationData) {
  return team.sources.find((source) => source.sourceUrl)?.sourceUrl ?? "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/match-schedule";
}

function sourceList(team: TeamVerificationData) {
  return unique([...team.sources, footballDataSource].map((source) => `${source.sourceName}-${source.sourceUrl}`))
    .map((key) => [...team.sources, footballDataSource].find((source) => `${source.sourceName}-${source.sourceUrl}` === key))
    .filter((source): source is SourceMeta => Boolean(source));
}

function fallbackFormationAlternatives(team: TeamVerificationData) {
  const recent = team.formation.formation;
  const expected = team.expectedLineup.formation;
  const keywordText = team.tactics.summary ?? "";
  const defaults = [recent, expected];

  if (keywordText.includes("3백") || keywordText.includes("윙백")) {
    defaults.push("3-4-2-1", "3-5-2");
  }

  if (keywordText.includes("측면") || keywordText.includes("전방 압박")) {
    defaults.push("4-3-3", "4-2-3-1");
  }

  if (keywordText.includes("낮은 블록") || keywordText.includes("역습")) {
    defaults.push("4-4-2", "5-4-1");
  }

  return unique(defaults).filter((formation) => formation !== recent && formation !== expected).slice(0, 3);
}

function riskItem(player: PlayerData, riskType: string, description: string, status: PlayerRiskItem["status"]): PlayerRiskItem {
  return {
    playerName: sanitizeDisplayText(player.playerName, "선수명 확인 필요"),
    position: player.position,
    club: player.club ? sanitizeDisplayText(player.club, "소속팀 확인 필요") : null,
    riskType,
    description,
    status,
    sourceName: player.sourceName ?? "경기 전 공식 발표 확인 필요",
    sourceUrl: player.sourceUrl ?? "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026",
    lastUpdated: player.lastUpdated ?? analysisDate
  };
}

function watchPlayers(team: TeamVerificationData) {
  const keyPlayers = team.players.filter((player) => player.isKeyPlayer || player.isNotablePlayer);
  return keyPlayers.length > 0 ? keyPlayers.slice(0, 5) : team.players.slice(0, 5);
}

function scorePowerIndex(powerIndex: string | null | undefined) {
  if (!powerIndex) {
    return 0;
  }

  const weights: Array<[string, number]> = [
    ["디펜딩 챔피언", 24],
    ["우승 후보권", 22],
    ["상위권", 15],
    ["중상위권", 10],
    ["16강", 8],
    ["다크호스", 6],
    ["중위권", 3],
    ["도전자", -1],
    ["첫 본선", -3]
  ];

  return weights.reduce((score, [keyword, value]) => (powerIndex.includes(keyword) ? score + value : score), 0);
}

function achievementScore(team: TeamVerificationData) {
  return (team.recentAchievements ?? []).reduce((score, item) => {
    if (item.includes("월드컵 우승")) {
      return score + 8;
    }
    if (item.includes("준우승")) {
      return score + 6;
    }
    if (item.includes("4강") || item.includes("3위") || item.includes("4위")) {
      return score + 5;
    }
    if (item.includes("16강")) {
      return score + 3;
    }
    if (item.includes("예선 통과") || item.includes("본선")) {
      return score + 2;
    }
    return score + 1;
  }, 0);
}

function teamStrength(team: TeamVerificationData) {
  const confederationBonus: Record<string, number> = {
    UEFA: 6,
    CONMEBOL: 7,
    CONCACAF: 4,
    CAF: 3,
    AFC: 2,
    OFC: -1
  };
  const playerBonus = Math.min(team.players.filter((player) => player.isKeyPlayer).length * 3, 15);
  const sourceBonus = Math.min(team.sources.length, 5);
  const riskPenalty = team.playerStatuses.filter((player) => player.availability !== "출전 가능").length * 2;

  return clamp(
    50 +
      scorePowerIndex(team.powerIndex) +
      achievementScore(team) +
      playerBonus +
      sourceBonus +
      (confederationBonus[team.confederation ?? ""] ?? 0) -
      riskPenalty,
    25,
    95
  );
}

export function getCoachTacticalProfile(team: TeamVerificationData): CoachTacticalProfile {
  const confidence = toEvidenceConfidence(team);
  const formations = unique([
    team.formation.formation,
    team.expectedLineup.formation,
    ...fallbackFormationAlternatives(team)
  ]);
  const strengths = team.tactics.strengths.length > 0 ? team.tactics.strengths : ["전술 강점 추가 확인 필요"];
  const weaknesses = team.tactics.weaknesses.length > 0 ? team.tactics.weaknesses : ["경기별 약점 추가 확인 필요"];

  return {
    teamId: team.teamId,
    teamName: team.teamName,
    coachName: team.coach.coachName,
    coachNationality: team.coach.nationality ?? null,
    appointedDate: team.coach.appointedDate ?? null,
    preferredFormations: formations,
    recentFormations: unique([team.formation.formation, team.expectedLineup.formation]),
    tacticalIdentity:
      team.tactics.summary ??
      `${team.teamName}의 감독 전술은 최근 경기 자료 기준으로 추가 확인 중이며, 선수단 구성과 포메이션 경향을 참고해 표시합니다.`,
    attackingApproach: team.tactics.attackingStyle ?? "공격 전개 방식 추가 확인 필요",
    defensiveApproach: team.tactics.defensiveStyle ?? "수비 방식 추가 확인 필요",
    pressingApproach: team.tactics.pressingStyle ?? "압박 방식 추가 확인 필요",
    buildUpApproach: team.tactics.buildUpStyle ?? "빌드업 방식 추가 확인 필요",
    transitionApproach: team.tactics.transitionStyle ?? "전환 방식 추가 확인 필요",
    setPieceApproach: team.tactics.setPieceStyle ?? "세트피스 방식 추가 확인 필요",
    inGameAdjustmentPattern: `${formations.join(" / ") || "기본 포메이션"} 사이 전환 가능성을 열어두고, 경기 흐름에 따라 측면/중원 숫자를 조정하는 방식으로 표시합니다.`,
    substitutionPattern:
      "확정 교체 패턴은 경기 리포트 연동 전까지 단정하지 않습니다. 핵심 선수 체력과 카드 상황에 따라 전방 속도, 중원 안정, 수비 높이 조정을 우선 변수로 봅니다.",
    tacticalStrengths: strengths,
    tacticalWeaknesses: weaknesses,
    confidence,
    sources: sourceList(team),
    lastUpdated: team.lastUpdated ?? analysisDate
  };
}

export function getTeamFormationProfile(team: TeamVerificationData): TeamFormationProfile {
  const recentFormation = team.formation.formation;
  const expectedFormation = team.expectedLineup.formation ?? recentFormation;
  const alternativeFormations = fallbackFormationAlternatives(team);
  const source = {
    sourceName: sourceName(team),
    sourceUrl: sourceUrl(team)
  };

  return {
    teamId: team.teamId,
    teamName: team.teamName,
    recentFormation,
    expectedFormation,
    alternativeFormations,
    matchBasedFormations: [
      {
        matchName: "최근 A매치·스쿼드 가이드 종합",
        date: team.lastUpdated,
        opponent: null,
        formation: recentFormation ?? expectedFormation ?? "확인 필요",
        result: null,
        sourceName: source.sourceName,
        sourceUrl: source.sourceUrl
      }
    ],
    formationNotes: [
      "최근 실제 경기 라인업과 공개 스쿼드 자료가 모두 확정되면 경기별 포메이션 이력을 더 촘촘하게 갱신합니다.",
      "현재 표시는 단일 고정 포메이션이 아니라 최근 자료 기준의 주 운용/예상/대체 구조입니다.",
      team.expectedLineup.notes.join(" ")
    ],
    tacticalShapeInPossession: team.tactics.buildUpStyle ?? team.tactics.attackingStyle,
    tacticalShapeOutOfPossession: team.tactics.defensiveStyle ?? team.tactics.pressingStyle,
    confidence: toEvidenceConfidence(team),
    sources: sourceList(team),
    lastUpdated: team.lastUpdated ?? analysisDate
  };
}

export function getTeamRiskProfile(team: TeamVerificationData): TeamRiskProfile {
  const trackedPlayers = watchPlayers(team);
  const defendersAndMidfielders = trackedPlayers.filter((player) => player.position === "DF" || player.position === "MF");
  const attackers = trackedPlayers.filter((player) => player.position === "FW" || player.position === "MF");
  const suspendedPlayers = team.players.filter((player) => player.suspensionStatus === "징계 결장" || player.suspensionStatus === "출전 금지");
  const doubtfulPlayers = team.players.filter((player) => player.availability === "출전 불투명" || player.injuryStatus === "출전 불투명");
  const injuredPlayers = team.players.filter((player) => player.injuryStatus === "경미한 부상" || player.injuryStatus === "결장");
  const sourceBasedStatus = team.dataStatus.risk === "추가 수집 필요" ? "추가 확인 필요" : "출전 가능";

  return {
    teamId: team.teamId,
    teamName: team.teamName,
    cardRisk: {
      summary:
        "옐로카드·레드카드 누적은 공식 경기 기록 또는 데이터 API 연동이 필요합니다. 현재는 수비/중원 핵심 선수 중심으로 경기 전 확인 대상자를 표시합니다.",
      yellowCardRiskPlayers: defendersAndMidfielders.slice(0, 5).map((player) =>
        riskItem(player, "경고 누적 확인", "수비 경합과 압박 빈도가 높은 포지션이라 경기 전 카드 누적 확인이 필요합니다.", sourceBasedStatus)
      ),
      redCardRiskPlayers: defendersAndMidfielders.slice(0, 2).map((player) =>
        riskItem(player, "퇴장 리스크 확인", "실제 퇴장 위험을 단정하지 않고, 공식 카드 기록 연동 전까지 확인 대상으로 분류합니다.", sourceBasedStatus)
      ),
      teamCardRiskLevel: defendersAndMidfielders.length >= 3 ? "보통" : "추가 확인 필요"
    },
    injuryRisk: {
      summary:
        injuredPlayers.length > 0 || doubtfulPlayers.length > 0
          ? "부상 또는 출전 불투명으로 표시된 선수가 있어 경기 전 공식 발표 확인이 필요합니다."
          : "공식 부상자 명단이 확정되지 않아 핵심 선수 상태를 경기 전 확인 대상으로 유지합니다.",
      injuredPlayers: injuredPlayers.map((player) =>
        riskItem(player, "부상", "부상 상태가 표시된 선수입니다. 복귀 가능성은 공식 발표로 재확인해야 합니다.", player.availability === "결장" ? "결장" : "출전 불투명")
      ),
      doubtfulPlayers:
        doubtfulPlayers.length > 0
          ? doubtfulPlayers.map((player) => riskItem(player, "출전 불투명", "출전 여부가 불투명한 선수입니다.", "출전 불투명"))
          : trackedPlayers.slice(0, 3).map((player) =>
              riskItem(player, "경기 전 컨디션 확인", "부상 공백을 단정하지 않고, 핵심 선수 컨디션 확인 대상으로 표시합니다.", "추가 확인 필요")
            ),
      keyPlayerInjuryRisk: injuredPlayers.some((player) => player.isKeyPlayer) ? "높음" : "추가 확인 필요"
    },
    suspensionRisk: {
      summary:
        suspendedPlayers.length > 0
          ? "징계 결장 또는 출전 금지 선수가 표시되어 있습니다."
          : "징계 결장 정보는 공식 경기 기록 연동 전까지 추가 확인 필요로 유지합니다.",
      suspendedPlayers: suspendedPlayers.map((player) =>
        riskItem(player, "징계 결장", "징계로 출전할 수 없는 선수입니다.", player.suspensionStatus === "출전 금지" ? "징계 결장" : "징계 결장")
      ),
      suspensionRiskPlayers: defendersAndMidfielders.slice(0, 4).map((player) =>
        riskItem(player, "징계 누적 확인", "경고 누적과 퇴장 징계 여부를 경기 전 공식 기록으로 확인해야 합니다.", "추가 확인 필요")
      )
    },
    fitnessRisk: {
      summary:
        "최근 출전 시간, 휴식일, 이동 거리, 연장전 피로도는 경기 일정과 이벤트 데이터가 들어오면 보정합니다. 현재는 핵심 선수 과부하 가능성을 확인 대상으로 표시합니다.",
      restDays: null,
      fatigueLevel: "추가 확인 필요",
      overloadedPlayers: attackers.slice(0, 4).map((player) =>
        riskItem(player, "체력/과부하 확인", "최근 출전 시간과 이동 일정 연동 전까지 과부하 가능성을 확인 대상으로 둡니다.", "추가 확인 필요")
      ),
      travelOrScheduleNotes: [
        "조별 경기 시간과 장소가 확정되면 휴식일과 이동 거리 변수를 계산합니다.",
        "토너먼트 연장전·승부차기 발생 시 다음 경기 피로도 가중치를 적용합니다.",
        "고령 선수 체력 리스크는 생년월일 데이터 연동 후 자동 보정합니다."
      ]
    },
    confidence: team.dataStatus.risk === "추가 수집 필요" ? "추가 확인 필요" : toEvidenceConfidence(team),
    sources: sourceList(team),
    lastUpdated: team.lastUpdated ?? analysisDate
  };
}

export function getKoreaVsTeamPrediction(team: TeamVerificationData): KoreaVsTeamPrediction {
  const korea = teamVerificationData.find((item) => item.teamId === "korea-republic") ?? team;
  const isKorea = team.teamId === "korea-republic";
  const koreaStrength = teamStrength(korea);
  const opponentStrength = isKorea ? koreaStrength : teamStrength(team);
  const gap = koreaStrength - opponentStrength;
  const drawProbability = isKorea ? 0 : clamp(Math.round(24 - Math.abs(gap) * 0.28), 8, 28);
  const remaining = 100 - drawProbability;
  const koreaShare = isKorea ? 100 : clamp(50 + gap * 1.08, 8, 88);
  const koreaWinProbability = isKorea ? 100 : Math.round((remaining * koreaShare) / 100);
  const opponentWinProbability = 100 - drawProbability - koreaWinProbability;
  const knockoutKorea = Math.round((koreaWinProbability / (koreaWinProbability + opponentWinProbability || 1)) * 100);
  const expectedKorea = isKorea ? 0 : clamp(Math.round(1.1 + gap / 38), 0, 4);
  const expectedOpponent = isKorea ? 0 : clamp(Math.round(1.1 - gap / 38), 0, 4);

  return {
    opponentTeamId: team.teamId,
    opponentTeamName: team.teamName,
    koreaWinProbability,
    drawProbability,
    opponentWinProbability,
    expectedScore: {
      korea: expectedKorea,
      opponent: expectedOpponent
    },
    knockoutWinnerProbability: {
      korea: isKorea ? 100 : knockoutKorea,
      opponent: isKorea ? 0 : 100 - knockoutKorea
    },
    keyFactorsForKorea: [
      korea.tactics.strengths[0] ?? "전환 속도와 세트피스 품질",
      korea.tactics.strengths[1] ?? "핵심 유럽파 활용",
      "김민재 유형의 수비 리더십과 손흥민 유형의 전환 마무리"
    ],
    keyRisksForKorea: [
      team.tactics.strengths[0] ? `${team.teamName} 강점: ${team.tactics.strengths[0]}` : "상대 강점 추가 확인 필요",
      korea.tactics.weaknesses[0] ?? "풀백 뒤 공간 관리",
      "부상·징계·카드·체력 변수는 경기 전 공식 발표로 재확인 필요"
    ],
    opponentStrengths: team.tactics.strengths.slice(0, 4),
    opponentWeaknesses: team.tactics.weaknesses.slice(0, 4),
    tacticalAdviceForKorea: isKorea
      ? [
          "대한민국 자체 분석입니다. 상대별 승률은 다른 국가 상세 페이지에서 확인할 수 있습니다.",
          korea.koreaStrategy.winScenario,
          korea.koreaStrategy.avoidScenario
        ]
      : [
          team.koreaStrategy.pressurePlan,
          team.koreaStrategy.defensivePlan,
          team.koreaStrategy.counterPlan,
          team.koreaStrategy.setPiecePlan
        ],
    uncertaintyFactors: [
      "승률은 공식 확률이 아니라 최근 자료와 내부 전력 지표 기반 예측입니다.",
      "확정 선발, 부상, 징계, 카드 누적, 휴식일이 들어오면 수치가 달라질 수 있습니다.",
      "토너먼트 가정은 무승부 없이 연장전·승부차기 최종 승자 확률로 별도 표시합니다."
    ],
    confidence: toEvidenceConfidence(team),
    generatedAt: analysisDate,
    sources: sourceList(team)
  };
}

export function getTeamAnalysisBundle(team: TeamVerificationData) {
  return {
    coachTacticalProfile: getCoachTacticalProfile(team),
    formationProfile: getTeamFormationProfile(team),
    riskProfile: getTeamRiskProfile(team),
    koreaPrediction: getKoreaVsTeamPrediction(team)
  };
}

export function getAllTeamAnalysisBundles() {
  return teamVerificationData.map((team) => ({
    teamId: team.teamId,
    ...getTeamAnalysisBundle(team)
  }));
}

export function getBrokenPlayerNameAudit() {
  return teamVerificationData.flatMap((team) =>
    team.players
      .filter((player) => hasBrokenDisplayText(player.playerName) || hasBrokenDisplayText(player.club))
      .map((player) => ({
        teamId: team.teamId,
        teamName: team.teamName,
        playerId: player.playerId,
        rawName: player.playerName,
        safeName: sanitizeDisplayText(player.playerName, "선수명 확인 필요"),
        rawClub: player.club,
        safeClub: sanitizeDisplayText(player.club, "소속팀 확인 필요")
      }))
      .filter((item) => hasBrokenDisplayText(item.safeName) || hasBrokenDisplayText(item.safeClub))
  );
}

export function getAdvancedTeamDataAudit() {
  const bundles = getAllTeamAnalysisBundles();
  const completeTactics = bundles.filter((item) => item.coachTacticalProfile.tacticalStrengths.length > 0).length;
  const completeFormations = bundles.filter((item) => Boolean(item.formationProfile.expectedFormation || item.formationProfile.recentFormation)).length;

  return {
    teamCount: teamVerificationData.length,
    completeTactics,
    completeFormations,
    riskProfiles: bundles.length,
    koreaPredictions: bundles.length,
    brokenNames: getBrokenPlayerNameAudit().length
  };
}

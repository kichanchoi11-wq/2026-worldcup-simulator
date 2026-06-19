import { NextResponse } from "next/server";
import {
  createFullTournamentPrediction,
  createLegacyGroupSimulation,
  createLegacyTournamentSimulation
} from "@/lib/fullTournamentPrediction";
import { createAIAnalysis } from "@/lib/aiAnalysisService";
import { fetchPredictionDataInputs } from "@/lib/predictionDataInputs";
import { getBaseGroups } from "@/lib/scenario";
import type { TeamGroup } from "@/types/football";

function compactPredictionForAI(prediction: ReturnType<typeof createFullTournamentPrediction>) {
  return {
    generatedAt: prediction.generatedAt,
    champion: prediction.champion?.nameKo ?? null,
    runnerUp: prediction.runnerUp?.nameKo ?? null,
    thirdPlace: prediction.thirdPlace?.nameKo ?? null,
    final: prediction.final
      ? {
          label: prediction.final.label,
          expectedScore: prediction.final.expectedScore,
          probabilities: prediction.final.probabilities,
          keyFactors: prediction.final.keyFactors,
          riskFactors: prediction.final.riskFactors,
          uncertaintyFactors: prediction.final.uncertaintyFactors,
          sources: prediction.final.sources.slice(0, 4)
        }
      : null,
    strongestTeams: prediction.teamProfiles
      .slice()
      .sort((a, b) => b.strengthScore - a.strengthScore)
      .slice(0, 8)
      .map((team) => ({
        name: team.nameKo,
        group: team.group,
        strengthScore: team.strengthScore,
        formation: team.formation,
        coachName: team.coachName,
        keyPlayers: team.keyPlayers,
        dataGaps: team.dataGaps
      })),
    dataDiagnostics: prediction.dataDiagnostics,
    uncertaintyFactors: prediction.uncertaintyFactors.slice(0, 8),
    sourceSummary: prediction.sourceSummary.slice(0, 8)
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { groups?: TeamGroup[] };
  const groups = Array.isArray(body.groups) && body.groups.length > 0 ? body.groups : getBaseGroups();
  const predictionInputs = await fetchPredictionDataInputs();
  const prediction = createFullTournamentPrediction(groups, predictionInputs);
  const aiAnalysis = await createAIAnalysis({
    kind: "refresh-summary",
    title: "전체 대회 AI 예측 한국어 설명",
    cacheKey: `full-tournament-prediction-${prediction.generatedAt.slice(0, 10)}-${groups.map((group) => group.id).join("")}`,
    instruction:
      "제공된 예측 계산 결과와 출처 진단만 바탕으로 한국어 설명을 만든다. 부상, 카드, 라인업, 감독 변화는 입력에 없는 내용을 새로 만들지 않는다. 예상 스코어와 우승 후보는 계산 결과를 설명하는 용도로만 사용한다.",
    input: compactPredictionForAI(prediction),
    fallbackSummary: "전체 대회 예측은 저장된 2026 대진, 팀 상세 데이터, API/fallback 진단을 기반으로 규칙 계산했습니다.",
    fallbackBullets: [
      "Groq/OpenRouter가 실패해도 기존 규칙 기반 예측은 그대로 표시됩니다.",
      "부상, 카드, 라인업, 감독 변화는 출처가 확인된 데이터만 반영합니다.",
      "최신 정보가 부족한 항목은 경기 전 공식 발표 확인이 필요합니다."
    ],
    fallbackDataGaps: ["최신 부상·징계·확정 라인업은 Tavily/Exa/API/관리자 입력으로 보강해야 합니다."],
    sources: ["API-Football", "football-data.org", "stored 2026 JSON", "Tavily/Exa search when configured"]
  });
  prediction.aiAnalysis = {
    status: aiAnalysis.status,
    provider: aiAnalysis.aiProvider ?? "rule-based",
    model: aiAnalysis.model,
    summary: aiAnalysis.summary,
    bulletPoints: aiAnalysis.bulletPoints,
    dataGaps: aiAnalysis.dataGaps,
    generatedAt: aiAnalysis.generatedAt,
    message: aiAnalysis.message
  };

  return NextResponse.json({
    ok: true,
    prediction,
    legacyGroupSimulation: createLegacyGroupSimulation(prediction),
    legacyTournamentSimulation: createLegacyTournamentSimulation(prediction),
    diagnostics: predictionInputs.diagnostics
  });
}

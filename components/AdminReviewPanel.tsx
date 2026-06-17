"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import AdminRecollectionPanel from "@/components/AdminRecollectionPanel";
import Badge from "@/components/Badge";
import DataPipelineDiagnosticsPanel from "@/components/DataPipelineDiagnosticsPanel";
import FootballDataRefreshPanel from "@/components/FootballDataRefreshPanel";
import { createMatchPageData, matchDetails } from "@/data/matchDetails";
import { teamVerificationData } from "@/data/teamVerificationData";
import { createMatchReview, isFinishedMatch } from "@/lib/matchReviewService";
import { getAdvancedTeamDataAudit, getBrokenPlayerNameAudit } from "@/lib/teamAnalysis";
import { validateGroupStageForTournament } from "@/lib/bracket";
import { getGroupDataAudit } from "@/lib/scenario";
import { migrateStoredFootballData, readArrayStorage, readStorage, removeStorageItem, storageKeys, writeStorage } from "@/lib/storage";
import type { FootballDataRefreshSnapshot } from "@/lib/autoUpdateService";
import type { ApiFootballResourceSnapshot, FootballApiEnvelope, FootballMatch, StandingRow, WorldCupGroupSlot } from "@/types/football";
import type { FullTournamentPrediction, GroupSimulationData, ScenarioCalculatorData } from "@/types/simulation";

type GroupId = WorldCupGroupSlot["groupId"];
type GroupPosition = WorldCupGroupSlot["position"];
type ManualGroupEntry = {
  groupId: GroupId;
  position: GroupPosition;
  teamName: string;
  teamCode: string;
  sourceName: string;
  sourceUrl: string;
  lastUpdated: string;
  verificationStatus: "수동 확인" | "공식 확인";
};

const groupIds: GroupId[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
const positions: GroupPosition[] = [1, 2, 3, 4];

const emptyManualEntry: ManualGroupEntry = {
  groupId: "A",
  position: 1,
  teamName: "",
  teamCode: "",
  sourceName: "",
  sourceUrl: "",
  lastUpdated: "",
  verificationStatus: "수동 확인"
};

type AdminStorageSnapshot = {
  aiGroup: GroupSimulationData | null;
  fullPrediction: FullTournamentPrediction | null;
  scenario: ScenarioCalculatorData | null;
  apiMatches: FootballMatch[];
  apiStandings: StandingRow[];
  apiResourceSnapshots: ApiFootballResourceSnapshot[];
  apiProviderStatus: FootballDataRefreshSnapshot["data"]["providerStatus"] | null;
  manualEntries: ManualGroupEntry[];
};

const emptyStorageSnapshot: AdminStorageSnapshot = {
  aiGroup: null,
  fullPrediction: null,
  scenario: null,
  apiMatches: [],
  apiStandings: [],
  apiResourceSnapshots: [],
  apiProviderStatus: null,
  manualEntries: []
};

export default function AdminReviewPanel() {
  const [version, setVersion] = useState(0);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [teamRefreshMessage, setTeamRefreshMessage] = useState<string | null>(null);
  const [adminToolMessage, setAdminToolMessage] = useState<string | null>(null);
  const [geminiReviewMessage, setGeminiReviewMessage] = useState<string | null>(null);
  const [manualEntry, setManualEntry] = useState<ManualGroupEntry>(emptyManualEntry);
  const [storageSnapshot, setStorageSnapshot] = useState<AdminStorageSnapshot>(emptyStorageSnapshot);

  const audit = getGroupDataAudit();
  const totalTeamBlocks = teamVerificationData.length * 5;
  const filledTeamBlocks = teamVerificationData.reduce((sum, team) => {
    const blocks = [
      team.players.length > 0,
      Boolean(team.coach.coachName && team.coach.sourceName && team.coach.sourceUrl && team.coach.lastUpdated),
      Boolean(team.formation.formation && team.formation.sourceName && team.formation.sourceUrl && team.formation.lastUpdated),
      Boolean(team.expectedLineup.formation && team.expectedLineup.sourceName && team.expectedLineup.sourceUrl && team.expectedLineup.lastUpdated),
      Boolean(team.tactics.summary && team.tactics.sourceName && team.tactics.sourceUrl && team.tactics.lastUpdated)
    ];

    return sum + blocks.filter(Boolean).length;
  }, 0);
  const allTeamSources = teamVerificationData.flatMap((team) => team.sources);
  const uniqueTeamSources = new Set(allTeamSources.map((source) => `${source.sourceName ?? "unknown"}-${source.sourceUrl ?? "unknown"}`));
  const officialSources = allTeamSources.filter((source) => source.sourceLevel === "공식 확인").length;
  const highTrustSources = allTeamSources.filter((source) => source.sourceLevel === "공식 확인" || source.sourceLevel === "신뢰도 높음").length;
  const referenceSources = allTeamSources.filter((source) => source.sourceLevel === "참고 자료").length;
  const pendingSources = allTeamSources.filter((source) => source.sourceLevel === "확인 필요" || !source.sourceLevel).length;
  const totalPlayers = teamVerificationData.reduce((sum, team) => sum + team.players.length, 0);
  const teamDetailAudit = {
    total: teamVerificationData.length,
    playerCount: totalPlayers,
    averagePlayers: teamVerificationData.length === 0 ? 0 : Math.round(totalPlayers / teamVerificationData.length),
    teamsBelowFullRoster: teamVerificationData.filter((team) => team.players.length < 23).length,
    missingSquads: teamVerificationData.filter((team) => team.players.length === 0).length,
    missingCoaches: teamVerificationData.filter((team) => !team.coach.coachName || !team.coach.sourceName || !team.coach.sourceUrl || !team.coach.lastUpdated).length,
    missingFormations: teamVerificationData.filter((team) => !team.formation.formation || !team.formation.sourceUrl).length,
    missingTactics: teamVerificationData.filter((team) => !team.tactics.summary || !team.tactics.sourceUrl).length,
    fillRate: totalTeamBlocks === 0 ? 0 : Math.round((filledTeamBlocks / totalTeamBlocks) * 100),
    sourceCount: uniqueTeamSources.size,
    officialSources,
    highTrustSources,
    referenceSources,
    pendingSources
  };
  const matchDetailAudit = {
    total: matchDetails.length,
    missingDates: matchDetails.filter((match) => !match.dateTime).length,
    missingStadiums: matchDetails.filter((match) => !match.stadium).length
  };
  const matchPageAudits = matchDetails.map((match) => {
    const pageData = createMatchPageData(match);
    return {
      pageData,
      review: createMatchReview(pageData)
    };
  });
  const reviewCandidates = matchPageAudits.filter((item) => Boolean(item.review));
  const matchDataAudit = {
    finishedMatches: matchDetails.filter(isFinishedMatch).length,
    generatedReviews: reviewCandidates.length,
    missingReviews: matchDetails.filter(isFinishedMatch).length - reviewCandidates.length,
    missingCardEvents: matchPageAudits.filter((item) => item.pageData.dataGaps.some((gap) => gap.id === "card-events")).length,
    missingCardTotals: matchPageAudits.filter((item) => item.pageData.dataGaps.some((gap) => gap.id === "player-card-totals")).length,
    missingSuspensions: matchPageAudits.filter((item) => item.pageData.dataGaps.some((gap) => gap.id === "suspensions")).length,
    missingInjuries: matchPageAudits.filter((item) => item.pageData.dataGaps.some((gap) => gap.id === "injuries")).length,
    missingFitness: matchPageAudits.filter((item) => item.pageData.dataGaps.some((gap) => gap.id === "fitness")).length,
    criticalGaps: matchPageAudits.reduce((sum, item) => sum + item.pageData.dataGaps.filter((gap) => gap.severity === "critical").length, 0)
  };
  const advancedAudit = getAdvancedTeamDataAudit();
  const brokenNameAudit = getBrokenPlayerNameAudit();
  const snapshot = {
    aiGroup: storageSnapshot.aiGroup,
    scenario: storageSnapshot.scenario,
    aiValidation: validateGroupStageForTournament(storageSnapshot.aiGroup),
    scenarioValidation: validateGroupStageForTournament(storageSnapshot.scenario)
  };
  const apiUsage = storageSnapshot.apiProviderStatus?.apiFootball;
  const apiCacheEntryCount = Array.isArray(storageSnapshot.apiProviderStatus?.cacheEntries) ? storageSnapshot.apiProviderStatus.cacheEntries.length : 0;
  const providerOrder = Array.isArray(storageSnapshot.apiProviderStatus?.providerOrder)
    ? storageSnapshot.apiProviderStatus.providerOrder.join(" → ")
    : "api-football → football-data.org → cache → static";
  const predictedQualifiedTeamCount = Array.isArray(storageSnapshot.fullPrediction?.qualifiedTeams)
    ? storageSnapshot.fullPrediction.qualifiedTeams.length
    : snapshot.aiValidation.count;
  const refreshStable = storageSnapshot.fullPrediction?.refreshStatus?.stable === true;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setStorageSnapshot({
        aiGroup: readStorage<GroupSimulationData | null>(storageKeys.aiGroupSimulationData, null),
        fullPrediction: readStorage<FullTournamentPrediction | null>(storageKeys.fullTournamentPredictionData, null),
        scenario: readStorage<ScenarioCalculatorData | null>(storageKeys.scenarioCalculatorData, null),
        apiMatches: readArrayStorage<FootballMatch>(storageKeys.apiMatchesData),
        apiStandings: readArrayStorage<StandingRow>(storageKeys.apiStandingsData),
        apiResourceSnapshots: readArrayStorage<ApiFootballResourceSnapshot>(storageKeys.apiFootballResourceSnapshotsData),
        apiProviderStatus: readStorage<FootballDataRefreshSnapshot["data"]["providerStatus"] | null>(storageKeys.apiFootballProviderStatusData, null),
        manualEntries: readArrayStorage<ManualGroupEntry>(storageKeys.adminManualGroupEntries)
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [version]);

  function removeKey(key: keyof typeof storageKeys) {
    removeStorageItem(storageKeys[key]);
    setVersion((current) => current + 1);
  }

  function resetAiPredictionData() {
    removeStorageItem(storageKeys.fullTournamentPredictionData);
    removeStorageItem(storageKeys.aiGroupSimulationData);
    removeStorageItem(storageKeys.aiTournamentSimulationData);
    setVersion((current) => current + 1);
  }

  function requestTeamRefresh(scope: "single" | "all") {
    setTeamRefreshMessage(
      scope === "single"
        ? "팀별 재수집 요청을 기록했습니다. 현재 선수단/감독/전술 데이터는 정적 코드 데이터라 다음 코드 업데이트 때 반영해야 합니다."
        : "전체 팀 정보 재수집 요청을 기록했습니다. FourFourTwo, FIFA, 축구 데이터 사이트 기준으로 재확인 후 코드 배포가 필요합니다."
    );
  }

  function runBrokenNameAudit() {
    setAdminToolMessage(
      brokenNameAudit.length === 0
        ? "깨진 선수명 검사 완료: 현재 표시 단계에서 보정이 필요한 선수명이 없습니다."
        : `깨진 선수명 검사 완료: ${brokenNameAudit.length}건이 감지되었습니다. 화면 표시 단계에서는 안전한 이름으로 보정합니다.`
    );
  }

  function runLocalStorageMigration() {
    const result = migrateStoredFootballData();
    setAdminToolMessage(
      result.migrated
        ? `localStorage 마이그레이션 완료: ${result.touchedKeys.join(", ")} 항목을 보정했습니다.`
        : "localStorage 마이그레이션 완료: 추가로 보정할 저장 데이터가 없습니다."
    );
    setVersion((current) => current + 1);
  }

  function runStaleDataCleanupCheck() {
    setAdminToolMessage(
      "오래된 데이터 정리 점검 완료: AI 예측, API 경기, 수동 입력 데이터는 분리 저장 중입니다. 삭제는 아래 개별 초기화 버튼으로만 수행합니다."
    );
  }

  async function regenerateGeminiReview() {
    const candidate = reviewCandidates[0];

    if (!candidate) {
      setGeminiReviewMessage("종료 경기 또는 실제 스코어가 없어 Gemini 리뷰 재생성 대상이 없습니다.");
      return;
    }

    setGeminiReviewMessage("Gemini 경기 리뷰를 서버 Route에서 생성하는 중입니다.");

    try {
      const response = await fetch("/api/gemini/match-review", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ matchId: candidate.pageData.detail.matchId })
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        usedGemini?: boolean;
        message?: string;
        review?: { metadata?: { generatedBy?: string; model?: string | null; generatedAt?: string } } | null;
      };

      setGeminiReviewMessage(
        payload.ok
          ? `${payload.message ?? "리뷰 생성 완료"} 생성 방식: ${payload.review?.metadata?.generatedBy ?? (payload.usedGemini ? "gemini" : "fallback")} / 모델: ${payload.review?.metadata?.model ?? "내부 규칙"}`
          : payload.message ?? "Gemini 리뷰 생성에 실패했습니다."
      );
    } catch {
      setGeminiReviewMessage("Gemini 리뷰 API 호출에 실패했습니다. 기존 리뷰와 저장 데이터는 유지합니다.");
    }
  }

  async function refreshApiData() {
    setApiMessage("API 데이터를 확인하는 중입니다.");

    try {
      const [matchesResponse, standingsResponse, statusResponse] = await Promise.all([
        fetch("/api/football/matches"),
        fetch("/api/football/standings"),
        fetch("/api/football/provider-status")
      ]);

      const matchesPayload = (await matchesResponse.json()) as FootballApiEnvelope<FootballMatch[]>;
      const standingsPayload = (await standingsResponse.json()) as FootballApiEnvelope<StandingRow[]>;
      const statusPayload = (await statusResponse.json()) as {
        ok: boolean;
        data?: FootballDataRefreshSnapshot["data"]["providerStatus"];
      };

      if (matchesPayload.ok && matchesPayload.data.length > 0) {
        writeStorage(storageKeys.apiMatchesData, matchesPayload.data);
      }

      if (standingsPayload.ok && standingsPayload.data.length > 0) {
        writeStorage(storageKeys.apiStandingsData, standingsPayload.data);
      }

      if (statusPayload.ok && statusPayload.data) {
        writeStorage(storageKeys.apiFootballProviderStatusData, statusPayload.data);
      }

      const messages = [matchesPayload.message, standingsPayload.message].filter(Boolean);
      setApiMessage(
        messages.length > 0
          ? messages.join(" ")
          : `API 새로고침 완료: 경기 ${matchesPayload.data.length}개, 순위 ${standingsPayload.data.length}개를 확인했습니다.`
      );
      setVersion((current) => current + 1);
    } catch {
      setApiMessage("API 새로고침에 실패했습니다. 저장된 API 데이터와 사용자 입력 데이터는 유지합니다.");
    }
  }

  function saveManualEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const requiredFields = [
      manualEntry.teamName.trim(),
      manualEntry.sourceName.trim(),
      manualEntry.sourceUrl.trim(),
      manualEntry.lastUpdated.trim()
    ];

    if (requiredFields.some((field) => field.length === 0)) {
      setSaveMessage("팀명, 출처명, 출처 URL, 확인 날짜가 모두 있어야 저장할 수 있습니다.");
      return;
    }

    if (manualEntry.verificationStatus === "공식 확인" && !manualEntry.sourceUrl.startsWith("http")) {
      setSaveMessage("공식 확인 데이터는 검증 가능한 URL이 필요합니다.");
      return;
    }

    const nextEntries = [
      ...storageSnapshot.manualEntries,
      {
        ...manualEntry,
        teamName: manualEntry.teamName.trim(),
        teamCode: manualEntry.teamCode.trim().toUpperCase(),
        sourceName: manualEntry.sourceName.trim(),
        sourceUrl: manualEntry.sourceUrl.trim(),
        lastUpdated: manualEntry.lastUpdated.trim()
      }
    ];

    writeStorage(storageKeys.adminManualGroupEntries, nextEntries);
    setManualEntry(emptyManualEntry);
    setSaveMessage("출처가 있는 수동 입력 검토 항목을 저장했습니다. 실제 기본 데이터 반영은 코드 리뷰 후 진행하세요.");
    setVersion((current) => current + 1);
  }

  return (
    <section className="space-y-5">
      <div className="rounded border border-red-300/25 bg-red-400/10 p-5">
        <h2 className="text-xl font-black text-white">관리자 검토 모드</h2>
        <p className="mt-2 text-sm leading-relaxed text-red-50/80">
          팀 정보는 공식 출처와 신뢰 가능한 스쿼드 가이드를 분리해 표시합니다. 경기 직전 바뀌는 부상/징계/카드/확정 선발은 추가 수집 필요 상태로 유지합니다.
        </p>
      </div>

      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-8">
        <StatusItem label="조 수" value={`${audit.groupCount}개`} tone="neutral" />
        <StatusItem label="국가명 표시" value={`${audit.teamCount - audit.emptySlots.length}팀`} tone="success" />
        <StatusItem label="공식 확정" value={`${audit.officiallyConfirmed.length}팀`} tone={audit.officiallyConfirmed.length > 0 ? "success" : "warning"} />
        <StatusItem label="공식 재확인" value={`${audit.sourceReviewRequired.length}팀`} tone="warning" />
        <StatusItem label="빈 자리" value={`${audit.emptySlots.length}개`} tone={audit.emptySlots.length > 0 ? "warning" : "success"} />
        <StatusItem label="수동 확인" value={`${audit.manuallyVerified.length}팀`} tone="warning" />
        <StatusItem label="저장 경기" value={`${storageSnapshot.apiMatches.length}개`} tone="API 실제 데이터" />
        <StatusItem
          label="API-Football"
          value={`${apiUsage?.used ?? 0}/${apiUsage?.limit ?? 100}회`}
          tone={apiUsage?.blocked ? "warning" : "success"}
        />
      </section>

      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-black text-white">국가·경기 상세 데이터 검증</h3>
            <p className="mt-1 text-sm text-white/60">감독·핵심 선수·전술·포메이션은 출처 수준을 함께 표시하고, 채움률과 출처 수를 이 패널에서 확인합니다.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/teams/korea-republic" className="rounded border border-trophy/60 bg-trophy/20 px-3 py-2 text-sm font-black text-white">
              국가 상세 미리보기
            </Link>
            <Link href="/matches/group-a-3" className="rounded border border-sky-300/50 bg-sky-400/15 px-3 py-2 text-sm font-black text-white">
              경기 상세 미리보기
            </Link>
            <button type="button" onClick={() => requestTeamRefresh("single")} className="rounded border border-emerald-300/50 bg-emerald-400/15 px-3 py-2 text-sm font-black text-white">
              팀별 데이터 재수집
            </button>
            <button type="button" onClick={() => requestTeamRefresh("all")} className="rounded border border-amber-300/50 bg-amber-400/15 px-3 py-2 text-sm font-black text-white">
              전체 팀 정보 재수집
            </button>
          </div>
        </div>
        {teamRefreshMessage ? <p className="mt-4 rounded border border-white/10 bg-white/8 p-3 text-sm text-white/75">{teamRefreshMessage}</p> : null}
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <DebugItem label="국가 상세 페이지 수" value={`${teamDetailAudit.total}개`} />
          <DebugItem label="총 선수 수" value={`${teamDetailAudit.playerCount}명`} />
          <DebugItem label="팀 평균 선수 수" value={`${teamDetailAudit.averagePlayers}명`} />
          <DebugItem label="23명 미만 팀" value={`${teamDetailAudit.teamsBelowFullRoster}개`} />
          <DebugItem label="팀 정보 채움률" value={`${teamDetailAudit.fillRate}%`} />
          <DebugItem label="고유 출처 수" value={`${teamDetailAudit.sourceCount}개`} />
          <DebugItem label="공식 출처 항목" value={`${teamDetailAudit.officialSources}개`} />
          <DebugItem label="공식/고신뢰 출처 항목" value={`${teamDetailAudit.highTrustSources}개`} />
          <DebugItem label="참고 자료 출처 항목" value={`${teamDetailAudit.referenceSources}개`} />
          <DebugItem label="추가 확인 출처 항목" value={`${teamDetailAudit.pendingSources}개`} />
          <DebugItem label="선수 명단 출처 확인 필요" value={`${teamDetailAudit.missingSquads}개`} />
          <DebugItem label="감독 재검증 필요" value={`${teamDetailAudit.missingCoaches}개`} />
          <DebugItem label="포메이션 재검증 필요" value={`${teamDetailAudit.missingFormations}개`} />
          <DebugItem label="전술 재검증 필요" value={`${teamDetailAudit.missingTactics}개`} />
          <DebugItem label="경기 상세 페이지 수" value={`${matchDetailAudit.total}개`} />
          <DebugItem label="경기 일정 확인 필요" value={`${matchDetailAudit.missingDates}개`} />
          <DebugItem label="경기장 확인 필요" value={`${matchDetailAudit.missingStadiums}개`} />
        </div>
        <div className="mt-4 space-y-4">
          <DataPipelineDiagnosticsPanel onSnapshotChange={() => setVersion((current) => current + 1)} />
          <AdminRecollectionPanel onSnapshotChange={() => setVersion((current) => current + 1)} />
        </div>
      </section>

      <FootballDataRefreshPanel />

      <section className="rounded border border-emerald-300/25 bg-emerald-400/10 p-5 shadow-panel">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-black text-white">전술·리스크 자동 보강 감사</h3>
            <p className="mt-1 text-sm leading-6 text-emerald-50/75">
              감독 전술, 포메이션, 카드·부상·징계·체력 프로필, 대한민국 상대 승률, 선수명 보정 상태를 코드 데이터 기준으로 점검합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={runBrokenNameAudit} className="rounded border border-emerald-300/50 bg-emerald-400/15 px-3 py-2 text-sm font-black text-white">
              깨진 선수 이름 데이터 검사
            </button>
            <button type="button" onClick={runLocalStorageMigration} className="rounded border border-sky-300/50 bg-sky-400/15 px-3 py-2 text-sm font-black text-white">
              localStorage 마이그레이션
            </button>
            <button type="button" onClick={runStaleDataCleanupCheck} className="rounded border border-amber-300/50 bg-amber-400/15 px-3 py-2 text-sm font-black text-white">
              오래된 데이터 정리 점검
            </button>
            <button type="button" onClick={regenerateGeminiReview} className="rounded border border-violet-300/50 bg-violet-400/15 px-3 py-2 text-sm font-black text-white">
              Gemini 경기 리뷰 재생성
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <DebugItem label="감사 대상 팀" value={`${advancedAudit.teamCount}팀`} />
          <DebugItem label="감독 전술 보강" value={`${advancedAudit.completeTactics}팀`} />
          <DebugItem label="포메이션 보강" value={`${advancedAudit.completeFormations}팀`} />
          <DebugItem label="리스크 프로필" value={`${advancedAudit.riskProfiles}팀`} />
          <DebugItem label="대한민국 상대 승률" value={`${advancedAudit.koreaPredictions}팀`} />
          <DebugItem label="깨진 선수명 감지" value={`${advancedAudit.brokenNames}건`} />
          <DebugItem label="종료 경기" value={`${matchDataAudit.finishedMatches}경기`} />
          <DebugItem label="생성된 경기 리뷰" value={`${matchDataAudit.generatedReviews}건`} />
          <DebugItem label="리뷰 누락" value={`${matchDataAudit.missingReviews}건`} />
          <DebugItem label="카드 이벤트 미연동" value={`${matchDataAudit.missingCardEvents}경기`} />
          <DebugItem label="카드 누적 미연동" value={`${matchDataAudit.missingCardTotals}경기`} />
          <DebugItem label="징계 재확인" value={`${matchDataAudit.missingSuspensions}경기`} />
          <DebugItem label="부상 재확인" value={`${matchDataAudit.missingInjuries}경기`} />
          <DebugItem label="체력 계산 보류" value={`${matchDataAudit.missingFitness}경기`} />
          <DebugItem label="치명 결측" value={`${matchDataAudit.criticalGaps}건`} />
        </div>
        {adminToolMessage ? <p className="mt-4 rounded border border-white/10 bg-white/8 p-3 text-sm text-white/75">{adminToolMessage}</p> : null}
        {geminiReviewMessage ? <p className="mt-4 rounded border border-violet-300/25 bg-violet-400/10 p-3 text-sm text-violet-50/80">{geminiReviewMessage}</p> : null}
        {brokenNameAudit.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {brokenNameAudit.slice(0, 6).map((item) => (
              <div key={`${item.teamId}-${item.playerId}`} className="rounded border border-white/10 bg-pitch-900/80 p-3">
                <p className="text-xs font-semibold text-white/45">{item.teamName}</p>
                <p className="mt-1 break-words text-sm font-black text-white">{item.safeName}</p>
                <p className="mt-1 break-words text-xs text-white/50">원본: {item.rawName}</p>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded border border-violet-300/25 bg-violet-400/10 p-5 shadow-panel">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-black text-white">AI 예측 데이터 상태</h3>
            <p className="mt-1 text-sm text-violet-50/75">
              조별리그, 32강, 토너먼트, 전체 대회 AI 예측 결과를 실제 경기 데이터와 분리해 저장합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={resetAiPredictionData}
            className="rounded border border-red-300/50 bg-red-400/15 px-3 py-2 text-sm font-black text-white transition hover:bg-red-400/25"
          >
            AI 예측 데이터 전체 초기화
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <DebugItem label="전체 예측 생성 여부" value={storageSnapshot.fullPrediction ? "있음" : "없음"} />
          <DebugItem label="예측 생성 시각" value={storageSnapshot.fullPrediction?.generatedAt ?? "생성 전"} />
          <DebugItem label="AI 32강 진출팀 수" value={`${predictedQualifiedTeamCount}팀`} />
          <DebugItem label="예상 우승팀" value={storageSnapshot.fullPrediction?.champion?.nameKo ?? "예측 전"} />
          <DebugItem label="새로고침 안정성" value={refreshStable ? "안정" : "버튼 제외"} />
        </div>
      </section>

      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-white">API 실제 데이터 새로고침</h3>
            <p className="mt-1 text-sm text-white/60">경기·순위 API 응답은 사용자 입력, AI 예측, 경우의 수 데이터와 분리해 저장합니다.</p>
          </div>
          <button
            type="button"
            onClick={refreshApiData}
            className="rounded border border-sky-300/60 bg-sky-400/15 px-4 py-2 text-sm font-black text-white transition hover:bg-sky-400/25"
          >
            API 데이터 확인
          </button>
        </div>
        {apiMessage ? <p className="mt-4 rounded border border-white/10 bg-white/8 p-3 text-sm text-white/75">{apiMessage}</p> : null}
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <DebugItem
            label="API-Football 호출"
            value={`${apiUsage?.used ?? 0}/${apiUsage?.limit ?? 100}회`}
          />
          <DebugItem label="남은 호출" value={`${apiUsage?.remaining ?? 100}회`} />
          <DebugItem label="리소스 저장 구조" value={`${storageSnapshot.apiResourceSnapshots.length}종`} />
          <DebugItem label="서버 캐시 항목" value={`${apiCacheEntryCount}개`} />
          <DebugItem label="fallback 순서" value={providerOrder} />
        </div>
      </section>

      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <h3 className="font-black text-white">조 편성 데이터 감사</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {audit.slotLabels.map(({ team, label }) => (
            <article key={team.id} className="rounded border border-white/10 bg-pitch-900/80 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-trophy">{label}</p>
                  <p className="mt-1 font-semibold text-white">{team.nameKo}</p>
                  <p className="mt-1 text-xs text-white/50">{team.teamCode ?? "팀 코드 확인 필요"}</p>
                </div>
                <Badge tone={team.verificationStatus}>{team.verificationStatus}</Badge>
              </div>
              <p className="mt-3 line-clamp-2 text-xs leading-5 text-white/55">
                {team.sourceName ?? "공식 출처 확인 필요"}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <h3 className="font-black text-white">수동 조 편성 입력 검토</h3>
        <form onSubmit={saveManualEntry} className="mt-4 grid gap-3 lg:grid-cols-6">
          <label className="space-y-1">
            <span className="text-xs font-semibold text-white/60">조</span>
            <select
              value={manualEntry.groupId}
              onChange={(event) => setManualEntry((current) => ({ ...current, groupId: event.target.value as GroupId }))}
              className="w-full rounded border border-white/15 bg-pitch-900 px-3 py-2 text-sm text-white"
            >
              {groupIds.map((groupId) => (
                <option key={groupId} value={groupId}>{groupId}조</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-white/60">자리</span>
            <select
              value={manualEntry.position}
              onChange={(event) => setManualEntry((current) => ({ ...current, position: Number(event.target.value) as GroupPosition }))}
              className="w-full rounded border border-white/15 bg-pitch-900 px-3 py-2 text-sm text-white"
            >
              {positions.map((position) => (
                <option key={position} value={position}>{position}번</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 lg:col-span-2">
            <span className="text-xs font-semibold text-white/60">팀명</span>
            <input
              value={manualEntry.teamName}
              onChange={(event) => setManualEntry((current) => ({ ...current, teamName: event.target.value }))}
              className="w-full rounded border border-white/15 bg-pitch-900 px-3 py-2 text-sm text-white"
              placeholder="예: 대한민국"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-white/60">팀 코드</span>
            <input
              value={manualEntry.teamCode}
              onChange={(event) => setManualEntry((current) => ({ ...current, teamCode: event.target.value }))}
              className="w-full rounded border border-white/15 bg-pitch-900 px-3 py-2 text-sm text-white"
              placeholder="KOR"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-white/60">상태</span>
            <select
              value={manualEntry.verificationStatus}
              onChange={(event) =>
                setManualEntry((current) => ({ ...current, verificationStatus: event.target.value as ManualGroupEntry["verificationStatus"] }))
              }
              className="w-full rounded border border-white/15 bg-pitch-900 px-3 py-2 text-sm text-white"
            >
              <option value="수동 확인">수동 확인</option>
              <option value="공식 확인">공식 확인</option>
            </select>
          </label>
          <label className="space-y-1 lg:col-span-2">
            <span className="text-xs font-semibold text-white/60">출처명</span>
            <input
              value={manualEntry.sourceName}
              onChange={(event) => setManualEntry((current) => ({ ...current, sourceName: event.target.value }))}
              className="w-full rounded border border-white/15 bg-pitch-900 px-3 py-2 text-sm text-white"
              placeholder="예: FIFA match centre"
            />
          </label>
          <label className="space-y-1 lg:col-span-3">
            <span className="text-xs font-semibold text-white/60">출처 URL</span>
            <input
              value={manualEntry.sourceUrl}
              onChange={(event) => setManualEntry((current) => ({ ...current, sourceUrl: event.target.value }))}
              className="w-full rounded border border-white/15 bg-pitch-900 px-3 py-2 text-sm text-white"
              placeholder="https://..."
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-white/60">확인 날짜</span>
            <input
              type="date"
              value={manualEntry.lastUpdated}
              onChange={(event) => setManualEntry((current) => ({ ...current, lastUpdated: event.target.value }))}
              className="w-full rounded border border-white/15 bg-pitch-900 px-3 py-2 text-sm text-white"
            />
          </label>
          <button
            type="submit"
            className="rounded border border-trophy/60 bg-trophy/20 px-4 py-2 text-sm font-black text-white transition hover:bg-trophy/30 lg:col-span-6"
          >
            출처 포함 검토 항목 저장
          </button>
        </form>
        {saveMessage ? <p className="mt-4 rounded border border-white/10 bg-white/8 p-3 text-sm text-white/75">{saveMessage}</p> : null}
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <button type="button" onClick={() => removeKey("aiGroupSimulationData")} className="rounded border border-white/10 bg-white/[0.06] p-4 text-left font-black text-white hover:bg-white/10">
          AI 조별리그 결과 삭제
        </button>
        <button type="button" onClick={() => removeKey("aiTournamentSimulationData")} className="rounded border border-white/10 bg-white/[0.06] p-4 text-left font-black text-white hover:bg-white/10">
          AI 토너먼트 결과 삭제
        </button>
        <button type="button" onClick={() => removeKey("fullTournamentPredictionData")} className="rounded border border-violet-300/30 bg-violet-400/10 p-4 text-left font-black text-white hover:bg-violet-400/20">
          전체 AI 예측 결과 삭제
        </button>
        <button type="button" onClick={() => removeKey("scenarioCalculatorData")} className="rounded border border-white/10 bg-white/[0.06] p-4 text-left font-black text-white hover:bg-white/10">
          경우의 수 데이터 삭제
        </button>
        <button type="button" onClick={() => removeKey("apiMatchesData")} className="rounded border border-sky-300/30 bg-sky-400/10 p-4 text-left font-black text-white hover:bg-sky-400/20">
          저장 API 경기 삭제
        </button>
      </div>

      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <h3 className="font-black text-white">디버그 정보</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DebugItem label="관리자 새로고침 횟수" value={`${version}회`} />
          <DebugItem label="AI 조별리그 완료 여부" value={snapshot.aiGroup ? "있음" : "없음"} />
          <DebugItem label="전체 AI 예측 완료 여부" value={storageSnapshot.fullPrediction ? "있음" : "없음"} />
          <DebugItem label="AI 32강 진출팀 수" value={`${snapshot.aiValidation.count}팀`} />
          <DebugItem label="전체 AI 브래킷 경기 수" value={`${storageSnapshot.fullPrediction ? 32 : 0}경기`} />
          <DebugItem label="경우의 수 계산기 32강 진출팀 수" value={`${snapshot.scenarioValidation.count}팀`} />
          <DebugItem label="API 실제 경기 수" value={`${storageSnapshot.apiMatches.length}개`} />
          <DebugItem label="API 실제 순위 수" value={`${storageSnapshot.apiStandings.length}개`} />
          <DebugItem label="중복 팀 여부" value={snapshot.aiValidation.duplicateTeams.length > 0 ? "있음" : "없음"} />
          <DebugItem label="토너먼트 대진 생성 가능 여부" value={snapshot.aiValidation.canStart || snapshot.scenarioValidation.canStart ? "가능" : "확인 필요"} />
          <DebugItem label="현재 선택된 데이터 출처" value="관리자 검토" />
        </div>
      </section>
    </section>
  );
}

function StatusItem({ label, value, tone }: { label: string; value: string; tone: Parameters<typeof Badge>[0]["tone"] }) {
  return (
    <div className="rounded border border-white/10 bg-white/[0.06] p-4">
      <Badge tone={tone}>{label}</Badge>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function DebugItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/10 bg-pitch-900/80 p-3">
      <p className="text-xs text-white/50">{label}</p>
      <p className="mt-1 font-black text-white">{value}</p>
    </div>
  );
}

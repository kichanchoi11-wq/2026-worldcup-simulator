import { notFound } from "next/navigation";
import Badge from "@/components/Badge";
import FlagIcon from "@/components/FlagIcon";
import FormationBoard from "@/components/FormationBoard";
import FootballDataRefreshPanel from "@/components/FootballDataRefreshPanel";
import TeamPlayerRoster from "@/components/TeamPlayerRoster";
import { getTeamAnalysisBundle } from "@/lib/teamAnalysis";
import { getAllTeamIds, getTeamDetailRecord, hasCompleteSource } from "@/lib/teamDetails";
import { sanitizeDisplayText } from "@/lib/textSanitizer";
import type { SourceMeta } from "@/types/football";
import type { EvidenceConfidence, PlayerRiskItem } from "@/types/team";

export function generateStaticParams() {
  return getAllTeamIds().map((teamId) => ({ teamId }));
}

export default async function TeamDetailPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const record = getTeamDetailRecord(teamId);

  if (!record) {
    notFound();
  }

  const { team, detail } = record;
  const analysis = getTeamAnalysisBundle(detail);
  const { coachTacticalProfile, formationProfile, koreaPrediction, riskProfile } = analysis;
  const verifiedSourceCount = detail.sources.filter(hasCompleteSource).length;
  const keyPlayers = detail.players.slice(0, 3).map((player) => sanitizeDisplayText(player.playerName, "선수명 확인 필요")).join(", ");
  const recentAchievements = detail.recentAchievements?.join(" · ") || "추가 수집 필요";
  const probabilitySummary =
    team.teamSlug === "korea-republic"
      ? "대한민국 자체 기준 페이지"
      : `한국 ${koreaPrediction.koreaWinProbability}% · 무승부 ${koreaPrediction.drawProbability}% · ${detail.teamName} ${koreaPrediction.opponentWinProbability}%`;

  return (
    <div className="space-y-8">
      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <FlagIcon src={team.flagImageUrl} alt={team.flagAlt} fallback={team.flag} size="lg" />
            <div className="min-w-0">
              <p className="text-sm font-black text-trophy">국가 상세 페이지</p>
              <h1 className="mt-1 break-words text-3xl font-black text-white">{team.nameKo}</h1>
              <p className="mt-2 text-sm text-white/60">
                {team.group}조 · {team.position}번 자리 · {team.teamCode ?? "팀 코드 확인 필요"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={team.verificationStatus}>{team.verificationStatus}</Badge>
            <Badge tone={detail.dataStatus.confidence}>{detail.dataStatus.confidence}</Badge>
            <Badge tone={detail.dataStatus.formation}>포메이션 {detail.dataStatus.formation}</Badge>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatusCard label="대륙" value={detail.confederation ?? "추가 수집 필요"} />
          <StatusCard label="전력 지표" value={detail.powerIndex ?? "추가 수집 필요"} />
          <StatusCard label="핵심 선수" value={keyPlayers || "추가 수집 필요"} />
          <StatusCard label="확인 출처" value={`${verifiedSourceCount}개`} tone={verifiedSourceCount > 0 ? "신뢰도 높음" : "추가 수집 필요"} />
        </div>
        <p className="mt-4 rounded border border-trophy/25 bg-trophy/10 p-4 text-sm leading-6 text-trophy/90">
          팀별 핵심 선수, 감독, 포메이션, 전술은 신뢰 가능한 스쿼드 가이드와 대회 출처를 기반으로 표시합니다. 부상·징계·카드·확정 선발은 경기 직전 공식 발표에 따라 바뀔 수 있어 별도 확인 상태로 유지합니다.
        </p>
      </section>

      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <h2 className="text-xl font-black text-white">데이터 상태</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <StatusCard label="선수 명단" value={detail.dataStatus.squad} tone={detail.dataStatus.squad} />
          <StatusCard label="감독 정보" value={detail.dataStatus.coach} tone={detail.dataStatus.coach} />
          <StatusCard label="포메이션" value={detail.dataStatus.formation} tone={detail.dataStatus.formation} />
          <StatusCard label="전술 분석" value={detail.dataStatus.tactics} tone={detail.dataStatus.tactics} />
          <StatusCard label="예상 라인업" value={detail.dataStatus.lineup} tone={detail.dataStatus.lineup} />
          <StatusCard label="부상/징계 정보" value={detail.dataStatus.risk} tone={detail.dataStatus.risk} />
          <StatusCard label="카드 현황" value={detail.dataStatus.cards} tone={detail.dataStatus.cards} />
          <StatusCard label="체력 리스크" value={detail.dataStatus.fitness} tone={detail.dataStatus.fitness} />
          <StatusCard label="최근 경기 라인업" value={detail.dataStatus.recentLineup} tone={detail.dataStatus.recentLineup} />
          <StatusCard label="업데이트" value={detail.dataStatus.lastUpdated ?? "업데이트 날짜 확인 필요"} />
        </div>
      </section>

      <FootballDataRefreshPanel size="compact" />

      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <h2 className="text-xl font-black text-white">기본 정보와 감독</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatusCard label="영문명" value={detail.teamNameEn} />
          <StatusCard label="최근 성과" value={recentAchievements} />
          <StatusCard label="감독명" value={detail.coach.coachName ?? "추가 수집 필요"} tone={detail.coach.coachName ? "신뢰도 높음" : "추가 수집 필요"} />
          <StatusCard label="감독 국적" value={detail.coach.nationality ?? "추가 수집 필요"} />
          <StatusCard label="부임 시기" value={detail.coach.appointedDate ?? "추가 확인 필요"} />
          <StatusCard label="선호 포메이션" value={[detail.formation.formation, detail.expectedLineup.formation].filter(Boolean).join(" / ") || "추가 확인 필요"} />
          <StatusCard label="감독 출처" value={detail.coach.sourceName ?? "출처 확인 필요"} />
          <StatusCard label="감독 확인일" value={detail.coach.lastUpdated ?? "업데이트 날짜 확인 필요"} />
        </div>
        {detail.coach.tacticalNotes ? (
          <p className="mt-4 rounded border border-white/10 bg-pitch-900/80 p-4 text-sm leading-6 text-white/70">{detail.coach.tacticalNotes}</p>
        ) : (
          <WarningBlock title="감독 전술 메모 추가 수집 필요" body="감독 인터뷰나 공식 경기 리포트가 추가 확인되면 이 영역을 보강합니다." />
        )}
      </section>

      <section className="rounded border border-sky-300/25 bg-sky-400/10 p-5 shadow-panel">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-white">감독 전술 상세 보강</h2>
            <p className="mt-2 text-sm leading-6 text-sky-50/75">
              {coachTacticalProfile.coachName ?? "감독명 확인 필요"} 체제의 최근 전술 흐름을 기존 스쿼드·포메이션·전술 데이터에서 재구성했습니다.
            </p>
          </div>
          <Badge tone={evidenceTone(coachTacticalProfile.confidence)}>{coachTacticalProfile.confidence}</Badge>
        </div>
        <p className="mt-4 rounded border border-white/10 bg-pitch-900/80 p-4 text-sm leading-6 text-white/70">
          {coachTacticalProfile.tacticalIdentity}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatusCard label="선호 포메이션" value={coachTacticalProfile.preferredFormations.join(" / ") || "확인 필요"} />
          <StatusCard label="최근 포메이션" value={coachTacticalProfile.recentFormations.join(" / ") || "확인 필요"} />
          <StatusCard label="경기 중 조정" value={coachTacticalProfile.inGameAdjustmentPattern} />
          <StatusCard label="교체 패턴" value={coachTacticalProfile.substitutionPattern} />
          <StatusCard label="공격 접근" value={coachTacticalProfile.attackingApproach} />
          <StatusCard label="수비 접근" value={coachTacticalProfile.defensiveApproach} />
          <StatusCard label="압박 접근" value={coachTacticalProfile.pressingApproach} />
          <StatusCard label="빌드업 접근" value={coachTacticalProfile.buildUpApproach} />
          <StatusCard label="전환 접근" value={coachTacticalProfile.transitionApproach} />
          <StatusCard label="세트피스 접근" value={coachTacticalProfile.setPieceApproach} />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <ListPanel title="전술 강점" items={coachTacticalProfile.tacticalStrengths} />
          <ListPanel title="전술 약점" items={coachTacticalProfile.tacticalWeaknesses} />
        </div>
      </section>

      <section className="rounded border border-emerald-300/25 bg-emerald-400/10 p-5 shadow-panel">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-white">최근/예상 포메이션 근거</h2>
            <p className="mt-2 text-sm leading-6 text-emerald-50/75">
              단일 고정 포메이션이 아니라 최근 사용형, 예상형, 대체 가능형을 분리했습니다.
            </p>
          </div>
          <Badge tone={evidenceTone(formationProfile.confidence)}>{formationProfile.confidence}</Badge>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatusCard label="최근 사용형" value={formationProfile.recentFormation ?? "확인 필요"} />
          <StatusCard label="예상 사용형" value={formationProfile.expectedFormation ?? "확인 필요"} />
          <StatusCard label="대체 포메이션" value={formationProfile.alternativeFormations.join(" / ") || "확인 필요"} />
          <StatusCard label="업데이트" value={formationProfile.lastUpdated} />
          <StatusCard label="공격 시 형태" value={formationProfile.tacticalShapeInPossession ?? "추가 확인 필요"} />
          <StatusCard label="수비 시 형태" value={formationProfile.tacticalShapeOutOfPossession ?? "추가 확인 필요"} />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <ListPanel title="포메이션 메모" items={formationProfile.formationNotes} />
          <div className="rounded border border-white/10 bg-pitch-900/80 p-4">
            <h3 className="font-black text-white">경기 기반 근거</h3>
            <div className="mt-3 space-y-3">
              {formationProfile.matchBasedFormations.map((item) => (
                <div key={`${item.matchName}-${item.formation}`} className="rounded border border-white/10 bg-white/[0.04] p-3 text-sm text-white/65">
                  <p className="font-black text-white">{item.matchName}</p>
                  <p className="mt-1">포메이션: {item.formation}</p>
                  <p className="mt-1">출처: {item.sourceName}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded border border-trophy/30 bg-trophy/10 p-5 shadow-panel">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-white">대한민국 상대 승률 예상</h2>
            <p className="mt-2 text-sm leading-6 text-amber-50/75">{probabilitySummary}</p>
          </div>
          <Badge tone={evidenceTone(koreaPrediction.confidence)}>{koreaPrediction.confidence}</Badge>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <ProbabilityCard label="한국 승" value={koreaPrediction.koreaWinProbability} />
          <ProbabilityCard label="무승부" value={koreaPrediction.drawProbability} />
          <ProbabilityCard label={`${detail.teamName} 승`} value={koreaPrediction.opponentWinProbability} />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatusCard label="예상 스코어" value={`한국 ${koreaPrediction.expectedScore.korea} - ${koreaPrediction.expectedScore.opponent} ${detail.teamName}`} />
          <StatusCard label="연장/승부차기 한국 승률" value={`${koreaPrediction.knockoutWinnerProbability.korea}%`} />
          <StatusCard label="상대 토너먼트 승률" value={`${koreaPrediction.knockoutWinnerProbability.opponent}%`} />
          <StatusCard label="생성일" value={koreaPrediction.generatedAt} />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <ListPanel title="한국의 승리 요인" items={koreaPrediction.keyFactorsForKorea} />
          <ListPanel title="한국의 위험 요인" items={koreaPrediction.keyRisksForKorea} />
          <ListPanel title="상대 강점" items={koreaPrediction.opponentStrengths} />
          <ListPanel title="상대 약점" items={koreaPrediction.opponentWeaknesses} />
          <ListPanel title="한국 전술 조언" items={koreaPrediction.tacticalAdviceForKorea} />
          <ListPanel title="불확실성" items={koreaPrediction.uncertaintyFactors} />
        </div>
      </section>

      <FormationBoard data={detail.formation} />

      <TeamPlayerRoster players={detail.players} />

      <FormationBoard data={detail.expectedLineup} title="예상 라인업" />

      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <h2 className="text-xl font-black text-white">AI가 주목할 만한 선수</h2>
        {detail.notablePlayers.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {detail.notablePlayers.map((player) => (
              <article key={player.playerId} className="rounded border border-white/10 bg-pitch-900/80 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-white">{player.playerName}</h3>
                    <p className="mt-1 text-sm text-white/55">
                      {player.position} · {sanitizeDisplayText(player.club, "소속팀 확인 필요")}
                    </p>
                  </div>
                  <Badge tone={player.koreaRisk === "높음" ? "경고 누적 위험" : "분석 참고"}>한국 위험도 {player.koreaRisk}</Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/65">{player.reason}</p>
                <p className="mt-2 text-sm leading-6 text-white/50">{player.matchImpact}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {player.variables.map((variable) => (
                    <Badge key={variable} tone="분석 참고">{variable}</Badge>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <WarningBlock
            title="주목 선수 분석 추가 수집 필요"
            body="신뢰 가능한 스쿼드 자료가 추가 확인되면 핵심 선수 분석을 표시합니다."
          />
        )}
      </section>

      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <h2 className="text-xl font-black text-white">전술 특징</h2>
        <p className="mt-3 text-sm leading-6 text-white/70">{detail.tactics.summary ?? "전술 요약 추가 수집 필요"}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <StatusCard label="공격" value={detail.tactics.attackingStyle ?? "추가 수집 필요"} />
          <StatusCard label="수비" value={detail.tactics.defensiveStyle ?? "추가 수집 필요"} />
          <StatusCard label="압박" value={detail.tactics.pressingStyle ?? "추가 수집 필요"} />
          <StatusCard label="빌드업" value={detail.tactics.buildUpStyle ?? "추가 수집 필요"} />
          <StatusCard label="전환" value={detail.tactics.transitionStyle ?? "추가 수집 필요"} />
          <StatusCard label="세트피스" value={detail.tactics.setPieceStyle ?? "추가 수집 필요"} />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <ListPanel title="강점" items={detail.tactics.strengths} />
          <ListPanel title="약점/공략 포인트" items={detail.tactics.weaknesses} />
        </div>
        <p className="mt-4 rounded border border-white/10 bg-pitch-900/80 p-4 text-sm leading-6 text-white/60">{detail.tactics.uncertainty}</p>
      </section>

      <section className="rounded border border-red-300/25 bg-red-400/10 p-5 shadow-panel">
        <h2 className="text-xl font-black text-white">대한민국이 상대할 때 쓸 수 있는 전략</h2>
        <p className="mt-3 text-sm leading-6 text-red-50/80">{detail.koreaStrategy.notice}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <StatusCard label="압박 전략" value={detail.koreaStrategy.pressurePlan} />
          <StatusCard label="수비 전략" value={detail.koreaStrategy.defensivePlan} />
          <StatusCard label="역습 전략" value={detail.koreaStrategy.counterPlan} />
          <StatusCard label="세트피스 전략" value={detail.koreaStrategy.setPiecePlan} />
          <StatusCard label="위험 구간" value={detail.koreaStrategy.riskWindow} />
          <StatusCard label="피해야 할 상황" value={detail.koreaStrategy.avoidScenario} />
        </div>
      </section>

      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <h2 className="text-xl font-black text-white">부상/징계/카드/체력 리스크</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatusCard label="카드 위험" value={riskProfile.cardRisk.summary} tone={riskLevelTone(riskProfile.cardRisk.teamCardRiskLevel)} />
          <StatusCard label="부상 위험" value={riskProfile.injuryRisk.summary} tone={riskLevelTone(riskProfile.injuryRisk.keyPlayerInjuryRisk)} />
          <StatusCard label="징계 위험" value={riskProfile.suspensionRisk.summary} tone="warning" />
          <StatusCard label="체력 위험" value={riskProfile.fitnessRisk.summary} tone={riskLevelTone(riskProfile.fitnessRisk.fatigueLevel)} />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <RiskList title="옐로카드 확인 대상" items={riskProfile.cardRisk.yellowCardRiskPlayers} />
          <RiskList title="부상/컨디션 확인 대상" items={[...riskProfile.injuryRisk.injuredPlayers, ...riskProfile.injuryRisk.doubtfulPlayers]} />
          <RiskList title="징계 확인 대상" items={[...riskProfile.suspensionRisk.suspendedPlayers, ...riskProfile.suspensionRisk.suspensionRiskPlayers]} />
          <RiskList title="체력 과부하 확인 대상" items={riskProfile.fitnessRisk.overloadedPlayers} />
        </div>
        <ListPanel title="이동·일정 메모" items={riskProfile.fitnessRisk.travelOrScheduleNotes} />
        {detail.playerStatuses.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {detail.playerStatuses.map((player) => (
              <StatusCard
                key={player.playerId}
                label={sanitizeDisplayText(player.playerName, "선수명 확인 필요")}
                value={`부상 ${player.injuryStatus} · 징계 ${player.suspensionStatus} · 체력 ${player.fatigueRisk}`}
                tone={player.injuryStatus === "정상" && player.suspensionStatus === "없음" ? "neutral" : "추가 수집 필요"}
              />
            ))}
          </div>
        ) : (
          <WarningBlock
            title="카드/징계/부상 정보 추가 수집 필요"
            body="공식 경기 기록 또는 신뢰 가능한 경기 데이터 출처가 확인되면 확정 정보로 갱신합니다."
          />
        )}
      </section>

      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <h2 className="text-xl font-black text-white">최근 경기 기반 분석</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <ListPanel title="근거 자료" items={detail.tactics.evidenceMatches} />
          <ListPanel title="데이터 메모" items={detail.notes} />
        </div>
      </section>

      <SourceList sources={detail.sources} />
    </div>
  );
}

function evidenceTone(confidence: EvidenceConfidence): Parameters<typeof Badge>[0]["tone"] {
  if (confidence === "공식 확인" || confidence === "신뢰도 높음") {
    return "success";
  }

  if (confidence === "참고 자료" || confidence === "최근 자료 기준 추정") {
    return "분석 참고";
  }

  return "warning";
}

function riskLevelTone(level: string): Parameters<typeof Badge>[0]["tone"] {
  if (level === "낮음" || level === "출전 가능") {
    return "success";
  }

  if (level === "높음" || level === "결장" || level === "징계 결장") {
    return "danger";
  }

  return "warning";
}

function ProbabilityCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-white/10 bg-pitch-900/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-black text-white">{label}</p>
        <p className="text-2xl font-black text-trophy">{value}%</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded bg-white/10">
        <div className="h-full rounded bg-trophy" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}

function RiskList({ title, items }: { title: string; items: PlayerRiskItem[] }) {
  return (
    <div className="rounded border border-white/10 bg-pitch-900/80 p-4">
      <h3 className="font-black text-white">{title}</h3>
      {items.length > 0 ? (
        <div className="mt-3 space-y-3">
          {items.slice(0, 5).map((item) => (
            <div key={`${item.playerName}-${item.riskType}`} className="rounded border border-white/10 bg-white/[0.04] p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="break-words text-sm font-black text-white">{sanitizeDisplayText(item.playerName, "선수명 확인 필요")}</p>
                  <p className="mt-1 text-xs text-white/55">{item.position} · {item.riskType}</p>
                </div>
                <Badge tone={riskLevelTone(item.status)}>{item.status}</Badge>
              </div>
              <p className="mt-2 text-xs leading-5 text-white/58">{item.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-white/50">현재 표시할 확정 항목 없음</p>
      )}
    </div>
  );
}

function StatusCard({ label, value, tone = "neutral" }: { label: string; value: string; tone?: Parameters<typeof Badge>[0]["tone"] }) {
  return (
    <div className="rounded border border-white/10 bg-pitch-900/80 p-3">
      <Badge tone={tone}>{label}</Badge>
      <p className="mt-3 break-words text-sm font-semibold leading-6 text-white">{value}</p>
    </div>
  );
}

function ListPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded border border-white/10 bg-pitch-900/80 p-4">
      <h3 className="font-black text-white">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-white/68">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-white/50">추가 수집 필요</p>
      )}
    </div>
  );
}

function SourceList({ sources }: { sources: SourceMeta[] }) {
  return (
    <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
      <h2 className="text-xl font-black text-white">출처 목록</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {sources.map((source) => (
          <a
            key={`${source.sourceName}-${source.sourceUrl}`}
            href={source.sourceUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="rounded border border-white/10 bg-pitch-900/80 p-4 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <span className="block text-trophy">{source.sourceName ?? "출처 확인 필요"}</span>
            <span className="mt-2 block text-white/55">{source.lastUpdated ?? "업데이트 날짜 확인 필요"}</span>
            <span className="mt-2 block text-white/45">수준: {source.sourceLevel ?? source.confidence}</span>
            {source.sourceNotes ? <span className="mt-2 block text-white/45">{source.sourceNotes}</span> : null}
          </a>
        ))}
      </div>
    </section>
  );
}

function WarningBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-4 rounded border border-amber-300/25 bg-amber-400/10 p-4">
      <h3 className="font-black text-amber-50">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-amber-50/78">{body}</p>
    </div>
  );
}

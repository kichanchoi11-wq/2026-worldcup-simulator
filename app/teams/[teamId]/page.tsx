import { notFound } from "next/navigation";
import Badge from "@/components/Badge";
import FlagIcon from "@/components/FlagIcon";
import FormationBoard from "@/components/FormationBoard";
import TeamPlayerRoster from "@/components/TeamPlayerRoster";
import { getAllTeamIds, getTeamDetailRecord, hasCompleteSource } from "@/lib/teamDetails";
import type { SourceMeta } from "@/types/football";

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
  const verifiedSourceCount = detail.sources.filter(hasCompleteSource).length;
  const keyPlayers = detail.players.slice(0, 3).map((player) => player.playerName).join(", ");
  const recentAchievements = detail.recentAchievements?.join(" · ") || "추가 수집 필요";

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

      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <h2 className="text-xl font-black text-white">기본 정보와 감독</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatusCard label="영문명" value={detail.teamNameEn} />
          <StatusCard label="최근 성과" value={recentAchievements} />
          <StatusCard label="감독명" value={detail.coach.coachName ?? "추가 수집 필요"} tone={detail.coach.coachName ? "신뢰도 높음" : "추가 수집 필요"} />
          <StatusCard label="감독 국적" value={detail.coach.nationality ?? "추가 수집 필요"} />
        </div>
        {detail.coach.tacticalNotes ? (
          <p className="mt-4 rounded border border-white/10 bg-pitch-900/80 p-4 text-sm leading-6 text-white/70">{detail.coach.tacticalNotes}</p>
        ) : (
          <WarningBlock title="감독 전술 메모 추가 수집 필요" body="감독 인터뷰나 공식 경기 리포트가 추가 확인되면 이 영역을 보강합니다." />
        )}
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
                    <p className="mt-1 text-sm text-white/55">{player.position} · {player.club ?? "소속팀 확인 필요"}</p>
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
        {detail.playerStatuses.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {detail.playerStatuses.map((player) => (
              <StatusCard
                key={player.playerId}
                label={player.playerName}
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

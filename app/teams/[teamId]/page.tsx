import { notFound } from "next/navigation";
import Badge from "@/components/Badge";
import FlagIcon from "@/components/FlagIcon";
import FormationBoard from "@/components/FormationBoard";
import TeamPlayerRoster from "@/components/TeamPlayerRoster";
import { getAllTeamIds, getTeamDetailRecord, hasCompleteSource } from "@/lib/teamDetails";

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
  const coachCanDisplay = detail.coach.coachName && hasCompleteSource(detail.coach);
  const tacticsCanDisplay = detail.tactics.summary && hasCompleteSource(detail.tactics);

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
            <Badge tone={detail.dataStatus.coach}>감독 {detail.dataStatus.coach}</Badge>
            <Badge tone={detail.dataStatus.lineup}>라인업 {detail.dataStatus.lineup}</Badge>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <StatusCard label="데이터 상태" value={detail.dataStatus.confidence} />
          <StatusCard label="마지막 업데이트" value={detail.lastUpdated ?? "없음"} />
          <StatusCard label="출처 확인 상태" value={detail.sources.some(hasCompleteSource) ? "조 편성 출처 확인" : "세부 정보 출처 확인 필요"} />
        </div>
        <p className="mt-4 rounded border border-amber-300/25 bg-amber-400/10 p-4 text-sm leading-6 text-amber-50/80">
          이 국가의 세부 정보는 공식 출처 확인 전입니다. 출처 없는 선수 명단, 감독, 전술, 포메이션은 확정 정보로 표시하지 않습니다.
        </p>
      </section>

      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <h2 className="text-xl font-black text-white">데이터 검증 상태</h2>
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
          <StatusCard label="마지막 업데이트" value={detail.dataStatus.lastUpdated ?? "없음"} />
        </div>
      </section>

      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <h2 className="text-xl font-black text-white">감독 정보</h2>
        {coachCanDisplay ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <StatusCard label="감독명" value={detail.coach.coachName ?? "확인 필요"} tone="공식 확인" />
            <StatusCard label="출처" value={detail.coach.sourceName ?? "확인 필요"} />
          </div>
        ) : (
          <WarningBlock
            title="감독 정보 확인 필요"
            body="현재 감독명은 공식 출처가 확인되지 않아 확정 정보로 표시하지 않습니다. FIFA, 각국 축구협회 공식 홈페이지, 공식 SNS, 공식 경기 리포트 기준으로 재검증이 필요합니다."
          />
        )}
      </section>

      <FormationBoard data={detail.formation} />

      <TeamPlayerRoster players={detail.players} />

      <FormationBoard data={detail.expectedLineup} title="예상 라인업" />

      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <h2 className="text-xl font-black text-white">AI의 주목할 만한 선수</h2>
        {detail.notablePlayers.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {detail.notablePlayers.map((player) => (
              <article key={player.playerId} className="rounded border border-white/10 bg-pitch-900/80 p-4">
                <h3 className="font-black text-white">{player.playerName}</h3>
                <p className="mt-2 text-sm leading-6 text-white/65">{player.reason}</p>
              </article>
            ))}
          </div>
        ) : (
          <WarningBlock
            title="주목할 만한 선수 분석 제한"
            body="공식 소집 명단 또는 최근 경기 데이터가 검증되지 않아 AI 선수 분석을 제한합니다."
          />
        )}
      </section>

      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <h2 className="text-xl font-black text-white">전술적 특징</h2>
        {tacticsCanDisplay ? (
          <p className="mt-3 text-sm leading-6 text-white/70">{detail.tactics.summary}</p>
        ) : (
          <WarningBlock
            title="전술 정보 확인 필요"
            body="최근 실제 경기, 공식 경기 리포트, 감독 인터뷰 또는 신뢰 가능한 전술 분석 출처가 확인되지 않아 전술 설명을 확정 표시하지 않습니다."
          />
        )}
      </section>

      <section className="rounded border border-red-300/25 bg-red-400/10 p-5 shadow-panel">
        <h2 className="text-xl font-black text-white">대한민국이 상대할 때 이길 수 있는 전략</h2>
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
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {detail.playerStatuses.map((player) => (
              <StatusCard key={player.playerId} label={player.playerName} value={`${player.injuryStatus} · ${player.suspensionStatus}`} />
            ))}
          </div>
        ) : (
          <WarningBlock
            title="카드/징계/부상 정보 확인 필요"
            body="공식 경기 기록 또는 신뢰 가능한 경기 데이터 출처가 확인되지 않아 확정 정보로 표시하지 않습니다."
          />
        )}
      </section>

      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <h2 className="text-xl font-black text-white">최근 경기 기반 분석</h2>
        <WarningBlock
          title="최근 경기 라인업 확인 필요"
          body="최근 실제 경기 선발, 교체 흐름, 카드, 부상, 포메이션 변화가 검증되면 이 영역에 반영합니다."
        />
      </section>

      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <h2 className="text-xl font-black text-white">출처 목록</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {detail.sources.map((source) => (
            <a
              key={`${source.sourceName}-${source.sourceUrl}`}
              href={source.sourceUrl ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="rounded border border-white/10 bg-pitch-900/80 p-4 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <span className="block text-trophy">{source.sourceName ?? "출처 확인 필요"}</span>
              <span className="mt-2 block text-white/55">{source.lastUpdated ?? "업데이트 날짜 확인 필요"}</span>
            </a>
          ))}
        </div>
      </section>
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

function WarningBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-4 rounded border border-amber-300/25 bg-amber-400/10 p-4">
      <h3 className="font-black text-amber-50">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-amber-50/78">{body}</p>
    </div>
  );
}

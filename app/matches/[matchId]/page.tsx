import { notFound } from "next/navigation";
import Badge from "@/components/Badge";
import FormationBoard from "@/components/FormationBoard";
import { createMatchPageData, getAllMatchIds, getMatchDetailById } from "@/data/matchDetails";
import type { MatchPlayerStatus } from "@/types/match";

export function generateStaticParams() {
  return getAllMatchIds().map((matchId) => ({ matchId }));
}

export default async function MatchDetailPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const match = getMatchDetailById(matchId);

  if (!match) {
    notFound();
  }

  const pageData = createMatchPageData(match);
  const score =
    match.score.home === null || match.score.away === null
      ? "경기 전"
      : `${match.score.home} : ${match.score.away}`;

  return (
    <div className="space-y-8">
      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black text-trophy">경기 상세 페이지</p>
            <h1 className="mt-2 text-3xl font-black text-white">
              {match.homeTeamName ?? "홈팀 확인 필요"} vs {match.awayTeamName ?? "원정팀 확인 필요"}
            </h1>
            <p className="mt-2 text-sm text-white/60">
              {match.competition} · {match.round} · {match.groupId ? `${match.groupId}조` : "라운드 경기"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={match.sourceType === "API 실제 데이터" ? "API 실제 데이터" : match.sourceType === "공식 출처 데이터" ? "공식 확인" : "확인 필요"}>
              {match.sourceType}
            </Badge>
            <Badge tone="확인 필요">{match.status}</Badge>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatusCard label="경기 번호" value={String(match.matchId)} />
          <StatusCard label="스코어" value={score} />
          <StatusCard label="날짜/시간" value={match.dateTime ?? "일정 확인 필요"} />
          <StatusCard label="경기장" value={match.stadium ?? "경기장 확인 필요"} />
        </div>
      </section>

      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <h2 className="text-xl font-black text-white">예상 명단</h2>
        {pageData.expectedPlayers.length > 0 ? (
          <PlayerStatusGrid players={pageData.expectedPlayers} />
        ) : (
          <WarningBlock
            title="예상 명단 표시 불가"
            body="공식 소집 명단, 최근 경기 라인업, 부상/징계 정보가 검증되지 않아 예상 명단을 표시할 수 없습니다."
          />
        )}
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <FormationBoard data={pageData.homeFormation} title={`${match.homeTeamName ?? "홈팀"} 포메이션`} />
        <FormationBoard data={pageData.awayFormation} title={`${match.awayTeamName ?? "원정팀"} 포메이션`} />
      </div>

      <section className="grid gap-5 xl:grid-cols-3">
        <RiskSection title="출전 금지/징계 결장" players={pageData.suspendedPlayers} empty="출전 금지 또는 징계 결장 정보 확인 필요" />
        <RiskSection title="카드 현황" players={pageData.cardRiskPlayers} empty="카드 현황은 API 또는 공식 경기 기록 확인 필요" />
        <RiskSection title="부상 현황" players={pageData.injuryPlayers} empty="부상 정보는 공식 발표 또는 경기 리포트 확인 필요" />
      </section>

      <section className="rounded border border-violet-300/25 bg-violet-400/10 p-5 shadow-panel">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="AI 예측">AI 경기 예측</Badge>
          <Badge tone="확인 필요">신뢰도 {pageData.prediction.confidence}</Badge>
        </div>
        <h2 className="mt-3 text-xl font-black text-white">AI 경기 예측</h2>
        <p className="mt-3 text-sm leading-6 text-violet-50/78">
          이 예측은 공식 결과가 아니며, API 실제 데이터와 검증된 팀 정보를 바탕으로 생성된 참고용 시뮬레이션입니다.
          {pageData.prediction.uncertainty}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <StatusCard label="홈팀 승리" value={pageData.prediction.homeWinProbability === null ? "제한" : `${pageData.prediction.homeWinProbability}%`} />
          <StatusCard label="무승부" value={pageData.prediction.drawProbability === null ? "제한" : `${pageData.prediction.drawProbability}%`} />
          <StatusCard label="원정팀 승리" value={pageData.prediction.awayWinProbability === null ? "제한" : `${pageData.prediction.awayWinProbability}%`} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {pageData.prediction.variables.map((item) => (
            <Badge key={item} tone="확인 필요">{item}</Badge>
          ))}
        </div>
      </section>

      {pageData.koreaAnalysis.applies ? (
        <section className="rounded border border-red-300/25 bg-red-400/10 p-5 shadow-panel">
          <h2 className="text-xl font-black text-white">대한민국 관점 경기 분석</h2>
          <p className="mt-3 text-sm leading-6 text-red-50/80">{pageData.koreaAnalysis.notice}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {pageData.koreaAnalysis.points.map((point) => (
              <StatusCard key={point} label="분석 포인트" value={point} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <h2 className="text-xl font-black text-white">출처 목록과 업데이트 날짜</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {pageData.sources.map((source) => (
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

function PlayerStatusGrid({ players }: { players: MatchPlayerStatus[] }) {
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {players.map((player) => (
        <StatusCard
          key={`${player.matchId}-${player.playerId}`}
          label={player.playerName}
          value={`${player.position} · ${player.availability} · 카드 ${player.yellowCards ?? "확인 필요"}/${player.redCards ?? "확인 필요"}`}
          tone={player.availability}
        />
      ))}
    </div>
  );
}

function RiskSection({ title, players, empty }: { title: string; players: MatchPlayerStatus[]; empty: string }) {
  return (
    <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
      <h2 className="text-lg font-black text-white">{title}</h2>
      {players.length > 0 ? (
        <PlayerStatusGrid players={players} />
      ) : (
        <WarningBlock title={empty} body="공식 경기 기록 또는 신뢰 가능한 경기 데이터 출처가 확인되지 않아 확정 정보로 표시하지 않습니다." />
      )}
    </section>
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

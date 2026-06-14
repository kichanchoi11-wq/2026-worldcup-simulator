import { notFound } from "next/navigation";
import Badge from "@/components/Badge";
import FormationBoard from "@/components/FormationBoard";
import { createMatchPageData, getAllMatchIds, getMatchDetailById } from "@/data/matchDetails";
import { createMatchReview, createMatchReviewPlaceholder } from "@/lib/matchReviewService";
import { sanitizeDisplayText } from "@/lib/textSanitizer";
import type { SourceMeta } from "@/types/football";
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
  const review = createMatchReview(pageData);
  const reviewPlaceholder = createMatchReviewPlaceholder(match);
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
              {match.competition} · {match.round} · {match.groupId ? `${match.groupId}조` : "토너먼트 경기"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={match.sourceType === "공식 출처 데이터" ? "공식 확인" : "확인 필요"}>{match.sourceType}</Badge>
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-white">핵심 선수 연결</h2>
            <p className="mt-2 text-sm leading-6 text-white/62">
              팀 상세 데이터에서 가져온 핵심/주목 선수입니다. 확정 선발, 카드, 부상은 경기 직전 공식 발표로 재확인해야 합니다.
            </p>
          </div>
          <Badge tone={pageData.expectedPlayers.length > 0 ? "신뢰도 높음" : "추가 수집 필요"}>{pageData.expectedPlayers.length}명</Badge>
        </div>
        {pageData.expectedPlayers.length > 0 ? (
          <PlayerStatusGrid players={pageData.expectedPlayers} />
        ) : (
          <WarningBlock
            title="예상 명단 표시 불가"
            body="팀 상세 데이터가 연결되면 이 영역에 핵심 선수와 출전 변수 정보가 표시됩니다."
          />
        )}
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <FormationBoard data={pageData.homeFormation} title={`${match.homeTeamName ?? "홈팀"} 포메이션`} />
        <FormationBoard data={pageData.awayFormation} title={`${match.awayTeamName ?? "원정팀"} 포메이션`} />
      </div>

      <section className="grid gap-5 xl:grid-cols-3">
        <RiskSection title="출전 금지/징계 결장" players={pageData.suspendedPlayers} empty="출전 금지 또는 징계 결장 정보 확인 필요" />
        <RiskSection title="카드 현황" players={pageData.cardRiskPlayers} empty="카드 현황은 경기별 공식 기록 확인 필요" />
        <RiskSection title="부상 현황" players={pageData.injuryPlayers} empty="부상 정보는 공식 발표 또는 경기 리포트 확인 필요" />
      </section>

      <section className="rounded border border-violet-300/25 bg-violet-400/10 p-5 shadow-panel">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="AI 예측">AI 경기 예측</Badge>
          <Badge tone={pageData.prediction.confidence}>신뢰도 {pageData.prediction.confidence}</Badge>
        </div>
        <h2 className="mt-3 text-xl font-black text-white">경기 변수 요약</h2>
        <p className="mt-3 text-sm leading-6 text-violet-50/78">{pageData.prediction.uncertainty}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <StatusCard label="홈 승률" value={pageData.prediction.homeWinProbability === null ? "숫자 제한" : `${pageData.prediction.homeWinProbability}%`} />
          <StatusCard label="무승부" value={pageData.prediction.drawProbability === null ? "숫자 제한" : `${pageData.prediction.drawProbability}%`} />
          <StatusCard label="원정 승률" value={pageData.prediction.awayWinProbability === null ? "숫자 제한" : `${pageData.prediction.awayWinProbability}%`} />
          <StatusCard label="예상 스코어" value={pageData.prediction.expectedScore ?? "경기 전 제한"} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {pageData.prediction.variables.map((item) => (
            <Badge key={item} tone="분석 참고">{item}</Badge>
          ))}
        </div>
      </section>

      <section className="rounded border border-trophy/30 bg-trophy/10 p-5 shadow-panel">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={review ? "success" : "warning"}>{review ? "경기 리뷰" : "경기 전 프리뷰"}</Badge>
          <Badge tone="분석 참고">AI 예측과 실제 결과 분리</Badge>
        </div>
        <h2 className="mt-3 text-xl font-black text-white">{review ? "끝난 경기 리뷰" : reviewPlaceholder.title}</h2>
        {review ? (
          <div className="mt-4 space-y-4">
            <p className="rounded border border-white/10 bg-pitch-900/80 p-4 text-sm leading-6 text-amber-50/80">
              {review.matchSummary}
            </p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <StatusCard label="최종 스코어" value={`${review.homeTeamName} ${review.finalScore.home} - ${review.finalScore.away} ${review.awayTeamName}`} />
              <StatusCard label="AI 예상 승자" value={review.predictionComparison.predictedWinner ?? "확인 필요"} />
              <StatusCard label="실제 승자" value={review.predictionComparison.actualWinner ?? "확인 필요"} />
              <StatusCard
                label="예측 적중"
                value={review.predictionComparison.wasPredictionCorrect === null ? "비교 보류" : review.predictionComparison.wasPredictionCorrect ? "적중" : "불일치"}
                tone={review.predictionComparison.wasPredictionCorrect ? "success" : "warning"}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <ReviewList title="주요 장면" items={review.keyMoments} />
              <ReviewList title="포메이션 변화" items={review.formationChanges} />
              <ReviewList title="교체 영향" items={review.substitutionImpact} />
              <ReviewList title="선수 하이라이트" items={review.playerHighlights} />
              <ReviewList title="카드·부상 영향" items={review.cardAndInjuryImpact} />
              <ReviewList title="체력 영향" items={review.fatigueImpact} />
              <ReviewList title="다음 경기 영향" items={review.nextMatchImpact} />
              <div className="rounded border border-white/10 bg-pitch-900/80 p-4">
                <h3 className="font-black text-white">예측 비교 메모</h3>
                <p className="mt-3 text-sm leading-6 text-white/68">{review.predictionComparison.notes}</p>
                {review.koreaPerspectiveReview ? <p className="mt-3 text-sm leading-6 text-red-50/80">{review.koreaPerspectiveReview}</p> : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <p className="rounded border border-white/10 bg-pitch-900/80 p-4 text-sm leading-6 text-amber-50/80">
              {reviewPlaceholder.body}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <StatusCard label="예상 명단" value={`${pageData.expectedPlayers.length}명 연결`} />
              <StatusCard label="출전 금지" value={`${pageData.suspendedPlayers.length}명`} />
              <StatusCard label="카드 확인 대상" value={`${pageData.cardRiskPlayers.length}명`} />
              <StatusCard label="부상 확인 대상" value={`${pageData.injuryPlayers.length}명`} />
            </div>
          </div>
        )}
      </section>

      {pageData.koreaAnalysis.applies ? (
        <section className="rounded border border-red-300/25 bg-red-400/10 p-5 shadow-panel">
          <h2 className="text-xl font-black text-white">대한민국 관련 경기 분석</h2>
          <p className="mt-3 text-sm leading-6 text-red-50/80">{pageData.koreaAnalysis.notice}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {pageData.koreaAnalysis.points.map((point) => (
              <StatusCard key={point} label="분석 포인트" value={point} />
            ))}
          </div>
        </section>
      ) : null}

      <SourceList sources={pageData.sources} />
    </div>
  );
}

function PlayerStatusGrid({ players }: { players: MatchPlayerStatus[] }) {
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {players.map((player) => (
        <article key={`${player.matchId}-${player.playerId}`} className="rounded border border-white/10 bg-pitch-900/80 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-black text-white">{sanitizeDisplayText(player.playerName, "선수명 확인 필요")}</h3>
              <p className="mt-1 text-sm text-white/55">{player.teamId} · {player.position}</p>
            </div>
            <Badge tone={player.availability}>{player.availability}</Badge>
          </div>
          <div className="mt-3 grid gap-2 text-sm text-white/70">
            <p>선발 참고: {player.expectedStarter === true ? "우선 주목" : "경기 전 확인"}</p>
            <p>징계: {player.suspensionStatus} · 부상: {player.injuryStatus}</p>
            <p>카드: {player.yellowCards ?? "확인 필요"} / {player.redCards ?? "확인 필요"}</p>
          </div>
          <p className="mt-3 text-xs leading-5 text-white/50">{player.notes.join(" ")}</p>
        </article>
      ))}
    </div>
  );
}

function ReviewList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded border border-white/10 bg-pitch-900/80 p-4">
      <h3 className="font-black text-white">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-white/68">
          {items.map((item) => (
            <li key={item}>{sanitizeDisplayText(item, "확인 필요")}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-white/50">추가 확인 필요</p>
      )}
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
        <WarningBlock title={empty} body="확정 경기 리포트나 공식 발표가 확인되면 이 영역에 선수별 위험 정보를 표시합니다." />
      )}
    </section>
  );
}

function SourceList({ sources }: { sources: SourceMeta[] }) {
  return (
    <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
      <h2 className="text-xl font-black text-white">출처 목록과 업데이트 날짜</h2>
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

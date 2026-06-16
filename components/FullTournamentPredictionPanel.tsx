"use client";

import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/Badge";
import FlagIcon from "@/components/FlagIcon";
import { readStorage, removeStorageItem, storageKeys, writeStorage } from "@/lib/storage";
import type { TeamGroup } from "@/types/football";
import type {
  FullTournamentPrediction,
  GroupPrediction,
  GroupSimulationData,
  MatchPrediction,
  PredictionDataCard,
  PredictionDataConfidence,
  PredictionSourceSummary,
  PredictionTeamSnapshot,
  TournamentRoundPrediction
} from "@/types/simulation";

type PredictionScope = "group" | "r32" | "tournament" | "full";

type FullPredictionResponse = {
  ok: boolean;
  prediction: FullTournamentPrediction;
  legacyGroupSimulation: GroupSimulationData;
  legacyTournamentSimulation: unknown;
  message?: string;
};

const scopeLabels: Record<PredictionScope, string> = {
  group: "조별리그 AI 예측",
  r32: "32강 AI 예측",
  tournament: "전체 토너먼트 AI 예측",
  full: "전체 대회 AI 예측"
};

function confidenceTone(confidence: PredictionDataConfidence): Parameters<typeof Badge>[0]["tone"] {
  if (confidence === "공식 확인") {
    return "공식 확인";
  }
  if (confidence === "신뢰도 높음") {
    return "신뢰도 높음";
  }
  if (confidence === "참고 자료") {
    return "분석 참고";
  }
  if (confidence === "추정") {
    return "예상";
  }
  return "확인 필요";
}

function formatGeneratedAt(value: string | null | undefined) {
  if (!value) {
    return "생성 전";
  }

  try {
    return new Intl.DateTimeFormat("ko-KR", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

function hasRound(value: unknown): value is TournamentRoundPrediction {
  return isRecord(value) && Array.isArray(value.matches);
}

function isFullTournamentPrediction(value: unknown): value is FullTournamentPrediction {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.generatedAt === "string" &&
    typeof value.modelVersion === "string" &&
    Array.isArray(value.dataCards) &&
    Array.isArray(value.sourceSummary) &&
    Array.isArray(value.teamProfiles) &&
    Array.isArray(value.groupStage) &&
    Array.isArray(value.qualifiedTeams) &&
    Array.isArray(value.thirdPlaceQualifiers) &&
    Array.isArray(value.uncertaintyFactors) &&
    hasRound(value.roundOf32) &&
    hasRound(value.roundOf16) &&
    hasRound(value.quarterFinals) &&
    hasRound(value.semiFinals)
  );
}

export default function FullTournamentPredictionPanel({ groups }: { groups: TeamGroup[] }) {
  const [prediction, setPrediction] = useState<FullTournamentPrediction | null>(null);
  const [scope, setScope] = useState<PredictionScope>("full");
  const [loadingScope, setLoadingScope] = useState<PredictionScope | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedPrediction = readStorage<unknown>(storageKeys.fullTournamentPredictionData, null);
      setPrediction(isFullTournamentPrediction(storedPrediction) ? storedPrediction : null);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const roundGroups = useMemo(() => {
    if (!prediction) {
      return [];
    }

    const knockoutRounds: TournamentRoundPrediction[] = [
      prediction.roundOf32,
      prediction.roundOf16,
      prediction.quarterFinals,
      prediction.semiFinals
    ];

    if (prediction.thirdPlaceMatch) {
      knockoutRounds.push({
        round: "3·4위전",
        matches: [prediction.thirdPlaceMatch],
        notice: "4강 패자끼리 만나는 공식 103번 경기입니다."
      });
    }

    if (prediction.final) {
      knockoutRounds.push({
        round: "결승",
        matches: [prediction.final],
        notice: "공식 104번 경기입니다."
      });
    }

    return knockoutRounds;
  }, [prediction]);

  async function runPrediction(nextScope: PredictionScope) {
    setLoadingScope(nextScope);
    setMessage(null);

    try {
      const response = await fetch("/api/ai/full-tournament-simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groups })
      });
      const data = (await response.json()) as FullPredictionResponse;

      if (!response.ok || !data.ok || !isFullTournamentPrediction(data.prediction)) {
        throw new Error(data.message ?? "AI 예측 실행에 실패했습니다.");
      }

      writeStorage(storageKeys.fullTournamentPredictionData, data.prediction);
      writeStorage(storageKeys.aiGroupSimulationData, data.legacyGroupSimulation);
      writeStorage(storageKeys.aiTournamentSimulationData, data.legacyTournamentSimulation);
      setPrediction(data.prediction);
      setScope(nextScope);
      setMessage(`${scopeLabels[nextScope]} 결과를 저장했습니다.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI 예측 실행 중 오류가 발생했습니다.");
    } finally {
      setLoadingScope(null);
    }
  }

  function resetPrediction() {
    const confirmed = window.confirm(
      "AI 예측 결과만 삭제합니다. 실제 경기 데이터, 사용자 입력, 경우의 수 계산기 데이터는 삭제하지 않습니다. 계속하시겠습니까?"
    );

    if (!confirmed) {
      return;
    }

    removeStorageItem(storageKeys.fullTournamentPredictionData);
    removeStorageItem(storageKeys.aiGroupSimulationData);
    removeStorageItem(storageKeys.aiTournamentSimulationData);
    setPrediction(null);
    setMessage("AI 예측 결과만 초기화했습니다.");
  }

  const showGroups = scope === "group" || scope === "full";
  const showRoundOf32 = scope === "r32" || scope === "tournament" || scope === "full";
  const showLaterRounds = scope === "tournament" || scope === "full";
  const visibleRounds = roundGroups.filter((round) => {
    if (round.round === "32강") {
      return showRoundOf32;
    }
    return showLaterRounds;
  });

  return (
    <section className="space-y-6">
      <div className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-black text-white">전체 대회 AI 예측 실행</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/65">
              조별리그 72경기와 32강부터 결승까지 공식 경기 번호 73~104 구조를 한 번에 계산합니다.
            </p>
          </div>
          <div className="flex max-w-full flex-wrap gap-2">
            {(Object.keys(scopeLabels) as PredictionScope[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => runPrediction(item)}
                disabled={loadingScope !== null}
                className={`rounded border px-4 py-2 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  scope === item
                    ? "border-trophy/70 bg-trophy/25"
                    : "border-violet-300/50 bg-violet-400/15 hover:bg-violet-400/25"
                }`}
              >
                {loadingScope === item ? "계산 중" : scopeLabels[item]}
              </button>
            ))}
            <button
              type="button"
              onClick={resetPrediction}
              disabled={loadingScope !== null}
              className="rounded border border-red-300/50 bg-red-400/15 px-4 py-2 text-sm font-black text-white transition hover:bg-red-400/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              AI 예측 결과 초기화
            </button>
          </div>
        </div>

        {message ? <p className="mt-4 rounded border border-white/10 bg-white/8 p-3 text-sm text-white/75">{message}</p> : null}
      </div>

      <RefreshNotice prediction={prediction} />

      {prediction ? (
        <>
          <ChampionSummary prediction={prediction} />
          <DataCardGrid cards={prediction.dataCards} />
          <ModelNotice prediction={prediction} />

          {showGroups ? <GroupPredictionSection groups={prediction.groupStage} /> : null}

          {visibleRounds.length > 0 ? (
            <section className="space-y-4">
              <div>
                <p className="text-sm font-black text-trophy">토너먼트 예측</p>
                <h2 className="mt-2 text-2xl font-black text-white">공식 브래킷 기반 라운드별 결과</h2>
              </div>
              {visibleRounds.map((round) => (
                <RoundPredictionSection key={round.round} round={round} />
              ))}
            </section>
          ) : null}

          <SourceSummary sources={prediction.sourceSummary} />
        </>
      ) : (
        <EmptyPredictionState />
      )}
    </section>
  );
}

function RefreshNotice({ prediction }: { prediction: FullTournamentPrediction | null }) {
  const message =
    prediction?.refreshStatus.message ??
    "자동 새로고침은 현재 안정적으로 지원하지 않습니다. 외부 경기 API와 경기 직전 부상/징계 데이터는 응답 형식과 제공 시점이 달라질 수 있어, 안정화 전까지 새로고침 버튼을 추가하지 않았습니다.";

  return (
    <section className="rounded border border-amber-300/25 bg-amber-400/10 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="추가 수집 필요">새로고침 버튼 제외</Badge>
        <Badge tone="확인 필요">안정화 후 추가</Badge>
      </div>
      <h2 className="mt-3 text-lg font-black text-white">최신 데이터 새로고침 안내</h2>
      <p className="mt-2 text-sm leading-6 text-amber-50/78">{message}</p>
    </section>
  );
}

function EmptyPredictionState() {
  return (
    <section className="rounded border border-white/10 bg-white/[0.06] p-5">
      <Badge tone="AI 예측">대기 중</Badge>
      <h2 className="mt-3 text-xl font-black text-white">아직 생성된 AI 예측이 없습니다</h2>
      <p className="mt-2 text-sm leading-6 text-white/65">
        위 버튼 중 하나를 누르면 내부 규칙 모델이 팀 상세 데이터와 공식 브래킷 구조를 사용해 결과를 생성합니다.
        Gemini/API 키가 없어도 빈 화면 없이 작동합니다.
      </p>
    </section>
  );
}

function ChampionSummary({ prediction }: { prediction: FullTournamentPrediction }) {
  return (
    <section className="rounded border border-trophy/35 bg-trophy/10 p-5 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Badge tone="gold">AI 예측 챔피언</Badge>
          <h2 className="mt-3 break-words text-3xl font-black text-white">
            {prediction.champion ? <TeamName team={prediction.champion} size="lg" /> : "우승팀 예측 전"}
          </h2>
          <p className="mt-2 text-sm text-amber-50/75">생성 시각: {formatGeneratedAt(prediction.generatedAt)}</p>
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-auto">
          <SummaryPill label="준우승" team={prediction.runnerUp} />
          <SummaryPill label="3위" team={prediction.thirdPlace} />
          <div className="rounded border border-white/10 bg-pitch-900/70 p-3">
            <Badge tone={confidenceTone(prediction.confidence)}>모델 신뢰도</Badge>
            <p className="mt-3 text-lg font-black text-white">{prediction.confidence}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryPill({ label, team }: { label: string; team: PredictionTeamSnapshot | null }) {
  return (
    <div className="min-w-0 rounded border border-white/10 bg-pitch-900/70 p-3">
      <Badge tone="neutral">{label}</Badge>
      <p className="mt-3 min-w-0 break-words text-lg font-black text-white">
        {team ? <TeamName team={team} /> : "예측 전"}
      </p>
    </div>
  );
}

function DataCardGrid({ cards }: { cards: PredictionDataCard[] }) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <article key={card.id} className="min-w-0 rounded border border-white/10 bg-white/[0.06] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={confidenceTone(card.confidence)}>{card.confidence}</Badge>
            <Badge tone="neutral">출처 {card.sourceCount}개</Badge>
          </div>
          <h3 className="mt-3 break-words text-lg font-black text-white">{card.title}</h3>
          <p className="mt-1 text-2xl font-black text-trophy">{card.value}</p>
          <p className="mt-2 text-sm leading-6 text-white/65">{card.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {card.items.map((item) => (
              <Badge key={item} tone="neutral">{item}</Badge>
            ))}
          </div>
          <CardDetailList title="반영 데이터" items={card.details} />
          <CardDetailList title="부족한 이유/fallback" items={card.missingReasons} warning />
          <CardDetailList title="사용 출처" items={card.dataSources} />
        </article>
      ))}
    </section>
  );
}

function CardDetailList({ title, items, warning = false }: { title: string; items?: string[]; warning?: boolean }) {
  const visibleItems = items?.filter((item) => item.trim().length > 0).slice(0, 6) ?? [];

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 rounded border border-white/10 bg-pitch-900/65 p-3">
      <p className={`text-xs font-black ${warning ? "text-amber-100/80" : "text-white/55"}`}>{title}</p>
      <ul className="mt-2 space-y-1 text-xs leading-5 text-white/62">
        {visibleItems.map((item) => (
          <li key={item} className="break-words">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ModelNotice({ prediction }: { prediction: FullTournamentPrediction }) {
  return (
    <section className="rounded border border-white/10 bg-white/[0.06] p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="AI 예측">모델 {prediction.modelVersion}</Badge>
        <Badge tone="분석 참고">공식 결과 아님</Badge>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/70">{prediction.notice}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {prediction.uncertaintyFactors.map((factor) => (
          <div key={factor} className="rounded border border-white/10 bg-pitch-900/70 p-3 text-sm leading-6 text-white/70">
            {factor}
          </div>
        ))}
      </div>
      {prediction.dataDiagnostics ? (
        <div className="mt-4 rounded border border-cyan-300/20 bg-cyan-400/10 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">API-Football 입력 진단</Badge>
            <Badge tone="neutral">fixtures {prediction.dataDiagnostics.schedule.apiFixtureMatches}건</Badge>
            <Badge tone="neutral">resources {prediction.dataDiagnostics.resources.length}종</Badge>
          </div>
          <div className="mt-3 grid gap-2 text-xs leading-5 text-cyan-50/75 md:grid-cols-2">
            {prediction.dataDiagnostics.resources.map((resource) => (
              <div key={resource.resource} className="rounded border border-white/10 bg-pitch-900/70 p-2">
                <strong className="text-white">{resource.label}</strong>
                <span className="block">
                  {resource.count}건 · {resource.source} · {resource.dataQuality}
                </span>
                {resource.message ? <span className="block text-white/45">{resource.message}</span> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function GroupPredictionSection({ groups }: { groups: GroupPrediction[] }) {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-black text-trophy">조별리그 예측</p>
        <h2 className="mt-2 text-2xl font-black text-white">12개 조 순위와 72경기 예상</h2>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {groups.map((group) => (
          <article key={group.group} className="min-w-0 rounded border border-white/10 bg-white/[0.06] p-4 shadow-panel">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge tone="AI 예측">{group.group}조</Badge>
                <h3 className="mt-2 text-lg font-black text-white">예상 순위</h3>
              </div>
              <Badge tone="neutral">3위 후보 {group.thirdPlaceCandidate?.nameKo ?? "확인 필요"}</Badge>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="text-xs text-white/45">
                  <tr>
                    <th className="py-2">순위</th>
                    <th className="py-2">팀</th>
                    <th className="py-2 text-right">승점</th>
                    <th className="py-2 text-right">득실</th>
                    <th className="py-2 text-right">진출</th>
                  </tr>
                </thead>
                <tbody>
                  {group.predictedStandings.map((standing) => (
                    <tr key={standing.team.id} className="border-t border-white/10">
                      <td className="py-2 font-black text-trophy">{standing.rank}</td>
                      <td className="py-2">
                        <TeamName team={standing.team} />
                      </td>
                      <td className="py-2 text-right font-semibold text-white">{standing.points}</td>
                      <td className="py-2 text-right text-white/70">{standing.goalDifference}</td>
                      <td className="py-2 text-right text-white/70">{standing.qualificationProbability}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {group.predictedMatches.map((match) => (
                <MatchPredictionCard key={match.matchId} match={match} compact />
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function RoundPredictionSection({ round }: { round: TournamentRoundPrediction }) {
  return (
    <section className="rounded border border-white/10 bg-white/[0.06] p-4 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge tone={round.round === "결승" ? "gold" : "공식 확인"}>{round.round}</Badge>
          <h3 className="mt-2 text-xl font-black text-white">{round.matches.length}경기 예측</h3>
        </div>
        {round.notice ? <p className="max-w-2xl text-sm leading-6 text-white/60">{round.notice}</p> : null}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {round.matches.map((match) => (
          <MatchPredictionCard key={match.matchId} match={match} />
        ))}
      </div>
    </section>
  );
}

function MatchPredictionCard({ match, compact = false }: { match: MatchPrediction; compact?: boolean }) {
  const winnerId = match.predictedWinner?.id ?? null;

  return (
    <article className="min-w-0 rounded border border-white/10 bg-pitch-900/80 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-black text-trophy">{match.matchId}번 · {match.round}</p>
          <h4 className="mt-1 break-words text-sm font-black text-white">{match.label}</h4>
        </div>
        <Badge tone={confidenceTone(match.confidence)}>{match.confidence}</Badge>
      </div>

      <div className="mt-3 space-y-3">
        <ProbabilityRow team={match.teamA} value={match.probabilities.teamAWin} active={winnerId === match.teamA.id} />
        {match.probabilities.draw !== null ? <DrawProbabilityRow value={match.probabilities.draw} active={!winnerId} /> : null}
        <ProbabilityRow team={match.teamB} value={match.probabilities.teamBWin} active={winnerId === match.teamB.id} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge tone="neutral">예상 {match.expectedScore.teamA}-{match.expectedScore.teamB}</Badge>
        <Badge tone={winnerId ? "gold" : "분석 참고"}>
          {match.predictedWinner ? `승자 ${match.predictedWinner.nameKo}` : "무승부 가능성"}
        </Badge>
      </div>

      {!compact ? (
        <>
          <InfoList title="핵심 변수" items={match.keyFactors} />
          <InfoList title="위험/불확실성" items={[...match.riskFactors, ...match.uncertaintyFactors].slice(0, 5)} />
        </>
      ) : null}

      {match.bracketSeedNote ? (
        <p className="mt-3 rounded border border-amber-300/20 bg-amber-400/10 p-2 text-xs leading-5 text-amber-50/80">
          {match.bracketSeedNote}
        </p>
      ) : null}
    </article>
  );
}

function ProbabilityRow({ team, value, active }: { team: PredictionTeamSnapshot; value: number; active: boolean }) {
  return (
    <div className="min-w-0">
      <div className="mb-1 flex min-w-0 items-center justify-between gap-2">
        <span className={`flex min-w-0 items-center gap-2 text-sm font-semibold ${active ? "text-trophy" : "text-white/78"}`}>
          <TeamName team={team} />
        </span>
        <span className="shrink-0 text-sm font-black text-white">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-white/10">
        <div
          className={`h-full rounded ${active ? "bg-trophy" : "bg-sky-300/70"}`}
          style={{ width: `${clampedWidth(value)}%` }}
        />
      </div>
    </div>
  );
}

function DrawProbabilityRow({ value, active }: { value: number; active: boolean }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className={`text-sm font-semibold ${active ? "text-trophy" : "text-white/62"}`}>무승부</span>
        <span className="text-sm font-black text-white">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-white/10">
        <div className={`h-full rounded ${active ? "bg-trophy" : "bg-white/35"}`} style={{ width: `${clampedWidth(value)}%` }} />
      </div>
    </div>
  );
}

function clampedWidth(value: number) {
  return Math.max(4, Math.min(100, value));
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-3">
      <p className="text-xs font-black text-white/55">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item} tone="neutral">{item}</Badge>
        ))}
      </div>
    </div>
  );
}

function SourceSummary({ sources }: { sources: PredictionSourceSummary[] }) {
  return (
    <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral">출처 {sources.length}개</Badge>
        <Badge tone="신뢰도 높음">팀 상세 데이터 연결</Badge>
      </div>
      <h2 className="mt-3 text-xl font-black text-white">예측에 사용한 주요 출처</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {sources.slice(0, 9).map((source) => (
          <a
            key={`${source.sourceName}-${source.sourceUrl}`}
            href={source.sourceUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 rounded border border-white/10 bg-pitch-900/80 p-3 text-sm transition hover:border-trophy/50 hover:bg-white/[0.08]"
          >
            <Badge tone={confidenceTone(source.confidence)}>{source.confidence}</Badge>
            <p className="mt-3 break-words font-black text-white">{source.sourceName}</p>
            <p className="mt-1 text-xs text-white/50">{source.lastUpdated ?? "업데이트 날짜 확인 필요"}</p>
            {source.notes ? <p className="mt-2 text-xs leading-5 text-white/55">{source.notes}</p> : null}
          </a>
        ))}
      </div>
    </section>
  );
}

function TeamName({ team, size = "md" }: { team: PredictionTeamSnapshot; size?: "md" | "lg" }) {
  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-2 align-middle">
      <FlagIcon src={team.flagImageUrl} alt={team.flagAlt} fallback={team.flag} size={size === "lg" ? "lg" : "sm"} />
      <span className="min-w-0 break-words">{team.nameKo}</span>
    </span>
  );
}

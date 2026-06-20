"use client";

import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/Badge";
import { readArrayStorage, readStorage, storageKeys } from "@/lib/storage";
import type { CardRecord } from "@/types/card";
import type { FootballMatch } from "@/types/football";
import type { FreshInfoReflectionDiagnostics, SourcedFootballInfo, SourcedFootballInfoCategory } from "@/types/freshInfo";

type SourcedFreshInfoPanelProps = {
  targetType: "match" | "team";
  targetId: string | number;
  targetName?: string | null;
  relatedTeamNames?: Array<string | null | undefined>;
  homeTeamName?: string | null;
  awayTeamName?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  matchStatus?: string | null;
  matchDateTime?: string | null;
  venue?: string | null;
};

const categoryLabels: Record<SourcedFootballInfoCategory, string> = {
  match_result: "경기 결과",
  match_status: "경기 상태",
  venue: "경기장",
  card: "카드 현황",
  injury: "부상 현황",
  suspension: "징계/출전 금지",
  fitness: "체력 변수",
  lineup: "라인업",
  formation: "포메이션",
  tactics: "감독 전술",
  match_review: "경기 리뷰"
};

const categoryOrder: SourcedFootballInfoCategory[] = [
  "match_result",
  "match_status",
  "venue",
  "card",
  "injury",
  "suspension",
  "fitness",
  "lineup",
  "formation",
  "tactics",
  "match_review"
];

function formatDate(value: string | null | undefined) {
  if (!value) return "업데이트 시각 확인 필요";

  try {
    return new Intl.DateTimeFormat("ko-KR", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function statusLabel(item: SourcedFootballInfo) {
  if (item.status === "confirmed") return "출처 기반 확인";
  if (item.status === "multiple_sources") return "복수 출처 확인";
  if (item.status === "single_source") return "단일 출처 참고";
  if (item.status === "ai_inferred") return "AI 분석/추정";
  return "추가 확인 필요";
}

function statusTone(item: SourcedFootballInfo): Parameters<typeof Badge>[0]["tone"] {
  if (item.status === "confirmed" || item.status === "multiple_sources") return "success";
  if (item.status === "single_source" || item.status === "ai_inferred") return "warning";
  return "확인 필요";
}

function confidenceLabel(item: SourcedFootballInfo) {
  if (item.confidence === "high") return "높음";
  if (item.confidence === "medium") return "보통";
  if (item.confidence === "low") return "낮음";
  return "추가 확인 필요";
}

function normalized(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9가-힣]+/g, " ")
    .trim();
}

function matchesRelatedTeam(item: SourcedFootballInfo, relatedTeamNames: Array<string | null | undefined>) {
  const aliases = relatedTeamNames.map(normalized).filter(Boolean);
  if (aliases.length === 0) return false;

  const text = normalized([item.targetName, item.teamName, item.title, item.summary].filter(Boolean).join(" "));
  return aliases.some((alias) => text.includes(alias) || alias.includes(text));
}

function groupItems(items: SourcedFootballInfo[]) {
  return categoryOrder
    .map((category) => ({
      category,
      items: items.filter((item) => item.category === category)
    }))
    .filter((group) => group.items.length > 0);
}

type StructuredInfoCard = {
  key: string;
  title: string;
  badge: string;
  tone: Parameters<typeof Badge>[0]["tone"];
  body: string;
  details: string[];
  items: SourcedFootballInfo[];
  inferenceOnly: boolean;
};

type MatchRiskContext = {
  cardRecords: CardRecord[];
  matches: FootballMatch[];
};

function cleanSummary(value: string | null | undefined) {
  return (value ?? "")
    .replace(/^검색 provider가 관련 출처를 확인했습니다\.\s*/i, "")
    .replace(/^확정 사실은 출처 원문 기준으로 검토해야 하며,\s*/i, "")
    .replace(/^현재 요약은 다음 근거에 기반합니다:\s*/i, "")
    .replace(/현재 요약은 다음 근거에 기반합니다:\s*/i, "")
    .trim();
}

function categoryItems(items: SourcedFootballInfo[], categories: SourcedFootballInfoCategory[]) {
  return items.filter((item) => categories.includes(item.category));
}

function summarizedLines(items: SourcedFootballInfo[], fallback: string) {
  const lines = items
    .map((item) => cleanSummary(item.value ?? item.summary))
    .filter(Boolean)
    .filter((line, index, array) => array.indexOf(line) === index)
    .slice(0, 3);

  return lines.length > 0 ? lines : [fallback];
}

const categoryKeywords: Partial<Record<SourcedFootballInfoCategory, string[]>> = {
  match_result: ["score", "result", "defeated", "beat", "won", "draw", "경기 결과", "승리", "무승부", "스코어", "득점"],
  match_status: ["finished", "scheduled", "kickoff", "경기종료", "예정", "상태", "일정"],
  venue: ["venue", "stadium", "host", "kickoff", "guadalajara", "경기장", "개최", "킥오프", "일정"],
  card: ["card", "yellow", "red", "booking", "sent off", "경고", "퇴장", "카드"],
  injury: ["injury", "injured", "doubtful", "out", "부상", "출전 불투명", "결장"],
  suspension: ["suspension", "suspended", "ban", "red card", "징계", "출전 금지", "경고 누적"],
  fitness: ["fatigue", "rest", "travel", "fitness", "recovery", "체력", "휴식", "이동", "회복"],
  lineup: ["lineup", "starting", "xi", "squad", "선발", "라인업", "명단"],
  formation: ["formation", "shape", "포메이션", "전형"],
  tactics: ["tactic", "press", "block", "transition", "전술", "압박", "수비", "전환"],
  match_review: ["review", "key moment", "highlight", "경기 리뷰", "주요 장면", "득점", "승리"]
};

function textMatchesKeywords(value: string, keywords: string[]) {
  const text = normalized(value);
  return keywords.some((keyword) => text.includes(normalized(keyword)));
}

function sectionLines(items: SourcedFootballInfo[], fallback: string, categories: SourcedFootballInfoCategory[]) {
  const keywords = categories.flatMap((category) => categoryKeywords[category] ?? []);
  const lines = items
    .map((item) => {
      const summary = cleanSummary(item.value ?? item.summary);
      return summary || item.title;
    })
    .filter(Boolean)
    .filter((line) => keywords.length === 0 || textMatchesKeywords(line, keywords))
    .filter((line, index, array) => array.indexOf(line) === index)
    .slice(0, 3);

  return lines.length > 0 ? lines : [fallback];
}

function itemDisplaySummary(item: SourcedFootballInfo) {
  const summary = cleanSummary(item.value ?? item.summary);
  const keywords = categoryKeywords[item.category] ?? [];

  if (!summary) {
    return `${categoryLabels[item.category]} 항목으로 수집됐지만 요약 원문이 부족합니다. 출처 원문 확인 후 반영합니다.`;
  }

  if (keywords.length > 0 && !textMatchesKeywords(`${item.title} ${summary}`, keywords)) {
    return `${categoryLabels[item.category]} 항목으로 매핑됐지만 현재 요약은 경기 결과 중심입니다. 확정 기록은 출처 원문에서 해당 항목이 확인될 때만 반영합니다.`;
  }

  return summary;
}

function hasSourceBackedItem(items: SourcedFootballInfo[]) {
  return items.some((item) => item.sources.length > 0 && item.generatedBy === "search");
}

function hasScore(homeScore: number | null | undefined, awayScore: number | null | undefined) {
  return typeof homeScore === "number" && typeof awayScore === "number";
}

function teamNameMatches(a: string | null | undefined, b: string | null | undefined) {
  const left = normalized(a);
  const right = normalized(b);
  return Boolean(left && right && (left.includes(right) || right.includes(left)));
}

function recordMatchesCurrentTeam(record: CardRecord, props: SourcedFreshInfoPanelProps) {
  return teamNameMatches(record.teamName, props.homeTeamName) || teamNameMatches(record.teamName, props.awayTeamName);
}

function teamAppearsInMatch(match: FootballMatch, teamName: string | null | undefined) {
  return teamNameMatches(match.homeTeam, teamName) || teamNameMatches(match.awayTeam, teamName);
}

function formatStoredMatch(match: FootballMatch) {
  const score = hasScore(match.score.home, match.score.away) ? `${match.score.home}-${match.score.away}` : "스코어 확인 필요";
  const date = match.utcDate ? formatDate(match.utcDate) : "일정 확인 필요";
  return `${match.homeTeam} ${score} ${match.awayTeam} · ${date}`;
}

function cardRiskLines(props: SourcedFreshInfoPanelProps, context?: MatchRiskContext) {
  const records = context?.cardRecords ?? [];
  const direct = records.filter((record) => record.matchId !== null && String(record.matchId) === String(props.targetId));
  const related = records.filter((record) => recordMatchesCurrentTeam(record, props)).slice(0, 4);

  if (direct.length > 0) {
    return direct.slice(0, 4).map((record) => `${record.playerName ?? "선수 확인 필요"} · ${record.teamName ?? "팀 확인 필요"} · ${record.cardType}${record.minute ? ` ${record.minute}분` : ""}`);
  }

  if (related.length > 0) {
    return related.map((record) => `이전/저장 카드 참고: ${record.playerName ?? "선수 확인 필요"} · ${record.teamName ?? "팀 확인 필요"} · ${record.cardType}`);
  }

  return ["저장된 실제 카드 이벤트가 아직 없습니다. 미래 경기는 경고 누적·퇴장 리스크만 참고 정보로 표시합니다."];
}

function suspensionRiskLines(props: SourcedFreshInfoPanelProps, context?: MatchRiskContext) {
  const records = (context?.cardRecords ?? []).filter((record) => recordMatchesCurrentTeam(record, props));
  const severe = records.filter((record) => record.cardType === "레드카드" || record.cardType === "두 번째 경고").slice(0, 4);

  if (severe.length > 0) {
    return severe.map((record) => `징계 확인 대상: ${record.playerName ?? "선수 확인 필요"} · ${record.teamName ?? "팀 확인 필요"} · ${record.cardType}`);
  }

  return ["출전 금지 또는 징계 결장은 공식 발표/API/검색 출처가 있을 때만 확정 표시합니다."];
}

function fitnessRiskLines(props: SourcedFreshInfoPanelProps, context?: MatchRiskContext) {
  const matches = context?.matches ?? [];
  const currentDate = props.matchDateTime ? new Date(props.matchDateTime).getTime() : null;
  const teamNames = [props.homeTeamName, props.awayTeamName].filter(Boolean);
  const lines = teamNames
    .map((teamName) => {
      const previous = matches
        .filter((match) => teamAppearsInMatch(match, teamName))
        .filter((match) => match.utcDate && (currentDate === null || new Date(match.utcDate).getTime() < currentDate))
        .sort((a, b) => new Date(b.utcDate ?? 0).getTime() - new Date(a.utcDate ?? 0).getTime())[0];

      if (!previous) {
        return `${teamName}: 저장된 직전 경기 일정이 부족해 휴식일 계산은 참고 대기`;
      }

      const restDays = currentDate === null || !previous.utcDate ? null : Math.max(0, Math.round((currentDate - new Date(previous.utcDate).getTime()) / 86_400_000));
      return `${teamName}: 직전 저장 경기 ${formatStoredMatch(previous)}${restDays !== null ? ` · 휴식 ${restDays}일` : ""}`;
    })
    .filter(Boolean);

  return lines.length > 0 ? lines : ["휴식일·이동 거리·일정 밀도는 실제 일정 데이터가 충분할 때 계산합니다."];
}

function matchLooksFinished(props: SourcedFreshInfoPanelProps, resultItems: SourcedFootballInfo[]) {
  if (hasScore(props.homeScore, props.awayScore)) return true;
  const status = (props.matchStatus ?? "").toLowerCase();
  if (status.includes("finished") || status.includes("종료") || status.includes("ft")) return true;
  return resultItems.some((item) => /defeated|beat|won|승리|경기종료|finished/i.test(`${item.title} ${item.summary}`));
}

function buildMatchStructuredCards(items: SourcedFootballInfo[], props: SourcedFreshInfoPanelProps, context?: MatchRiskContext): StructuredInfoCard[] {
  const resultItems = categoryItems(items, ["match_result", "match_status"]);
  const venueItems = categoryItems(items, ["venue"]);
  const reviewItems = categoryItems(items, ["match_review", "tactics"]);
  const cardItems = categoryItems(items, ["card"]);
  const suspensionItems = categoryItems(items, ["suspension"]);
  const injuryItems = categoryItems(items, ["injury"]);
  const fitnessItems = categoryItems(items, ["fitness"]);
  const lineupItems = categoryItems(items, ["lineup", "formation"]);
  const finished = matchLooksFinished(props, resultItems);
  const scoreLabel = hasScore(props.homeScore, props.awayScore)
    ? `${props.homeTeamName ?? "홈팀"} ${props.homeScore} - ${props.awayScore} ${props.awayTeamName ?? "원정팀"}`
    : "스코어 확인 전";

  return [
    {
      key: "result",
      title: "경기 결과",
      badge: finished ? "확정/출처 기반" : "경기 전",
      tone: finished ? "success" : "warning",
      body: finished ? scoreLabel : "아직 확정 결과가 없는 경기입니다. 검색 출처가 있으면 참고 정보로만 표시합니다.",
      details: sectionLines(resultItems, finished ? "저장된 실제 결과를 우선 표시합니다." : "미래 경기라 실제 결과는 표시하지 않습니다.", ["match_result", "match_status"]),
      items: resultItems,
      inferenceOnly: !hasSourceBackedItem(resultItems)
    },
    {
      key: "venue",
      title: "경기장/일정",
      badge: props.venue ? "확정 참고" : "확인 필요",
      tone: props.venue ? "success" : "warning",
      body: `${props.matchDateTime ?? "일정 확인 필요"} · ${props.venue ?? "경기장 확인 필요"}`,
      details: sectionLines(venueItems, "경기장과 킥오프 시간은 FIFA/API 일정 데이터가 들어오면 자동 보강됩니다.", ["venue", "match_status"]),
      items: venueItems,
      inferenceOnly: !props.venue && !hasSourceBackedItem(venueItems)
    },
    {
      key: "review",
      title: finished ? "경기 리뷰" : "경기 전 프리뷰",
      badge: finished ? "리뷰" : "예측/리스크",
      tone: finished ? "success" : "분석 참고",
      body: finished
        ? "검색/저장 결과를 바탕으로 경기 흐름과 핵심 장면을 요약합니다."
        : "아직 끝나지 않은 경기이므로 실제 리뷰 대신 전술·라인업 리스크를 분리해 표시합니다.",
      details: sectionLines(reviewItems, finished ? "리뷰 원문이 확인되면 주요 장면, 카드, 부상 영향으로 나눠 표시합니다." : "미래 경기 분석은 확정 사실이 아닌 참고 분석입니다.", ["match_review", "tactics"]),
      items: reviewItems,
      inferenceOnly: !hasSourceBackedItem(reviewItems)
    },
    {
      key: "cards",
      title: "카드 현황",
      badge: finished ? "확정 기록 우선" : "리스크",
      tone: cardItems.length > 0 ? "success" : "warning",
      body: finished
        ? "실제 카드 이벤트가 있으면 선수명과 분 단위 기록을 우선 표시하고, 없으면 확인 필요로 둡니다."
        : "미래 경기는 실제 카드가 없으므로 경고 누적 위험과 징계 가능성을 예측/리스크로만 표시합니다.",
      details: [...sectionLines(cardItems, "출처 기반 카드 기록이 아직 없어 확정 기록으로 반영하지 않습니다.", ["card"]), ...cardRiskLines(props, context)].slice(0, 5),
      items: cardItems,
      inferenceOnly: !hasSourceBackedItem(cardItems)
    },
    {
      key: "suspensions",
      title: "징계/출전 금지",
      badge: suspensionItems.length > 0 ? "출처 확인" : "확인 필요",
      tone: suspensionItems.length > 0 ? "success" : "warning",
      body: "징계 결장, 경고 누적, 출전 금지는 공식 발표/API/검색 출처가 있을 때만 확정 사실로 표시합니다.",
      details: [...sectionLines(suspensionItems, "출처 기반 징계/출전 금지 기록이 아직 없습니다.", ["suspension"]), ...suspensionRiskLines(props, context)].slice(0, 5),
      items: suspensionItems,
      inferenceOnly: !hasSourceBackedItem(suspensionItems)
    },
    {
      key: "injuries",
      title: "부상/출전 가능성",
      badge: injuryItems.length > 0 ? "출처 참고" : "확인 필요",
      tone: injuryItems.length > 0 ? "success" : "warning",
      body: "부상, 징계 결장, 출전 금지는 공식 발표/API/검색 출처가 있는 항목만 사실로 표시합니다.",
      details: sectionLines(injuryItems, "확정 부상 출처가 없으면 결장으로 단정하지 않고 출전 가능성 확인 대상으로만 표시합니다.", ["injury"]),
      items: injuryItems,
      inferenceOnly: !hasSourceBackedItem(injuryItems)
    },
    {
      key: "fitness",
      title: "체력 변수",
      badge: fitnessItems.length > 0 ? "계산/출처 참고" : "내부 계산 대기",
      tone: fitnessItems.length > 0 ? "success" : "분석 참고",
      body: "휴식일, 이동 거리, 일정 밀도는 실제 일정 데이터가 있을 때 계산하고, 부족하면 참고 변수로 분리합니다.",
      details: [...sectionLines(fitnessItems, "체력 정보는 확정 사실이 아니라 일정 기반 참고 변수로 표시됩니다.", ["fitness"]), ...fitnessRiskLines(props, context)].slice(0, 5),
      items: fitnessItems,
      inferenceOnly: !hasSourceBackedItem(fitnessItems)
    },
    {
      key: "lineups",
      title: "라인업/포메이션",
      badge: lineupItems.length > 0 ? "출처 참고" : "예상",
      tone: lineupItems.length > 0 ? "success" : "분석 참고",
      body: finished
        ? "실제 선발 라인업이 있으면 우선 표시하고, 없으면 저장된 예상 명단과 분리합니다."
        : "미래 경기 라인업은 확정 명단이 아니므로 예상/리스크로 표시합니다.",
      details: sectionLines(lineupItems, "공식 라인업 발표 전까지는 예상 포메이션으로만 표시합니다.", ["lineup", "formation"]),
      items: lineupItems,
      inferenceOnly: !hasSourceBackedItem(lineupItems)
    }
  ];
}

function StructuredCardsGrid({ cards }: { cards: StructuredInfoCard[] }) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <article key={card.key} className="rounded border border-white/10 bg-pitch-900/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-black text-white">{card.title}</h3>
            <Badge tone={card.tone}>{card.badge}</Badge>
          </div>
          <p className="mt-3 text-sm font-semibold leading-6 text-white">{card.body}</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-white/68">
            {card.details.map((detail) => (
              <li key={`${card.key}-${detail}`}>{detail}</li>
            ))}
          </ul>
          <p className={`mt-3 rounded border p-2 text-xs leading-5 ${card.inferenceOnly ? "border-amber-300/25 bg-amber-400/10 text-amber-50/82" : "border-emerald-300/25 bg-emerald-400/10 text-emerald-50/82"}`}>
            {card.inferenceOnly ? "출처 없는 AI/내부 분석은 확정 사실이 아니라 참고 분석으로 분리됩니다." : "출처가 있는 항목은 출처 원문 확인이 가능한 참고 정보로 반영됩니다."}
          </p>
          {card.items.flatMap((item) => item.sources).length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {card.items
                .flatMap((item) => item.sources.map((source) => ({ ...source, itemId: item.id })))
                .slice(0, 3)
                .map((source) =>
                  source.url ? (
                    <a
                      key={`${card.key}-${source.itemId}-${source.title}-${source.url}`}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded border border-emerald-300/30 bg-emerald-400/10 px-2 py-1 font-semibold text-emerald-50 hover:bg-emerald-400/20"
                    >
                      {source.provider}: {source.title}
                    </a>
                  ) : (
                    <span key={`${card.key}-${source.itemId}-${source.title}`} className="rounded border border-white/10 bg-white/[0.04] px-2 py-1 font-semibold text-white/65">
                      {source.provider}: {source.title}
                    </span>
                  )
                )}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

export default function SourcedFreshInfoPanel(props: SourcedFreshInfoPanelProps) {
  const { targetType, targetId, targetName, relatedTeamNames = [] } = props;
  const [items, setItems] = useState<SourcedFootballInfo[]>([]);
  const [cardRecords, setCardRecords] = useState<CardRecord[]>([]);
  const [storedMatches, setStoredMatches] = useState<FootballMatch[]>([]);
  const [diagnostics, setDiagnostics] = useState<FreshInfoReflectionDiagnostics | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setItems(readArrayStorage<SourcedFootballInfo>(storageKeys.sourcedFootballInfoData));
      setCardRecords(readArrayStorage<CardRecord>(storageKeys.apiFootballCardRecordsData));
      setStoredMatches(readArrayStorage<FootballMatch>(storageKeys.apiMatchesData));
      setDiagnostics(readStorage<FreshInfoReflectionDiagnostics | null>(storageKeys.freshInfoReflectionDiagnosticsData, null));
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const reflectedItems = useMemo(() => {
    const id = String(targetId);
    const direct = items.filter((item) => item.targetType === targetType && String(item.targetId) === id);
    const related = targetType === "team" ? items.filter((item) => matchesRelatedTeam(item, [targetName, ...relatedTeamNames])) : [];
    const seen = new Set<string>();

    return [...direct, ...related]
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category));
  }, [items, relatedTeamNames, targetId, targetName, targetType]);

  const groups = groupItems(reflectedItems);
  const structuredCards =
    targetType === "match"
      ? buildMatchStructuredCards(reflectedItems, props, {
          cardRecords,
          matches: storedMatches
        })
      : [];

  if (groups.length === 0) {
    if (structuredCards.length > 0) {
      return (
        <section className="rounded border border-emerald-300/25 bg-emerald-400/10 p-5 shadow-panel">
          <div className="flex flex-wrap gap-2">
            <Badge tone="분석 참고">경기 상세 구조화 정보</Badge>
            <Badge tone="warning">출처 기반 최신 항목 대기</Badge>
          </div>
          <h2 className="mt-3 text-xl font-black text-white">{targetName ? `${targetName} 경기 정보 정리` : "경기 정보 정리"}</h2>
          <p className="mt-2 text-sm leading-6 text-emerald-50/75">
            검색/Tavily/Exa/API로 직접 연결된 항목이 아직 없어도, 경기 상세 화면에서 필요한 결과·경기장·카드·부상·체력·라인업 항목을 비워두지 않고 구분해 표시합니다.
          </p>
          <StructuredCardsGrid cards={structuredCards} />
        </section>
      );
    }

    if (!diagnostics || diagnostics.normalizedItems === 0) {
      return null;
    }

    return (
      <section className="rounded border border-amber-300/25 bg-amber-400/10 p-5 shadow-panel">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="warning">최신 정보 매핑 확인</Badge>
          <Badge tone="neutral">{diagnostics.normalizedItems}건 정규화됨</Badge>
        </div>
        <h2 className="mt-3 text-xl font-black text-white">출처 기반 최신 정보</h2>
        <p className="mt-3 text-sm leading-6 text-amber-50/80">
          최신 정보는 수집됐지만 이 페이지의 {targetType === "match" ? "matchId" : "teamId"}와 직접 연결된 항목이 없습니다.
          관리자 검토 모드의 최신 정보 반영 진단에서 매핑 실패 사유를 확인하세요.
        </p>
      </section>
    );
  }

  const sourceBacked = reflectedItems.filter((item) => item.sources.length > 0 && item.generatedBy === "search").length;
  const inferred = reflectedItems.length - sourceBacked;

  return (
    <section className="rounded border border-emerald-300/25 bg-emerald-400/10 p-5 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="success">출처 기반 최신 정보</Badge>
            <Badge tone="neutral">{reflectedItems.length}건 반영</Badge>
            {sourceBacked > 0 ? <Badge tone="success">출처 확인 {sourceBacked}건</Badge> : null}
            {inferred > 0 ? <Badge tone="warning">AI/내부 추정 {inferred}건</Badge> : null}
          </div>
          <h2 className="mt-3 text-xl font-black text-white">{targetName ? `${targetName} 최신 반영 정보` : "최신 반영 정보"}</h2>
          <p className="mt-2 text-sm leading-6 text-emerald-50/75">
            Tavily/Exa/API/fallback 결과를 정규화한 정보입니다. 출처가 있는 항목은 참고/확인 정보로, 출처 없는 분석은 확정 사실이 아닌 추정으로 분리합니다.
          </p>
        </div>
        {diagnostics ? (
          <div className="rounded border border-white/10 bg-pitch-900/80 px-3 py-2 text-sm font-black text-white">
            {formatDate(diagnostics.checkedAt)}
          </div>
        ) : null}
      </div>

      <StructuredCardsGrid cards={structuredCards} />

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {groups.map((group) => (
          <div key={group.category} className="rounded border border-white/10 bg-pitch-900/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-black text-white">{categoryLabels[group.category]}</h3>
              <Badge tone="neutral">{group.items.length}건</Badge>
            </div>
            <div className="mt-3 space-y-3">
              {group.items.slice(0, 6).map((item) => (
                <article key={item.id} className="rounded border border-white/10 bg-white/[0.04] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={statusTone(item)}>{statusLabel(item)}</Badge>
                    <Badge tone={item.generatedBy === "search" ? "success" : item.generatedBy === "ai_summary" ? "AI 예측" : "분석 참고"}>
                      {item.generatedBy === "search" ? "검색 출처" : item.generatedBy === "ai_summary" ? "AI 분석" : "내부 계산"}
                    </Badge>
                  </div>
                  <p className="mt-2 break-words text-sm font-black text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/68">{itemDisplaySummary(item)}</p>
                  <p className="mt-2 text-xs text-white/45">
                    신뢰도: {confidenceLabel(item)} · 업데이트: {formatDate(item.updatedAt)}
                  </p>
                  {item.sources.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {item.sources.slice(0, 3).map((source) =>
                        source.url ? (
                          <a
                            key={`${item.id}-${source.title}-${source.url}`}
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded border border-emerald-300/30 bg-emerald-400/10 px-2 py-1 font-semibold text-emerald-50 hover:bg-emerald-400/20"
                          >
                            {source.provider}: {source.title}
                          </a>
                        ) : (
                          <span key={`${item.id}-${source.title}`} className="rounded border border-white/10 bg-white/[0.04] px-2 py-1 font-semibold text-white/65">
                            {source.provider}: {source.title}
                          </span>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 rounded border border-amber-300/25 bg-amber-400/10 p-2 text-xs leading-5 text-amber-50/80">
                      출처 없는 AI/내부 분석이므로 확정 사실로 표시하지 않습니다.
                    </p>
                  )}
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>

      {diagnostics?.unmatchedItems ? (
        <p className="mt-4 rounded border border-amber-300/25 bg-amber-400/10 p-3 text-sm leading-6 text-amber-50/82">
          미반영 {diagnostics.unmatchedItems}건: {diagnostics.unmatchedReasons.slice(0, 2).join(" / ")}
        </p>
      ) : null}
    </section>
  );
}

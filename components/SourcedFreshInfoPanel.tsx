"use client";

import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/Badge";
import { readArrayStorage, readStorage, storageKeys } from "@/lib/storage";
import type { FreshInfoReflectionDiagnostics, SourcedFootballInfo, SourcedFootballInfoCategory } from "@/types/freshInfo";

type SourcedFreshInfoPanelProps = {
  targetType: "match" | "team";
  targetId: string | number;
  targetName?: string | null;
  relatedTeamNames?: Array<string | null | undefined>;
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

export default function SourcedFreshInfoPanel({ targetType, targetId, targetName, relatedTeamNames = [] }: SourcedFreshInfoPanelProps) {
  const [items, setItems] = useState<SourcedFootballInfo[]>([]);
  const [diagnostics, setDiagnostics] = useState<FreshInfoReflectionDiagnostics | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setItems(readArrayStorage<SourcedFootballInfo>(storageKeys.sourcedFootballInfoData));
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

  if (groups.length === 0) {
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

      <div className="mt-4 grid gap-4 md:grid-cols-2">
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
                  <p className="mt-2 text-sm leading-6 text-white/68">{item.summary}</p>
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

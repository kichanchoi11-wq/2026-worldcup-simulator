import type { DisplayBadge, SourceMeta } from "@/types/football";

export const dataSourceLabels = {
  api: "API 실제 데이터",
  ai: "AI 예측",
  user: "사용자 입력",
  scenario: "경우의 수",
  official: "공식",
  needsReview: "확인 필요"
} as const;

export function hasCompleteSource(source: Partial<SourceMeta> | null | undefined): source is SourceMeta {
  return Boolean(source?.sourceName && source.sourceUrl && source.lastUpdated);
}

export function canDisplayAsConfirmed(source: Partial<SourceMeta> | null | undefined) {
  return hasCompleteSource(source) && source.confidence !== "확인 필요" && source.confidence !== "표시 금지";
}

export function getVerificationBadge(source: Partial<SourceMeta> | null | undefined): DisplayBadge {
  if (!source || source.confidence === "표시 금지") {
    return "표시 금지";
  }

  if (canDisplayAsConfirmed(source)) {
    return source.isOfficial ? "공식" : "재검증 필요";
  }

  return "확인 필요";
}

export function valueOrReview(value: string | null | undefined, source: Partial<SourceMeta> | null | undefined) {
  if (!value || !canDisplayAsConfirmed(source)) {
    return "확인 필요";
  }

  return value;
}

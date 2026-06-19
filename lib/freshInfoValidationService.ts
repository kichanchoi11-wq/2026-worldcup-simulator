import type { FreshInfoConfidence, FreshInfoItem, FreshInfoSource, AIFreshInfoResult } from "@/types/freshInfo";

function uniqueStrings(values: Array<string | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value && value.trim().length > 0))));
}

export function confidenceFromItems(items: FreshInfoItem[]): FreshInfoConfidence {
  if (items.length === 0) {
    return "추가 확인 필요";
  }

  const confirmed = items.filter((item) => item.status === "확정" || item.status === "복수 출처 확인").length;
  const sourced = items.filter((item) => item.sourceNames.length > 0 && !item.sourceNames.includes("출처 확인 필요")).length;

  if (confirmed >= Math.ceil(items.length * 0.65) && sourced === items.length) {
    return "높음";
  }

  if (sourced >= Math.ceil(items.length * 0.5)) {
    return "보통";
  }

  if (items.some((item) => item.status === "추가 확인 필요")) {
    return "추가 확인 필요";
  }

  return "낮음";
}

export function validateFreshInfoResult(result: AIFreshInfoResult): AIFreshInfoResult {
  const checkedAt = result.searchedAt || new Date().toISOString();
  const sourceNames = new Set(result.sources.map((source) => source.name));
  const sourceUrls = new Map(result.sources.map((source) => [source.name, source.url]));
  const items = result.items.map((item) => {
    const names = uniqueStrings(item.sourceNames);
    const urls = uniqueStrings([...(item.sourceUrls ?? []), ...names.map((name) => sourceUrls.get(name))]);
    const hasKnownSource = names.some((name) => sourceNames.has(name)) || urls.length > 0;

    return {
      ...item,
      status: hasKnownSource ? item.status : "추가 확인 필요",
      sourceNames: hasKnownSource ? names : ["출처 확인 필요"],
      sourceUrls: urls,
      lastCheckedAt: item.lastCheckedAt || checkedAt
    };
  });

  return {
    ...result,
    items,
    confidence: confidenceFromItems(items),
    sources: dedupeSources(result.sources, checkedAt)
  };
}

function dedupeSources(sources: FreshInfoSource[], checkedAt: string) {
  const seen = new Set<string>();
  const next: FreshInfoSource[] = [];

  for (const source of sources) {
    const key = `${source.name}-${source.url ?? ""}-${source.sourceType}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    next.push({
      ...source,
      checkedAt: source.checkedAt || checkedAt
    });
  }

  return next;
}

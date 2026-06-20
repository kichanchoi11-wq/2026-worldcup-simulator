import type { AIAnalysisKind } from "@/types/ai";

export type AIChunk = {
  chunkId: string;
  taskType: AIAnalysisKind;
  targetId: string;
  payloadBytes: number;
  data: unknown;
};

type CompactProfile = {
  arrayLimit: number;
  nestedArrayLimit: number;
  stringLimit: number;
  sourceLimit: number;
};

const profiles: Record<"normal" | "tight" | "tiny", CompactProfile> = {
  normal: { arrayLimit: 10, nestedArrayLimit: 6, stringLimit: 520, sourceLimit: 8 },
  tight: { arrayLimit: 6, nestedArrayLimit: 4, stringLimit: 320, sourceLimit: 5 },
  tiny: { arrayLimit: 3, nestedArrayLimit: 2, stringLimit: 180, sourceLimit: 3 }
};

const heavyKeys = new Set([
  "rawData",
  "rawText",
  "rawResponse",
  "responseBody",
  "fullText",
  "fullResponse",
  "html",
  "body"
]);

const preferredKeys = new Set([
  "id",
  "teamId",
  "teamName",
  "name",
  "nameKo",
  "coachName",
  "formation",
  "formations",
  "recentFormation",
  "expectedFormation",
  "alternativeFormations",
  "summary",
  "message",
  "status",
  "source",
  "sourceName",
  "sourceUrl",
  "sources",
  "dataQuality",
  "count",
  "label",
  "resource",
  "riskLevel",
  "riskType",
  "playerName",
  "position",
  "availability",
  "injuryStatus",
  "suspensionStatus",
  "fatigueRisk",
  "yellowCards",
  "redCards",
  "missingReason",
  "updatedAt",
  "lastUpdated",
  "refreshedAt",
  "provider",
  "model",
  "ok"
]);

export function byteSizeOf(value: unknown) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return new TextEncoder().encode(text ?? "").length;
}

export function stableInputHash(value: unknown) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16);
}

function truncateText(value: string, limit: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit)}...`;
}

function arrayLimitForKey(key: string, profile: CompactProfile, depth: number) {
  if (key.toLowerCase().includes("source")) return profile.sourceLimit;
  if (key === "cardRecords") return Math.max(profile.arrayLimit * 2, profile.arrayLimit);
  if (key === "riskProfiles") return profile.arrayLimit;
  if (key === "resourceSnapshots" || key === "directResults") return profile.arrayLimit;
  if (key === "lineups" || key === "events" || key === "injuries" || key === "statistics") return profile.nestedArrayLimit;
  if (key === "players" || key === "expectedPlayers") return Math.max(profile.nestedArrayLimit, 5);
  return depth > 1 ? profile.nestedArrayLimit : profile.arrayLimit;
}

function compactArray(key: string, value: unknown[], profile: CompactProfile, depth: number) {
  const limit = arrayLimitForKey(key, profile, depth);
  return {
    items: value.slice(0, limit).map((item) => compactValue(item, profile, depth + 1)),
    omittedCount: Math.max(value.length - limit, 0),
    totalCount: value.length
  };
}

function compactObject(value: Record<string, unknown>, profile: CompactProfile, depth: number) {
  const entries = Object.entries(value).filter(([key]) => !heavyKeys.has(key));
  const ordered = [
    ...entries.filter(([key]) => preferredKeys.has(key)),
    ...entries.filter(([key]) => !preferredKeys.has(key))
  ];
  const maxKeys = depth > 2 ? 16 : 28;
  const next: Record<string, unknown> = {};

  for (const [key, item] of ordered.slice(0, maxKeys)) {
    if (Array.isArray(item)) {
      const compacted = compactArray(key, item, profile, depth);
      next[key] = compacted.items;
      if (compacted.omittedCount > 0) {
        next[`${key}OmittedCount`] = compacted.omittedCount;
        next[`${key}TotalCount`] = compacted.totalCount;
      }
      continue;
    }

    next[key] = compactValue(item, profile, depth + 1);
  }

  if (ordered.length > maxKeys) {
    next.omittedFieldCount = ordered.length - maxKeys;
  }

  return next;
}

export function compactValue(value: unknown, profile: CompactProfile = profiles.normal, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return truncateText(value, profile.stringLimit);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return compactArray("items", value, profile, depth).items;
  }
  if (typeof value === "object") {
    return compactObject(value as Record<string, unknown>, profile, depth);
  }
  return String(value);
}

export function compactAIInput(kind: AIAnalysisKind, input: unknown, level: "normal" | "tight" | "tiny" = "normal") {
  const compacted = compactValue(input, profiles[level]);

  return {
    kind,
    level,
    input: compacted,
    originalInputBytes: byteSizeOf(input),
    compactInputBytes: byteSizeOf(compacted),
    inputHash: stableInputHash(input)
  };
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : { value };
}

function chunkArrayField(
  base: Record<string, unknown>,
  kind: AIAnalysisKind,
  targetId: string,
  key: string,
  items: unknown[],
  chunkSize: number
): AIChunk[] {
  const chunks: AIChunk[] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    const data = {
      ...base,
      chunkInfo: {
        field: key,
        index: chunks.length + 1,
        totalChunks: Math.ceil(items.length / chunkSize)
      },
      [key]: items.slice(index, index + chunkSize)
    };
    chunks.push({
      chunkId: `${kind}-${targetId}-${key}-${chunks.length + 1}`,
      taskType: kind,
      targetId,
      payloadBytes: byteSizeOf(data),
      data
    });
  }
  return chunks;
}

export function createAIChunks(kind: AIAnalysisKind, targetId: string, compactInput: unknown): AIChunk[] {
  const record = toRecord(compactInput);
  const chunkKeys = ["riskProfiles", "cardRecords", "directResults", "resourceSnapshots", "lineups", "events", "injuries", "players"];

  for (const key of chunkKeys) {
    const value = record[key];
    if (Array.isArray(value) && value.length > 1) {
      const chunkSize = key === "cardRecords" ? 4 : key === "players" ? 4 : 2;
      return chunkArrayField({ ...record, [key]: [] }, kind, targetId, key, value, chunkSize);
    }
  }

  const entries = Object.entries(record);
  if (entries.length <= 1) return [];

  return entries.map(([key, value], index) => {
    const data = {
      chunkInfo: {
        field: key,
        index: index + 1,
        totalChunks: entries.length
      },
      [key]: value
    };
    return {
      chunkId: `${kind}-${targetId}-${key}-${index + 1}`,
      taskType: kind,
      targetId,
      payloadBytes: byteSizeOf(data),
      data
    };
  });
}

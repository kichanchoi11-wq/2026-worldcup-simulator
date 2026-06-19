export const storageKeys = {
  aiGroupSimulationData: "aiGroupSimulationData",
  aiTournamentSimulationData: "aiTournamentSimulationData",
  fullTournamentPredictionData: "fullTournamentPredictionData",
  userSimulationData: "userSimulationData",
  scenarioCalculatorData: "scenarioCalculatorData",
  savedScenarioList: "savedScenarioList",
  apiMatchesData: "apiMatchesData",
  apiStandingsData: "apiStandingsData",
  apiFootballTeamsData: "apiFootballTeamsData",
  apiFootballPlayersData: "apiFootballPlayersData",
  apiFootballCoachesData: "apiFootballCoachesData",
  apiFootballLineupsData: "apiFootballLineupsData",
  apiFootballEventsData: "apiFootballEventsData",
  apiFootballCardRecordsData: "apiFootballCardRecordsData",
  apiFootballInjuriesData: "apiFootballInjuriesData",
  apiFootballStatisticsData: "apiFootballStatisticsData",
  apiFootballPredictionsData: "apiFootballPredictionsData",
  apiFootballResourceSnapshotsData: "apiFootballResourceSnapshotsData",
  apiFootballUsageLogsData: "apiFootballUsageLogsData",
  apiFootballSyncLogsData: "apiFootballSyncLogsData",
  apiFootballProviderStatusData: "apiFootballProviderStatusData",
  aiAnalysesData: "worldCupAIAnalyses",
  aiStatusData: "worldCupAIStatus",
  aiFreshInfoData: "worldCupAIFreshInfo",
  aiFreshInfoStatusData: "worldCupAIFreshInfoStatus",
  sourcedFootballInfoData: "worldCupSourcedFootballInfo",
  freshInfoTargetMappingsData: "worldCupFreshInfoTargetMappings",
  freshInfoReflectionDiagnosticsData: "worldCupFreshInfoReflectionDiagnostics",
  footballRefreshSnapshotMetaData: "worldCupFootballRefreshSnapshotMeta",
  teamTacticsData: "worldCupTeamTactics",
  teamFormationsData: "worldCupTeamFormations",
  teamRiskProfilesData: "worldCupTeamRiskProfiles",
  koreaVsTeamPredictionsData: "koreaVsTeamPredictions",
  matchReviewsData: "worldCupMatchReviews",
  adminRecollectionJobsData: "worldCupAdminRecollectionJobs",
  adminRecollectionLastData: "worldCupAdminRecollectionLast",
  apiFootballDiagnosticsData: "worldCupApiFootballDiagnostics",
  aiDiagnosticsData: "worldCupAIDiagnostics",
  dataReflectionStatusData: "worldCupDataReflectionStatus",
  footballRefreshSnapshotData: "worldCupFootballRefreshSnapshot",
  lastAutoUpdateData: "worldCupLastAutoUpdate",
  lastManualRefreshData: "worldCupLastManualRefresh",
  adminManualGroupEntries: "adminManualGroupEntries",
  dataMigrationVersion: "dataMigrationVersion"
} as const;

export type StorageKey = (typeof storageKeys)[keyof typeof storageKeys];

export function readStorage<T>(key: StorageKey, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function readArrayStorage<T>(key: StorageKey): T[] {
  const value = readStorage<unknown>(key, []);
  return Array.isArray(value) ? (value as T[]) : [];
}

export function writeStorage<T>(key: StorageKey, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export type SafeStorageWriteResult = {
  ok: boolean;
  bytes: number;
  reason?: "server" | "localStorage_payload_too_large" | "storage_error";
  message?: string;
};

export function getStorageByteSize(value: unknown) {
  const payload = JSON.stringify(value);

  if (typeof Blob !== "undefined") {
    return new Blob([payload]).size;
  }

  return payload.length;
}

export function writeStorageSafely<T>(key: StorageKey, value: T, maxBytes = 200_000): SafeStorageWriteResult {
  if (typeof window === "undefined") {
    return {
      ok: false,
      bytes: 0,
      reason: "server",
      message: "브라우저 환경이 아니어서 localStorage에 저장하지 않았습니다."
    };
  }

  const bytes = getStorageByteSize(value);

  if (bytes > maxBytes) {
    return {
      ok: false,
      bytes,
      reason: "localStorage_payload_too_large",
      message: "검색 결과 원본이 커서 localStorage에 직접 저장하지 않고 요약/정규화 데이터만 저장했습니다."
    };
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return { ok: true, bytes };
  } catch (error) {
    return {
      ok: false,
      bytes,
      reason: "storage_error",
      message: error instanceof Error ? error.message : "localStorage 저장 중 오류가 발생했습니다."
    };
  }
}

export function removeStorageItem(key: StorageKey) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(key);
}

type MigrationResult = {
  migrated: boolean;
  touchedKeys: string[];
};

const currentMigrationVersion = "2026-06-latest-info-meta-storage";
const temporarySlotKeyword = "\uc2ac\ub86f";
const sourceRequiredKeys = new Set([
  "coachName",
  "formation",
  "tacticalNotes",
  "summary",
  "attackingStyle",
  "defensiveStyle",
  "pressingStyle",
  "buildUpStyle",
  "transitionStyle",
  "setPieceStyle",
  "expectedLineup",
  "lineup"
]);
const migratableStorageKeys: StorageKey[] = [
  storageKeys.aiGroupSimulationData,
  storageKeys.aiTournamentSimulationData,
  storageKeys.fullTournamentPredictionData,
  storageKeys.userSimulationData,
  storageKeys.scenarioCalculatorData,
  storageKeys.savedScenarioList,
  storageKeys.apiMatchesData,
  storageKeys.apiStandingsData,
  storageKeys.apiFootballTeamsData,
  storageKeys.apiFootballPlayersData,
  storageKeys.apiFootballCoachesData,
  storageKeys.apiFootballLineupsData,
  storageKeys.apiFootballEventsData,
  storageKeys.apiFootballCardRecordsData,
  storageKeys.apiFootballInjuriesData,
  storageKeys.apiFootballStatisticsData,
  storageKeys.apiFootballPredictionsData,
  storageKeys.apiFootballResourceSnapshotsData,
  storageKeys.apiFootballUsageLogsData,
  storageKeys.apiFootballSyncLogsData,
  storageKeys.apiFootballProviderStatusData,
  storageKeys.aiAnalysesData,
  storageKeys.aiStatusData,
  storageKeys.aiFreshInfoData,
  storageKeys.aiFreshInfoStatusData,
  storageKeys.sourcedFootballInfoData,
  storageKeys.freshInfoTargetMappingsData,
  storageKeys.freshInfoReflectionDiagnosticsData,
  storageKeys.footballRefreshSnapshotMetaData,
  storageKeys.teamTacticsData,
  storageKeys.teamFormationsData,
  storageKeys.teamRiskProfilesData,
  storageKeys.koreaVsTeamPredictionsData,
  storageKeys.matchReviewsData,
  storageKeys.adminRecollectionJobsData,
  storageKeys.adminRecollectionLastData,
  storageKeys.apiFootballDiagnosticsData,
  storageKeys.aiDiagnosticsData,
  storageKeys.dataReflectionStatusData,
  storageKeys.footballRefreshSnapshotData,
  storageKeys.lastAutoUpdateData,
  storageKeys.lastManualRefreshData
];

function containsTemporarySlotName(value: unknown) {
  return typeof value === "string" && value.includes(temporarySlotKeyword);
}

function hasCompleteSourceRecord(value: Record<string, unknown>) {
  return Boolean(value.sourceName && value.sourceUrl && value.lastUpdated);
}

function sanitizeTemporarySlotData(value: unknown): { value: unknown; changed: boolean } {
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const sanitized = sanitizeTemporarySlotData(item);
      changed = changed || sanitized.changed;
      return sanitized.value;
    });

    return { value: next, changed };
  }

  if (!value || typeof value !== "object") {
    if (containsTemporarySlotName(value)) {
      return { value: "공식 출처 확인 필요", changed: true };
    }

    return { value, changed: false };
  }

  let changed = false;
  const source = value as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  const hasCompleteSource = hasCompleteSourceRecord(source);

  for (const [key, item] of Object.entries(source)) {
    if ((key === "teamName" || key === "nameKo") && containsTemporarySlotName(item)) {
      next[key] = null;
      next.verificationStatus = "재검증 필요";
      next.dataSourceType = "확인 필요 데이터";
      next.sourceType = "확인 필요 데이터";
      next.migrationNote = "임시 자리명은 실제 팀명으로 사용하지 않습니다.";
      changed = true;
      continue;
    }

    if (sourceRequiredKeys.has(key) && item && !hasCompleteSource) {
      next[key] = null;
      next.verificationStatus = "재검증 필요";
      next.dataSourceType = "확인 필요 데이터";
      next.sourceType = "확인 필요 데이터";
      next.migrationNote = "출처 없는 감독/전술/포메이션/라인업 데이터는 확정 정보로 취급하지 않습니다.";
      changed = true;
      continue;
    }

    if (key === "playerName" && item && !hasCompleteSource) {
      next[key] = item;
      next.squadStatus = "확인 필요";
      next.availability = "확인 필요";
      next.migrationNote = "출처 없는 선수 데이터는 확정 정보로 표시하지 않습니다.";
      changed = true;
      continue;
    }

    const sanitized = sanitizeTemporarySlotData(item);
    next[key] = sanitized.value;
    changed = changed || sanitized.changed;
  }

  return { value: next, changed };
}

function compactStoredRefreshSnapshot(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Record<string, unknown>;
  const data = source.data && typeof source.data === "object" ? (source.data as Record<string, unknown>) : null;
  const refreshedAt = typeof source.refreshedAt === "string" ? source.refreshedAt : null;

  if (!data || !refreshedAt) {
    return null;
  }

  const freshInfoStatus =
    data.freshInfoStatus && typeof data.freshInfoStatus === "object"
      ? (data.freshInfoStatus as { reflectedCounts?: Partial<Record<string, number>>; sourceBackedItemCount?: number; targetMatchCount?: number; targetTeamCount?: number })
      : null;
  const freshInfoResults = Array.isArray(data.freshInfoResults) ? data.freshInfoResults : [];
  const reflected = freshInfoStatus?.reflectedCounts ?? {};

  return {
    snapshotId: `${typeof source.mode === "string" ? source.mode : "manual"}-${refreshedAt}`,
    createdAt: refreshedAt,
    updatedAt: refreshedAt,
    targetSummary: {
      matches: Array.isArray(data.matches) ? data.matches.length : freshInfoStatus?.targetMatchCount ?? 0,
      teams: Array.isArray(data.teams) ? data.teams.length : freshInfoStatus?.targetTeamCount ?? 0,
      players:
        data.fallbackResources && typeof data.fallbackResources === "object" && Array.isArray((data.fallbackResources as Record<string, unknown>).players)
          ? ((data.fallbackResources as Record<string, unknown>).players as unknown[]).length
          : 0
    },
    counts: {
      sourcedItems: freshInfoStatus?.sourceBackedItemCount ?? freshInfoResults.length,
      cards: reflected.cards ?? 0,
      injuries: reflected.injuries ?? 0,
      suspensions: reflected.suspensions ?? 0,
      lineups: reflected.lineupsAndFormations ?? 0,
      formations: reflected.lineupsAndFormations ?? 0,
      reviews: reflected.reviews ?? 0,
      fitness: reflected.fitness ?? 0
    },
    sourceProviders: [],
    status: source.ok === false ? "failed" : "partial",
    storageMode: "localStorage-meta-only"
  };
}

export function migrateStoredFootballData(): MigrationResult {
  if (typeof window === "undefined") {
    return { migrated: false, touchedKeys: [] };
  }

  const previousVersion = window.localStorage.getItem(storageKeys.dataMigrationVersion);
  if (previousVersion === currentMigrationVersion) {
    return { migrated: false, touchedKeys: [] };
  }

  const touchedKeys: string[] = [];

  for (const key of migratableStorageKeys) {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (key === storageKeys.footballRefreshSnapshotData) {
        const compactSnapshot = compactStoredRefreshSnapshot(parsed);
        if (compactSnapshot) {
          window.localStorage.setItem(storageKeys.footballRefreshSnapshotData, JSON.stringify(compactSnapshot));
          window.localStorage.setItem(storageKeys.footballRefreshSnapshotMetaData, JSON.stringify(compactSnapshot));
          touchedKeys.push(key);
          continue;
        }
      }
      const sanitized = sanitizeTemporarySlotData(parsed);
      if (sanitized.changed) {
        window.localStorage.setItem(key, JSON.stringify(sanitized.value));
        touchedKeys.push(key);
      }
    } catch {
      touchedKeys.push(`${key}:parse-skip`);
    }
  }

  window.localStorage.setItem(storageKeys.dataMigrationVersion, currentMigrationVersion);

  return {
    migrated: touchedKeys.length > 0,
    touchedKeys
  };
}

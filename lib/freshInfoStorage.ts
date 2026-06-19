"use client";

import {
  createFreshInfoMappings,
  createFreshInfoReflectionDiagnostics,
  createRefreshSnapshotMeta,
  measureFreshInfoStorage,
  normalizeFreshInfoResults
} from "@/lib/freshInfoReflection";
import { storageKeys, writeStorageSafely } from "@/lib/storage";
import type { FootballDataRefreshSnapshot } from "@/lib/autoUpdateService";
import type { FreshInfoReflectionDiagnostics, RefreshSnapshotMeta, SourcedFootballInfo } from "@/types/freshInfo";

export type PersistedFreshInfoSnapshot = {
  meta: RefreshSnapshotMeta;
  sourcedItems: SourcedFootballInfo[];
  diagnostics: FreshInfoReflectionDiagnostics;
  message: string;
};

function asArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

export function persistFreshInfoSnapshotMeta(snapshot: FootballDataRefreshSnapshot): PersistedFreshInfoSnapshot {
  const freshInfoResults = asArray(snapshot.data?.freshInfoResults);
  const sourcedItems = normalizeFreshInfoResults(freshInfoResults);
  const meta = createRefreshSnapshotMeta(snapshot, sourcedItems);
  const measured = measureFreshInfoStorage(snapshot, meta, sourcedItems);
  const snapshotStorage = writeStorageSafely(storageKeys.footballRefreshSnapshotData, meta);
  writeStorageSafely(storageKeys.footballRefreshSnapshotMetaData, meta);
  writeStorageSafely(storageKeys.sourcedFootballInfoData, sourcedItems);
  writeStorageSafely(storageKeys.freshInfoTargetMappingsData, createFreshInfoMappings(sourcedItems));

  const diagnostics = createFreshInfoReflectionDiagnostics({
    results: freshInfoResults,
    sourcedItems,
    originalSnapshotBytes: measured.originalSnapshotBytes,
    metaBytes: measured.metaBytes,
    normalizedBytes: measured.normalizedBytes,
    snapshotStorage
  });

  writeStorageSafely(storageKeys.freshInfoReflectionDiagnosticsData, diagnostics);

  return {
    meta,
    sourcedItems,
    diagnostics,
    message:
      snapshotStorage.ok
        ? "worldCupFootballRefreshSnapshot에는 메타데이터만 저장했고, 화면 표시용 최신 정보는 정규화 저장소에 분리했습니다."
        : diagnostics.storage.message
  };
}

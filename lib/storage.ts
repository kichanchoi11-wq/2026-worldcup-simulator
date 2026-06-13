export const storageKeys = {
  aiGroupSimulationData: "aiGroupSimulationData",
  aiTournamentSimulationData: "aiTournamentSimulationData",
  userSimulationData: "userSimulationData",
  scenarioCalculatorData: "scenarioCalculatorData",
  savedScenarioList: "savedScenarioList"
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

export function writeStorage<T>(key: StorageKey, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function removeStorageItem(key: StorageKey) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(key);
}

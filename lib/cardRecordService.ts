import { teamVerificationData } from "@/data/teamVerificationData";
import type { FootballMatch } from "@/types/football";
import type { CardRecord, CardTypeLabel } from "@/types/card";

type CardBuildInput = {
  apiEvents: unknown[];
  matches: FootballMatch[];
  refreshedAt: string;
};

function eventObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function nestedObject(value: unknown, key: string): Record<string, unknown> | null {
  const source = eventObject(value);
  const nested = source?.[key];

  return nested && typeof nested === "object" ? (nested as Record<string, unknown>) : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeCardType(detail: string | null): CardTypeLabel {
  const normalized = detail?.toLowerCase() ?? "";

  if (normalized.includes("second")) {
    return "두 번째 경고";
  }

  if (normalized.includes("red")) {
    return "레드카드";
  }

  if (normalized.includes("yellow")) {
    return "옐로카드";
  }

  return "확인 필요";
}

function matchForFixture(matches: FootballMatch[], fixtureId: number | null) {
  if (fixtureId === null) {
    return null;
  }

  return matches.find((match) => match.apiId === fixtureId) ?? null;
}

function apiEventCardRecord(value: unknown, matches: FootballMatch[], refreshedAt: string, index: number): CardRecord | null {
  const event = eventObject(value);

  if (!event || stringValue(event.type) !== "Card") {
    return null;
  }

  const time = nestedObject(event, "time");
  const team = nestedObject(event, "team");
  const player = nestedObject(event, "player");
  const fixture = nestedObject(event, "fixture");
  const fixtureId = numberValue(fixture?.id);
  const match = matchForFixture(matches, fixtureId);
  const teamId = team?.id === undefined || team?.id === null ? null : String(team.id);
  const detail = stringValue(event.detail);

  return {
    id: `api-card-${fixtureId ?? "unknown"}-${teamId ?? "team"}-${index}`,
    matchId: match?.id ?? null,
    fixtureId,
    teamId,
    teamName: stringValue(team?.name),
    playerName: stringValue(player?.name),
    minute: numberValue(time?.elapsed),
    cardType: normalizeCardType(detail),
    reason: stringValue(event.comments) ?? detail ?? "API-Football 카드 이벤트",
    sourceName: "API-Football",
    sourceUrl: "https://www.api-football.com/documentation-v3#tag/Fixtures/operation/get-fixtures-events",
    lastUpdated: refreshedAt
  };
}

function fallbackCardRecords(refreshedAt: string): CardRecord[] {
  return teamVerificationData.flatMap((team) => {
    const trackedPlayers = team.playerStatuses.slice(0, 2);

    return trackedPlayers.map((player, index) => ({
      id: `fallback-card-${team.teamId}-${player.playerId}-${index}`,
      matchId: null,
      fixtureId: null,
      teamId: team.teamId,
      teamName: team.teamName,
      playerName: player.playerName,
      minute: null,
      cardType: "확인 필요" as const,
      reason:
        player.yellowCards !== null || player.redCards !== null
          ? `정적 데이터 기준 경고 ${player.yellowCards ?? 0}, 퇴장 ${player.redCards ?? 0}. API-Football 무료 플랜에서 2026 events 접근이 막히거나 fixtureId가 없으면 실제 카드 기록은 공식 경기 보고서 확인 후 교체됩니다.`
          : "API-Football 무료 플랜에서 2026 events 접근이 막히거나 fixtureId가 없어 실제 카드 이벤트를 직접 수집하지 못했습니다. 공식 경기 보고서가 들어오면 실제 카드 기록으로 교체됩니다.",
      sourceName: "정적 기본 데이터" as const,
      sourceUrl: team.sources.find((source) => source.sourceUrl)?.sourceUrl ?? null,
      lastUpdated: refreshedAt
    }));
  });
}

export function buildCardRecords({ apiEvents, matches, refreshedAt }: CardBuildInput): CardRecord[] {
  const apiCards = apiEvents
    .map((event, index) => apiEventCardRecord(event, matches, refreshedAt, index))
    .filter((record): record is CardRecord => Boolean(record));

  return apiCards.length > 0 ? apiCards : fallbackCardRecords(refreshedAt);
}

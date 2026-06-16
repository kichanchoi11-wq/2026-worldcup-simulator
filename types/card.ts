export type CardTypeLabel = "옐로카드" | "레드카드" | "두 번째 경고" | "확인 필요";

export type CardRecordSource = "API-Football" | "football-data.org" | "캐시" | "정적 기본 데이터" | "확인 필요";

export type CardRecord = {
  id: string;
  matchId: string | number | null;
  fixtureId: number | null;
  teamId: string | null;
  teamName: string | null;
  playerName: string | null;
  minute: number | null;
  cardType: CardTypeLabel;
  reason: string | null;
  sourceName: CardRecordSource;
  sourceUrl: string | null;
  lastUpdated: string;
};

import type { FootballApiEnvelope, FootballMatch, StandingRow } from "@/types/football";

const footballDataBaseUrl = "https://api.football-data.org/v4";

function getApiKey() {
  return process.env.FOOTBALL_DATA_API_KEY;
}

function missingKeyEnvelope<T>(data: T): FootballApiEnvelope<T> {
  return {
    ok: false,
    source: "football-data.org",
    lastUpdated: new Date().toISOString(),
    message: "API 키가 설정되지 않아 실시간 데이터를 불러올 수 없습니다. Vercel 환경변수를 확인해 주세요.",
    data
  };
}

export async function fetchFootballData<T>(path: string, fallback: T): Promise<FootballApiEnvelope<T>> {
  const apiKey = getApiKey();

  if (!apiKey) {
    return missingKeyEnvelope(fallback);
  }

  try {
    const response = await fetch(`${footballDataBaseUrl}${path}`, {
      headers: {
        "X-Auth-Token": apiKey
      },
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      return {
        ok: false,
        source: "football-data.org",
        lastUpdated: new Date().toISOString(),
        message: "API 데이터를 불러오지 못했습니다. 기존 저장 데이터를 유지합니다.",
        data: fallback
      };
    }

    const payload = (await response.json()) as T;
    return {
      ok: true,
      source: "football-data.org",
      lastUpdated: new Date().toISOString(),
      message: null,
      data: payload
    };
  } catch {
    return {
      ok: false,
      source: "football-data.org",
      lastUpdated: new Date().toISOString(),
      message: "API 데이터를 불러오지 못했습니다. 기존 저장 데이터를 유지합니다.",
      data: fallback
    };
  }
}

export function normalizeMatches(payload: unknown): FootballMatch[] {
  const matches = (payload as { matches?: Array<Record<string, unknown>> }).matches ?? [];

  return matches.map((match) => {
    const homeTeam = match.homeTeam as Record<string, unknown> | undefined;
    const awayTeam = match.awayTeam as Record<string, unknown> | undefined;
    const score = match.score as Record<string, Record<string, number | null> | undefined> | undefined;
    const fullTime = score?.fullTime;
    const status = String(match.status ?? "확인 필요");

    return {
      id: String(match.id ?? `${homeTeam?.name ?? "home"}-${awayTeam?.name ?? "away"}-${match.utcDate ?? ""}`),
      apiId: typeof match.id === "number" ? match.id : undefined,
      matchNumber: typeof match.matchday === "number" ? match.matchday : null,
      stage: String(match.stage ?? "GROUP_STAGE"),
      group: typeof match.group === "string" ? match.group : null,
      utcDate: typeof match.utcDate === "string" ? match.utcDate : null,
      status,
      venue: typeof match.venue === "string" ? match.venue : null,
      homeTeam: String(homeTeam?.name ?? "홈팀 확인 필요"),
      awayTeam: String(awayTeam?.name ?? "원정팀 확인 필요"),
      score: {
        home: fullTime?.home ?? null,
        away: fullTime?.away ?? null
      },
      winner: typeof score?.winner === "string" ? score.winner : null,
      sourceType: "API 실제 데이터",
      locked: status === "FINISHED",
      lastUpdated: new Date().toISOString()
    };
  });
}

export function normalizeStandings(payload: unknown): StandingRow[] {
  const standings = (payload as { standings?: Array<{ group?: string; table?: Array<Record<string, unknown>> }> }).standings ?? [];

  return standings.flatMap((standing) =>
    (standing.table ?? []).map((row) => {
      const team = row.team as Record<string, unknown> | undefined;
      const goalsFor = Number(row.goalsFor ?? 0);
      const goalsAgainst = Number(row.goalsAgainst ?? 0);

      return {
        team: String(team?.name ?? "팀명 확인 필요"),
        group: String(standing.group ?? "조 확인 필요"),
        played: Number(row.playedGames ?? 0),
        won: Number(row.won ?? 0),
        drawn: Number(row.draw ?? 0),
        lost: Number(row.lost ?? 0),
        goalsFor,
        goalsAgainst,
        goalDifference: Number(row.goalDifference ?? goalsFor - goalsAgainst),
        points: Number(row.points ?? 0),
        sourceType: "API 실제 데이터"
      };
    })
  );
}

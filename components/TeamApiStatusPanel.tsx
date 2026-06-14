"use client";

import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/Badge";
import { readStorage, storageKeys } from "@/lib/storage";
import type { FootballDataRefreshSnapshot } from "@/lib/autoUpdateService";
import type { ApiFootballResourceSnapshot, ApiFootballTeamRecord } from "@/types/football";

type TeamApiStatusPanelProps = {
  teamNameKo: string;
  teamNameEn: string;
  teamCode: string | null;
};

type TeamApiState = {
  teams: ApiFootballTeamRecord[];
  resourceSnapshots: ApiFootballResourceSnapshot[];
  providerStatus: FootballDataRefreshSnapshot["data"]["providerStatus"] | null;
};

const initialState: TeamApiState = {
  teams: [],
  resourceSnapshots: [],
  providerStatus: null
};

function sourceTone(snapshot: ApiFootballResourceSnapshot): Parameters<typeof Badge>[0]["tone"] {
  if (snapshot.source === "api-football" && !snapshot.isFallbackData) {
    return "success";
  }

  if (snapshot.source === "football-data.org" || snapshot.source === "cache") {
    return "warning";
  }

  return "neutral";
}

export default function TeamApiStatusPanel({ teamNameKo, teamNameEn, teamCode }: TeamApiStatusPanelProps) {
  const [state, setState] = useState<TeamApiState>(initialState);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setState({
        teams: readStorage<ApiFootballTeamRecord[]>(storageKeys.apiFootballTeamsData, []),
        resourceSnapshots: readStorage<ApiFootballResourceSnapshot[]>(storageKeys.apiFootballResourceSnapshotsData, []),
        providerStatus: readStorage<FootballDataRefreshSnapshot["data"]["providerStatus"] | null>(storageKeys.apiFootballProviderStatusData, null)
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const apiTeam = useMemo(() => {
    const code = teamCode?.toUpperCase();
    const names = new Set([teamNameKo.toLowerCase(), teamNameEn.toLowerCase()]);

    return state.teams.find((team) => {
      const apiCode = team.code?.toUpperCase();
      const apiName = team.name.toLowerCase();
      return Boolean((code && apiCode === code) || names.has(apiName));
    });
  }, [state.teams, teamCode, teamNameEn, teamNameKo]);

  return (
    <section className="rounded border border-sky-300/25 bg-sky-400/10 p-5 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="success">API-Football 우선</Badge>
            <Badge tone="warning">fallback 보호</Badge>
          </div>
          <h2 className="mt-3 text-xl font-black text-white">API 저장 데이터 상태</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-sky-50/75">
            팀 화면은 저장된 API-Football 데이터를 먼저 확인하고, 부족한 선수·감독·전술·부상·예측 항목은 검증된 정적 데이터와 내부 시뮬레이션으로 표시합니다.
          </p>
        </div>
        <div className="rounded border border-white/10 bg-pitch-900/80 p-3 text-sm font-semibold text-white/80">
          남은 호출 {state.providerStatus?.apiFootball.remaining ?? 100}회
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Status label="API 팀 매칭" value={apiTeam ? `${apiTeam.name}${apiTeam.code ? ` · ${apiTeam.code}` : ""}` : "저장된 API 팀 데이터 없음"} />
        <Status label="API 호출량" value={`${state.providerStatus?.apiFootball.used ?? 0}/${state.providerStatus?.apiFootball.limit ?? 100}회`} />
        <Status label="캐시 항목" value={`${state.providerStatus?.cacheEntries.length ?? 0}개`} />
        <Status label="저장 리소스" value={`${state.resourceSnapshots.length}종`} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {state.resourceSnapshots.slice(0, 10).map((snapshot) => (
          <article key={snapshot.resource} className="rounded border border-white/10 bg-pitch-900/80 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge tone={sourceTone(snapshot)}>{snapshot.source}</Badge>
              <span className="text-xs font-semibold text-white/50">{snapshot.count}개</span>
            </div>
            <h3 className="mt-3 font-black text-white">{snapshot.label}</h3>
            <p className="mt-2 text-xs leading-5 text-white/55">{snapshot.dataQuality}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/10 bg-pitch-900/80 p-3">
      <p className="text-xs font-semibold text-white/50">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-white">{value}</p>
    </div>
  );
}

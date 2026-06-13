"use client";

import { useState } from "react";
import MatchCard from "@/components/MatchCard";
import type { FootballApiEnvelope, FootballMatch, StandingRow } from "@/types/football";

type LiveState = {
  loading: boolean;
  message: string | null;
  matches: FootballMatch[];
  standings: StandingRow[];
};

export default function LiveDataPanel() {
  const [state, setState] = useState<LiveState>({
    loading: false,
    message: "실시간 데이터를 불러오려면 새로고침을 실행하세요.",
    matches: [],
    standings: []
  });

  async function refresh() {
    setState((current) => ({ ...current, loading: true, message: null }));
    const [matchesResponse, standingsResponse] = await Promise.all([
      fetch("/api/football/matches"),
      fetch("/api/football/standings")
    ]);
    const matchesPayload = (await matchesResponse.json()) as FootballApiEnvelope<FootballMatch[]>;
    const standingsPayload = (await standingsResponse.json()) as FootballApiEnvelope<StandingRow[]>;

    setState({
      loading: false,
      message: matchesPayload.message ?? standingsPayload.message,
      matches: matchesPayload.data,
      standings: standingsPayload.data
    });
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-white/10 bg-white/[0.06] p-4">
        <div>
          <h2 className="text-xl font-black text-white">football-data.org 실시간 결과</h2>
          <p className="mt-1 text-sm text-white/60">서버 API Route를 통해서만 외부 API 키를 사용합니다.</p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={state.loading}
          className="rounded border border-trophy/60 bg-trophy/20 px-4 py-2 text-sm font-black text-white transition hover:bg-trophy/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state.loading ? "불러오는 중" : "API 경기 데이터 새로고침"}
        </button>
      </div>

      {state.message ? (
        <p className="rounded border border-amber-300/30 bg-amber-400/10 p-4 text-sm font-semibold text-amber-50">
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <h3 className="font-black text-white">경기 일정·결과</h3>
          {state.matches.length > 0 ? (
            <div className="grid gap-3">
              {state.matches.slice(0, 12).map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <p className="rounded border border-white/10 bg-white/[0.04] p-4 text-sm text-white/60">표시할 API 경기 데이터가 없습니다.</p>
          )}
        </div>
        <div className="space-y-3">
          <h3 className="font-black text-white">실제 순위표</h3>
          <div className="overflow-hidden rounded border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/10 text-xs uppercase text-white/55">
                <tr>
                  <th className="px-3 py-2">조</th>
                  <th className="px-3 py-2">팀</th>
                  <th className="px-3 py-2">승점</th>
                  <th className="px-3 py-2">득실</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {state.standings.slice(0, 24).map((row) => (
                  <tr key={`${row.group}-${row.team}`} className="bg-white/[0.04] text-white/80">
                    <td className="px-3 py-2">{row.group}</td>
                    <td className="px-3 py-2 font-semibold">{row.team}</td>
                    <td className="px-3 py-2">{row.points}</td>
                    <td className="px-3 py-2">{row.goalDifference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

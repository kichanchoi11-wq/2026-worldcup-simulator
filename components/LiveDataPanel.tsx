"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/Badge";
import MatchCard from "@/components/MatchCard";
import { readStorage, storageKeys, writeStorage } from "@/lib/storage";
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedMatches = readStorage<FootballMatch[]>(storageKeys.apiMatchesData, []);
      const storedStandings = readStorage<StandingRow[]>(storageKeys.apiStandingsData, []);

      if (storedMatches.length > 0 || storedStandings.length > 0) {
        setState({
          loading: false,
          message: "이전에 저장한 API 실제 데이터를 표시 중입니다. 새로고침하면 최신 응답만 별도로 반영합니다.",
          matches: storedMatches,
          standings: storedStandings
        });
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function refresh() {
    setState((current) => ({ ...current, loading: true, message: null }));

    try {
      const [matchesResponse, standingsResponse] = await Promise.all([
        fetch("/api/football/matches"),
        fetch("/api/football/standings")
      ]);

      if (!matchesResponse.ok || !standingsResponse.ok) {
        throw new Error("API Route response failed");
      }

      const matchesPayload = (await matchesResponse.json()) as FootballApiEnvelope<FootballMatch[]>;
      const standingsPayload = (await standingsResponse.json()) as FootballApiEnvelope<StandingRow[]>;

      if (matchesPayload.ok && matchesPayload.data.length > 0) {
        writeStorage(storageKeys.apiMatchesData, matchesPayload.data);
      }

      if (standingsPayload.ok && standingsPayload.data.length > 0) {
        writeStorage(storageKeys.apiStandingsData, standingsPayload.data);
      }

      setState((current) => {
        const nextMatches = matchesPayload.ok && matchesPayload.data.length > 0 ? matchesPayload.data : current.matches;
        const nextStandings = standingsPayload.ok && standingsPayload.data.length > 0 ? standingsPayload.data : current.standings;
        const messages = [matchesPayload.message, standingsPayload.message].filter(Boolean);

        return {
          loading: false,
          message:
            messages.length > 0
              ? messages.join(" ")
              : "API 실제 데이터를 새로고침했습니다. 사용자 입력·AI 예측·경우의 수 데이터와 분리해 저장했습니다.",
          matches: nextMatches,
          standings: nextStandings
        };
      });
    } catch {
      setState((current) => ({
        ...current,
        loading: false,
        message: "API 새로고침 중 오류가 발생했습니다. 이전에 저장된 API 실제 데이터와 사용자 입력 데이터는 유지합니다."
      }));
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-white/10 bg-white/[0.06] p-4">
        <div>
          <h2 className="text-xl font-black text-white">football-data.org 실시간 결과</h2>
          <p className="mt-1 text-sm text-white/60">서버 API Route를 통해서만 외부 API 키를 사용합니다.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="API 실제 데이터">API 실제 데이터</Badge>
          <Badge tone="neutral">저장 경기 {state.matches.length}개</Badge>
          <Badge tone="neutral">저장 순위 {state.standings.length}개</Badge>
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

      <div className="grid gap-3 md:grid-cols-3">
        <GuideItem title="API 키 없음" body="환경변수가 없으면 외부 요청을 중단하고, 저장 데이터와 사용자 입력은 건드리지 않습니다." />
        <GuideItem title="응답 실패" body="HTTP 오류나 네트워크 오류가 나면 마지막으로 저장된 API 실제 데이터만 유지합니다." />
        <GuideItem title="빈 응답" body="API가 정상 응답해도 표시할 경기나 순위가 없으면 기존 저장값을 덮어쓰지 않습니다." />
      </div>

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
                {state.standings.length > 0 ? (
                  state.standings.slice(0, 24).map((row) => (
                    <tr key={`${row.group}-${row.team}`} className="bg-white/[0.04] text-white/80">
                      <td className="px-3 py-2">{row.group}</td>
                      <td className="px-3 py-2 font-semibold">{row.team}</td>
                      <td className="px-3 py-2">{row.points}</td>
                      <td className="px-3 py-2">{row.goalDifference}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="bg-white/[0.04] text-white/65">
                    <td className="px-3 py-4" colSpan={4}>
                      표시할 API 순위표 데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function GuideItem({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded border border-white/10 bg-white/[0.04] p-4">
      <p className="font-black text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-white/60">{body}</p>
    </div>
  );
}

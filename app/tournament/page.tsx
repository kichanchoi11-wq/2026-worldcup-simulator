import Badge from "@/components/Badge";
import Bracket from "@/components/Bracket";
import TournamentSimulationPanel from "@/components/TournamentSimulationPanel";
import { buildOfficialBracket } from "@/lib/bracket";

export default function TournamentPage() {
  const bracket = buildOfficialBracket();

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-black text-trophy">토너먼트</p>
        <h1 className="mt-2 text-3xl font-black text-white">공식 2026 브래킷 구조</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">
          경기 번호와 라운드 연결은 고정합니다. 조별 순위가 바뀌어도 공식 대진 자리에 들어가는 팀만 바뀝니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="공식">경기 번호 73~104 고정</Badge>
          <Badge tone="warning">3위 공식 배정표 확인 필요</Badge>
          <Badge tone="API 실제 데이터">실제 결과 고정 기본값</Badge>
        </div>
      </section>
      <Bracket matches={bracket} />
      <TournamentSimulationPanel />
    </div>
  );
}

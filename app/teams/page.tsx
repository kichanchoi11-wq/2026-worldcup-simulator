import Badge from "@/components/Badge";
import TeamInfoCard from "@/components/TeamInfoCard";
import { getBaseGroups } from "@/lib/scenario";

export default function TeamsPage() {
  const teams = getBaseGroups().flatMap((group) => group.teams);

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-black text-trophy">팀 정보</p>
        <h1 className="mt-2 text-3xl font-black text-white">출처 검증 전면 초기화</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">
          선수 명단, 감독, 전술, 포메이션, 예상 라인업은 공식 출처 확인 전까지 확정 정보로 표시하지 않습니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="확인 필요">선수 명단 재검증 필요</Badge>
          <Badge tone="표시 금지">출처 없는 라인업 표시 금지</Badge>
          <Badge tone="재검증 필요">대한민국 정보 전면 재검증</Badge>
        </div>
      </section>

      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <h2 className="text-xl font-black text-white">국가 상세 페이지 공통 상태</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[
            ["선수 명단", "재검증 필요"],
            ["감독 정보", "공식 출처 확인 필요"],
            ["포메이션", "확인 필요"],
            ["전술 분석", "재수집 필요"],
            ["예상 라인업", "표시 불가"],
            ["부상/징계 정보", "출처 확인 필요"]
          ].map(([label, value]) => (
            <div key={label} className="rounded border border-white/10 bg-pitch-900/80 p-3">
              <p className="text-xs text-white/50">{label}</p>
              <p className="mt-1 font-black text-white">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {teams.map((team) => (
          <TeamInfoCard key={team.id} team={team} />
        ))}
      </section>
    </div>
  );
}

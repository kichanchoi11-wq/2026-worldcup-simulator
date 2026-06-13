import Badge from "@/components/Badge";
import PlayerRosterVerificationPanel from "@/components/PlayerRosterVerificationPanel";
import TeamInfoCard from "@/components/TeamInfoCard";
import { teamVerificationRequirements } from "@/data/teamVerificationData";
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
        <p className="mt-2 text-sm leading-6 text-white/62">
          팀 정보 재검증 중입니다. 선수 명단, 감독, 포메이션, 전술, 예상 라인업은 공식 출처 확인 전까지 확정 정보로 표시하지 않습니다.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {teamVerificationRequirements.map((item) => (
            <div key={item.title} className="rounded border border-white/10 bg-pitch-900/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-black text-white">{item.title}</p>
                <Badge tone={item.status === "표시 불가" ? "표시 금지" : item.status === "재검증 필요" ? "재검증 필요" : "확인 필요"}>
                  {item.status}
                </Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/62">{item.description}</p>
              <p className="mt-3 text-xs font-semibold text-white/45">필요한 출처: {item.requiredSources.join(", ")}</p>
            </div>
          ))}
        </div>
      </section>

      <PlayerRosterVerificationPanel teams={teams} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {teams.map((team) => (
          <TeamInfoCard key={team.id} team={team} />
        ))}
      </section>
    </div>
  );
}

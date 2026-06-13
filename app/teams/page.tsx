import Badge from "@/components/Badge";
import PlayerRosterVerificationPanel from "@/components/PlayerRosterVerificationPanel";
import TeamInfoCard from "@/components/TeamInfoCard";
import { teamVerificationRequirements } from "@/data/teamVerificationData";
import { getBaseGroups } from "@/lib/scenario";
import type { VerificationStatus } from "@/types/team";

function getRequirementTone(status: VerificationStatus): Parameters<typeof Badge>[0]["tone"] {
  if (status === "공식 확인") {
    return "공식 확인";
  }

  if (status === "분석 참고") {
    return "분석 참고";
  }

  if (status === "표시 불가") {
    return "표시 금지";
  }

  if (status === "재검증 필요") {
    return "재검증 필요";
  }

  return "확인 필요";
}

export default function TeamsPage() {
  const teams = getBaseGroups().flatMap((group) => group.teams);

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-black text-trophy">팀 정보</p>
        <h1 className="mt-2 text-3xl font-black text-white">최종 명단·감독·전술 메모</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">
          모든 참가국의 최종 명단 등록 상태와 감독명을 채우고, 포메이션과 전술은 경기별 공식 선발표와 분리된 분석 참고 정보로 표시합니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="공식 확인">최종 명단 등록</Badge>
          <Badge tone="공식 확인">감독 정보 입력</Badge>
          <Badge tone="분석 참고">전술·포메이션 참고</Badge>
          <Badge tone="확인 필요">경기별 선발 확인 필요</Badge>
        </div>
      </section>

      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <h2 className="text-xl font-black text-white">국가 상세 페이지 공통 상태</h2>
        <p className="mt-2 text-sm leading-6 text-white/62">
          최종 명단과 감독은 공개 명단 기준으로 표시합니다. 예상 라인업과 부상·징계는 경기별 공식 리포트가 나오는 즉시 갱신해야 합니다.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {teamVerificationRequirements.map((item) => (
            <div key={item.title} className="rounded border border-white/10 bg-pitch-900/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-black text-white">{item.title}</p>
                <Badge tone={getRequirementTone(item.status)}>{item.status}</Badge>
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

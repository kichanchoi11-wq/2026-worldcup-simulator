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

  if (status === "신뢰도 높음") {
    return "신뢰도 높음";
  }

  if (status === "분석 참고") {
    return "분석 참고";
  }

  if (status === "추가 수집 필요") {
    return "추가 수집 필요";
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
        <h1 className="mt-2 text-3xl font-black text-white">국가별 팀 정보와 출처 검증</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">
          국가 카드를 선택하면 상세 페이지에서 선수 명단, 포메이션, 전술, 대한민국 관점 분석, 카드·부상·징계 상태를 확인할 수 있습니다.
          신뢰 가능한 스쿼드 가이드와 공식 일정 출처가 있는 정보는 먼저 채우고, 경기 직전 변수는 별도 확인 상태로 표시합니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="공식 확인">조 편성 공식 확인</Badge>
          <Badge tone="신뢰도 높음">팀 정보 보강</Badge>
          <Badge tone="분석 참고">전술/포메이션 참고</Badge>
          <Badge tone="추가 수집 필요">경기별 선발 확인 필요</Badge>
        </div>
      </section>

      <section className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <h2 className="text-xl font-black text-white">국가 상세 페이지 공통 상태</h2>
        <p className="mt-2 text-sm leading-6 text-white/62">
          감독, 핵심 선수, 포메이션, 전술, 예상 라인업은 출처명, 출처 URL, 업데이트 날짜와 함께 표시합니다. 카드·부상·징계는 경기 전 공식 발표가 확인되면 갱신합니다.
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

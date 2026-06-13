import Badge from "@/components/Badge";
import DataSourceBadge from "@/components/DataSourceBadge";
import type { TeamGroup } from "@/types/football";

const temporarySlotKeyword = "\uc2ac\ub86f";

function getSlotText(team: TeamGroup["teams"][number]) {
  return `${team.group}조 · ${team.position}번 자리`;
}

function getTeamDisplayName(team: TeamGroup["teams"][number]) {
  return team.nameKo.includes(temporarySlotKeyword) ? "국가명 확인 전" : team.nameKo;
}

export default function GroupTable({ groups }: { groups: TeamGroup[] }) {
  return (
    <div className="space-y-5">
      <section className="rounded border border-sky-300/25 bg-sky-400/10 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="수동 확인">조 편성 데이터 확인 중</Badge>
          <Badge tone="API 실제 데이터">API 데이터와 분리</Badge>
        </div>
        <h2 className="mt-3 text-xl font-black text-white">조 편성 데이터 확인 중</h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-sky-50/80">
          공개 조 편성 자료를 기준으로 국가명을 표시합니다. football-data.org에서 더 최신 경기·순위 데이터가 제공되면 실제 데이터로 별도 반영하며,
          선수 명단과 전술 정보는 출처 확인 전까지 확정 표시하지 않습니다.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {groups.map((group) => (
        <section key={group.id} className="rounded border border-white/10 bg-white/[0.06] p-4 shadow-panel">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-white">{group.name}</h2>
              <p className="text-sm text-white/60">1~4번 자리와 데이터 출처를 분리 관리</p>
            </div>
            <DataSourceBadge sourceType={group.sourceType} />
          </div>
          <div className="space-y-2">
            {group.teams.map((team, index) => (
              <article key={team.id} className="rounded border border-white/10 bg-pitch-900/75 p-3">
                <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded bg-white/10 text-sm font-black text-white">{index + 1}</span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">
                      <span className="mr-2">{team.flag}</span>
                      {getTeamDisplayName(team)}
                    </p>
                    <p className="truncate text-xs text-white/55">{getSlotText(team)}</p>
                  </div>
                  <Badge tone={team.verificationStatus}>{team.verificationStatus}</Badge>
                </div>
                <dl className="mt-3 grid gap-2 text-xs text-white/65">
                  <div className="flex justify-between gap-3">
                    <dt>출처</dt>
                    <dd className="truncate text-right font-semibold text-white">{team.sourceName ?? "공식 출처 확인 필요"}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>업데이트</dt>
                    <dd className="font-semibold text-white">{team.lastUpdated ?? "데이터 업데이트 필요"}</dd>
                  </div>
                </dl>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button type="button" className="rounded border border-white/10 bg-white/5 px-2 py-2 text-xs font-black text-white/80">
                    실제 결과
                  </button>
                  <button type="button" className="rounded border border-violet-300/30 bg-violet-400/10 px-2 py-2 text-xs font-black text-violet-50">
                    AI 예측
                  </button>
                  <button type="button" className="rounded border border-amber-300/30 bg-amber-400/10 px-2 py-2 text-xs font-black text-amber-50">
                    사용자 입력
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
      </div>
    </div>
  );
}

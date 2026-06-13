import Badge from "@/components/Badge";
import DataSourceBadge from "@/components/DataSourceBadge";
import type { TeamGroup } from "@/types/football";

export default function GroupTable({ groups }: { groups: TeamGroup[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {groups.map((group) => (
        <section key={group.id} className="rounded border border-white/10 bg-white/[0.06] p-4 shadow-panel">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-white">{group.name}</h2>
              <p className="text-sm text-white/60">상위 2팀과 3위 후보를 분리 관리</p>
            </div>
            <DataSourceBadge sourceType={group.sourceType} />
          </div>
          <div className="space-y-2">
            {group.teams.map((team, index) => (
              <div key={team.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded border border-white/10 bg-pitch-900/75 p-3">
                <span className="grid h-8 w-8 place-items-center rounded bg-white/10 text-sm font-black text-white">{index + 1}</span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">
                    <span className="mr-2">{team.flag}</span>
                    {team.nameKo}
                  </p>
                  <p className="truncate text-xs text-white/55">{team.sourceName ?? "공식 출처 확인 전"}</p>
                </div>
                <Badge tone={team.verificationStatus}>{team.verificationStatus}</Badge>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

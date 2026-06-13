import Badge from "@/components/Badge";
import type { TeamRef } from "@/types/football";

export default function TeamInfoCard({ team }: { team: TeamRef }) {
  return (
    <article className="rounded border border-white/10 bg-white/[0.06] p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl">{team.flag}</p>
          <h2 className="mt-2 text-lg font-black text-white">{team.nameKo}</h2>
          <p className="text-sm text-white/55">{team.group}조 · {team.slot}</p>
        </div>
        <Badge tone={team.verificationStatus}>{team.verificationStatus}</Badge>
      </div>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-white/55">선수 명단</dt>
          <dd className="font-semibold text-white">재검증 필요</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-white/55">감독 정보</dt>
          <dd className="font-semibold text-white">공식 출처 확인 필요</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-white/55">포메이션</dt>
          <dd className="font-semibold text-white">확인 필요</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-white/55">예상 라인업</dt>
          <dd className="font-semibold text-white">표시 불가</dd>
        </div>
      </dl>
    </article>
  );
}

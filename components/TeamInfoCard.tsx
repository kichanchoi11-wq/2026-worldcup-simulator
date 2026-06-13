import Badge from "@/components/Badge";
import { getTeamVerificationData } from "@/data/teamVerificationData";
import type { TeamRef } from "@/types/football";

export default function TeamInfoCard({ team }: { team: TeamRef }) {
  const verification = getTeamVerificationData(team.nameKo);
  const slotText = `${team.group}조 · ${team.position}번 자리`;

  return (
    <article className="rounded border border-white/10 bg-white/[0.06] p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl">{team.flag}</p>
          <h2 className="mt-2 text-lg font-black text-white">{team.nameKo}</h2>
          <p className="text-sm text-white/55">{slotText}</p>
          <p className="mt-1 text-xs text-white/45">{team.teamCode ?? "팀 코드 확인 필요"}</p>
        </div>
        <Badge tone={team.verificationStatus}>{team.verificationStatus}</Badge>
      </div>
      <dl className="space-y-2 text-sm">
        <InfoRow label="선수 명단" value={verification?.squadStatus ?? "재검증 필요"} />
        <InfoRow label="감독 정보" value={verification?.coachStatus ?? "확인 필요"} />
        <InfoRow label="포메이션" value={verification?.formationStatus ?? "확인 필요"} />
        <InfoRow label="전술 분석" value={verification?.tacticsStatus ?? "재검증 필요"} />
        <InfoRow label="예상 라인업" value={verification?.lineupStatus ?? "표시 불가"} />
        <InfoRow label="부상·징계" value={verification?.injurySuspensionStatus ?? "확인 필요"} />
      </dl>
      <div className="mt-4 rounded border border-white/10 bg-pitch-900/80 p-3">
        <p className="text-xs font-black text-trophy">세부 정보 표시 기준</p>
        <p className="mt-2 text-xs leading-5 text-white/62">
          공식 출처 확인 전까지 선수명, 감독명, 포메이션, 전술, 예상 라인업은 확정 정보로 표시하지 않습니다.
        </p>
      </div>
    </article>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-white/55">{label}</dt>
      <dd className="text-right font-semibold text-white">{value}</dd>
    </div>
  );
}

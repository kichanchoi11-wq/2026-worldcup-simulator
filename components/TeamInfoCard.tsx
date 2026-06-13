import Badge from "@/components/Badge";
import FlagIcon from "@/components/FlagIcon";
import { getTeamVerificationData } from "@/data/teamVerificationData";
import type { TeamRef } from "@/types/football";

export default function TeamInfoCard({ team }: { team: TeamRef }) {
  const verification = getTeamVerificationData(team.nameKo);
  const slotText = `${team.group}조 · ${team.position}번 자리`;

  return (
    <article className="rounded border border-white/10 bg-white/[0.06] p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <FlagIcon src={team.flagImageUrl} alt={team.flagAlt} fallback={team.flag} size="lg" />
          <h2 className="mt-2 break-words text-lg font-black text-white">{team.nameKo}</h2>
          <p className="text-sm text-white/55">{slotText}</p>
          <p className="mt-1 text-xs text-white/45">{team.teamCode ?? "팀 코드 확인 필요"}</p>
        </div>
        <Badge tone={team.verificationStatus}>{team.verificationStatus}</Badge>
      </div>
      <dl className="space-y-2 text-sm">
        <InfoRow label="감독" value={verification?.coachName ?? "확인 필요"} />
        <InfoRow label="선수 명단" value={verification?.squadSummary ?? "확인 필요"} />
        <InfoRow label="기본 전형" value={verification?.formationSummary ?? "확인 필요"} />
        <InfoRow label="전술 메모" value={verification?.tacticsSummary ?? "확인 필요"} />
        <InfoRow label="예상 라인업" value={verification?.lineupSummary ?? "공식 선발표 확인 필요"} />
        <InfoRow label="부상·징계" value={verification?.riskSummary ?? "공식 리포트 확인 필요"} />
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone={verification?.squadStatus === "공식 확인" ? "공식 확인" : "확인 필요"}>
          명단 {verification?.squadStatus ?? "확인 필요"}
        </Badge>
        <Badge tone={verification?.formationStatus === "분석 참고" ? "분석 참고" : "확인 필요"}>
          전형 {verification?.formationStatus ?? "확인 필요"}
        </Badge>
        <Badge tone={verification?.lineupStatus === "확인 필요" ? "확인 필요" : "공식 확인"}>
          선발 {verification?.lineupStatus ?? "확인 필요"}
        </Badge>
      </div>
      {verification?.squadSourceUrl ? (
        <a
          href={verification.squadSourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 block rounded border border-white/10 bg-pitch-900/80 p-3 text-xs font-semibold leading-5 text-trophy transition hover:bg-white/10"
        >
          출처: {verification.squadSourceName}
        </a>
      ) : null}
    </article>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3">
      <dt className="text-white/55">{label}</dt>
      <dd className="min-w-0 break-words text-right font-semibold leading-6 text-white">{value}</dd>
    </div>
  );
}

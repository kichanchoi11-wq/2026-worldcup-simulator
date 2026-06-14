import Link from "next/link";
import Badge from "@/components/Badge";
import FlagIcon from "@/components/FlagIcon";
import { getTeamVerificationData } from "@/data/teamVerificationData";
import type { TeamRef } from "@/types/football";

export default function TeamInfoCard({ team }: { team: TeamRef }) {
  const verification = getTeamVerificationData(team.nameKo);
  const slotText = `${team.group}조 · ${team.position}번 자리`;
  const keyPlayers = verification?.notablePlayers.slice(0, 3).map((player) => player.playerName).join(", ");
  const notablePlayers = verification?.notablePlayers.slice(3, 5).map((player) => player.playerName).join(", ");
  const tacticalKeywords = verification?.tactics.strengths.slice(0, 3).join(", ");
  const strengths = verification?.tactics.strengths.slice(0, 2).join(", ");
  const weaknesses = verification?.tactics.weaknesses.slice(0, 2).join(", ");

  return (
    <Link href={`/teams/${team.teamSlug}`} className="block min-w-0 rounded border border-white/10 bg-white/[0.06] p-4 transition hover:border-trophy/50 hover:bg-white/[0.09] focus:outline-none focus:ring-2 focus:ring-trophy/60">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <FlagIcon src={team.flagImageUrl} alt={team.flagAlt} fallback={team.flag} />
            <h2 className="min-w-0 break-words text-lg font-black text-white">{team.nameKo}</h2>
          </div>
          <p className="text-sm text-white/55">{slotText}</p>
          <p className="mt-1 text-xs text-white/45">{team.teamCode ?? "팀 코드 확인 필요"}</p>
        </div>
        <Badge tone={verification?.dataStatus.confidence ?? team.verificationStatus}>{verification?.dataStatus.confidence ?? team.verificationStatus}</Badge>
      </div>

      <dl className="space-y-2 text-sm">
        <InfoRow label="감독" value={verification?.coach.coachName ?? "추가 수집 필요"} />
        <InfoRow label="최근 포메이션" value={verification?.formation.formation ?? "확인 필요"} />
        <InfoRow label="예상 포메이션" value={verification?.expectedLineup.formation ?? "확인 필요"} />
        <InfoRow label="핵심 선수" value={keyPlayers ?? "추가 수집 필요"} />
        <InfoRow label="주목 선수" value={notablePlayers || "추가 수집 필요"} />
        <InfoRow label="전술 키워드" value={tacticalKeywords ?? "추가 수집 필요"} />
        <InfoRow label="강점" value={strengths ?? "추가 수집 필요"} />
        <InfoRow label="약점" value={weaknesses ?? "추가 수집 필요"} />
        <InfoRow label="전력 지표" value={verification?.powerIndex ?? "확인 필요"} />
        <InfoRow label="출처" value={`${verification?.sources.length ?? 0}개`} />
        <InfoRow label="업데이트" value={verification?.lastUpdated ?? "업데이트 필요"} />
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone={verification?.players.length ? "신뢰도 높음" : "추가 수집 필요"}>{verification?.players.length ?? 0}명</Badge>
        <Badge tone={verification?.dataStatus.squad ?? "확인 필요"}>명단 {verification?.dataStatus.squad ?? "확인 필요"}</Badge>
        <Badge tone={verification?.dataStatus.formation ?? "확인 필요"}>포메이션 {verification?.dataStatus.formation ?? "확인 필요"}</Badge>
        <Badge tone={verification?.dataStatus.tactics ?? "확인 필요"}>전술 {verification?.dataStatus.tactics ?? "확인 필요"}</Badge>
      </div>
      <p className="mt-4 rounded border border-white/10 bg-pitch-900/80 p-3 text-xs font-semibold leading-5 text-trophy">
        상세 페이지 보기
      </p>
    </Link>
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

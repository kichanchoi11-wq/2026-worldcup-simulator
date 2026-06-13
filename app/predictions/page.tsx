import Badge from "@/components/Badge";
import GroupSimulationPanel from "@/components/GroupSimulationPanel";
import { getBaseGroups } from "@/lib/scenario";

const variables = [
  "API 실제 경기 데이터",
  "공식 소집 명단",
  "검증된 최근 경기 결과",
  "검증된 감독 정보",
  "검증된 포메이션 정보",
  "검증된 전술 정보",
  "부상·징계·카드·체력 정보",
  "휴식일",
  "연장전 피로도",
  "최근 득점·실점"
];

export default function PredictionsPage() {
  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-black text-trophy">AI 예측</p>
        <h1 className="mt-2 text-3xl font-black text-white">검증된 데이터만 반영하는 예측</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">
          팀 정보가 검증되지 않아 선수·감독·전술·포메이션 기반 예측을 제한합니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="AI 예측">AI 예측</Badge>
          <Badge tone="확인 필요">불확실성 요인 표시</Badge>
          <Badge tone="API 실제 데이터">실제 결과 우선</Badge>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {variables.map((item) => (
          <div key={item} className="rounded border border-white/10 bg-white/[0.06] p-4">
            <p className="text-sm font-semibold text-white">{item}</p>
            <p className="mt-2 text-xs text-white/50">출처 확인 후 반영</p>
          </div>
        ))}
      </section>

      <GroupSimulationPanel groups={getBaseGroups()} />
    </div>
  );
}

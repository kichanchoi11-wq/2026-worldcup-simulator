import GroupSimulationPanel from "@/components/GroupSimulationPanel";
import GroupTable from "@/components/GroupTable";
import LiveDataPanel from "@/components/LiveDataPanel";
import { getBaseGroups } from "@/lib/scenario";

export default function GroupsPage() {
  const groups = getBaseGroups();

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-black text-trophy">조별리그</p>
        <h1 className="mt-2 text-3xl font-black text-white">공식 조 편성, 실제 결과, AI 예측 분리</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">
          공개 조 편성 자료로 확인한 국가명은 표시하고, 실제 경기 결과·순위는 API 또는 공식 출처 확인 후 별도 데이터로 반영합니다.
        </p>
      </section>
      <GroupTable groups={groups} />
      <GroupSimulationPanel groups={groups} />
      <LiveDataPanel />
    </div>
  );
}

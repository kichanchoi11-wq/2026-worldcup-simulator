import LiveDataPanel from "@/components/LiveDataPanel";

export default function LivePage() {
  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-black text-trophy">실시간 결과</p>
        <h1 className="mt-2 text-3xl font-black text-white">경기 일정·결과·순위표 API 연동</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">
          FOOTBALL_DATA_API_KEY가 없거나 API가 빈 응답을 보내도 저장된 데이터와 사용자 입력은 유지되며, 앱은 정상 작동합니다.
        </p>
      </section>
      <LiveDataPanel />
    </div>
  );
}

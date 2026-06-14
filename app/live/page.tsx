import LiveDataPanel from "@/components/LiveDataPanel";

export default function LivePage() {
  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-black text-trophy">실시간 결과</p>
        <h1 className="mt-2 text-3xl font-black text-white">경기 일정·결과·순위표 API 연동</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">
          공개 화면은 저장된 API 실제 데이터만 읽습니다. 외부 API 동기화는 관리자 검토 모드에서 실행하며, 실패 시 football-data.org, 저장 캐시, 정적 기본 데이터 순서로 fallback합니다.
        </p>
      </section>
      <LiveDataPanel />
    </div>
  );
}

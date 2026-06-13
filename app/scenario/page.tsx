import ScenarioCalculator from "@/components/ScenarioCalculator";

export default function ScenarioPage() {
  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-black text-trophy">경우의 수 계산기</p>
        <h1 className="mt-2 text-3xl font-black text-white">사용자 직접 선택 시나리오</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">
          실제 결과와 분리된 사용자 입력 데이터로 32강부터 결승까지의 진출 경우의 수를 계산합니다.
        </p>
      </section>
      <ScenarioCalculator />
    </div>
  );
}

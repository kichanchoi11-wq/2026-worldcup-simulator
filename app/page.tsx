import Link from "next/link";
import Badge from "@/components/Badge";
import DataSourceBadge from "@/components/DataSourceBadge";

const featureCards = [
  {
    title: "조별리그 실제 데이터",
    body: "football-data.org API로 일정, 결과, 순위표를 서버 Route에서 조회합니다.",
    href: "/groups",
    sourceType: "API 실제 데이터" as const
  },
  {
    title: "공식 브래킷 토너먼트",
    body: "32강부터 결승까지 경기 번호 73~104의 공식 연결 구조를 고정합니다.",
    href: "/tournament",
    sourceType: "공식 출처 데이터" as const
  },
  {
    title: "경우의 수 계산기",
    body: "사용자가 조 순위, 3위 후보, 각 경기 승자를 직접 선택해 시나리오를 저장합니다.",
    href: "/scenario",
    sourceType: "경우의 수 계산기 데이터" as const
  },
  {
    title: "검증 중심 팀 정보",
    body: "출처 없는 선수·감독·전술·포메이션 정보는 확정 정보로 표시하지 않습니다.",
    href: "/teams",
    sourceType: "확인 필요 데이터" as const
  }
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="grid min-h-[520px] overflow-hidden rounded border border-white/10 bg-pitch-900 shadow-panel lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
          <div className="mb-5 flex flex-wrap gap-2">
            <Badge tone="gold">2026 FIFA World Cup</Badge>
            <Badge tone="API 실제 데이터">실제 결과 고정</Badge>
            <Badge tone="확인 필요">출처 검증 우선</Badge>
          </div>
          <h1 className="max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">
            2026 FIFA 월드컵 시뮬레이터
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/70">
            실제 경기 데이터, AI 예측, 사용자 입력, 경우의 수 계산기 데이터를 분리해 조별리그부터 결승까지 시뮬레이션합니다.
            종료된 실제 경기는 예측이나 사용자 입력으로 덮어쓰지 않습니다.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/groups" className="rounded border border-trophy/70 bg-trophy/20 px-5 py-3 text-sm font-black text-white transition hover:bg-trophy/30">
              조별리그 보기
            </Link>
            <Link href="/scenario" className="rounded border border-white/15 bg-white/8 px-5 py-3 text-sm font-black text-white transition hover:bg-white/12">
              시나리오 만들기
            </Link>
          </div>
        </div>
        <div className="field-lines relative min-h-[360px] border-t border-white/10 bg-[radial-gradient(circle_at_50%_30%,rgba(217,164,65,0.24),transparent_32%),linear-gradient(135deg,rgba(36,107,254,0.14),rgba(214,75,75,0.12))] lg:border-l lg:border-t-0">
          <div className="absolute inset-6 rounded border border-white/20" />
          <div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />
          <div className="absolute bottom-8 left-8 right-8 rounded border border-white/12 bg-black/20 p-5 backdrop-blur">
            <p className="text-sm font-black text-trophy">데이터 원칙</p>
            <p className="mt-2 text-sm leading-6 text-white/72">
              출처 URL, 업데이트 날짜, 신뢰도 필드가 없는 팀 정보는 “확인 필요”로만 표시합니다.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {featureCards.map((card) => (
          <Link key={card.href} href={card.href} className="rounded border border-white/10 bg-white/[0.06] p-5 shadow-panel transition hover:border-trophy/40 hover:bg-white/[0.09]">
            <DataSourceBadge sourceType={card.sourceType} />
            <h2 className="mt-4 text-lg font-black text-white">{card.title}</h2>
            <p className="mt-2 text-sm leading-6 text-white/62">{card.body}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

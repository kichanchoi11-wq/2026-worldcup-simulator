import Link from "next/link";

const navItems = [
  { href: "/", label: "홈" },
  { href: "/groups", label: "조별리그" },
  { href: "/tournament", label: "토너먼트" },
  { href: "/scenario", label: "경우의 수 계산기" },
  { href: "/teams", label: "팀 정보" },
  { href: "/predictions", label: "AI 예측" },
  { href: "/live", label: "실시간 결과" },
  { href: "/admin", label: "관리자 검토 모드" }
];

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-pitch-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded border border-trophy/60 bg-trophy/20 text-lg font-black text-trophy">
              26
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-black text-white">2026 FIFA 월드컵 시뮬레이터</p>
              <p className="truncate text-xs text-white/60">공식 데이터와 예측 데이터를 분리하는 한국어 플랫폼</p>
            </div>
          </Link>
          <div className="hidden rounded border border-white/10 px-3 py-2 text-xs text-white/70 md:block">
            API 키는 서버 Route에서만 사용
          </div>
        </div>
        <nav className="flex flex-wrap gap-2 pb-1" aria-label="주 메뉴">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/82 transition hover:border-trophy/50 hover:bg-trophy/15 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

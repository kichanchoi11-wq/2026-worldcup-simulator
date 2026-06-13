import type { DisplayBadge } from "@/types/football";

type BadgeProps = {
  children: React.ReactNode;
  tone?: DisplayBadge | "neutral" | "success" | "warning" | "danger" | "gold";
};

const toneClass: Record<string, string> = {
  공식: "border-emerald-300/50 bg-emerald-400/15 text-emerald-50",
  "공식 확인": "border-emerald-300/50 bg-emerald-400/15 text-emerald-50",
  "API 확인": "border-sky-300/50 bg-sky-400/15 text-sky-50",
  "수동 확인": "border-teal-300/50 bg-teal-400/15 text-teal-50",
  "API 실제 데이터": "border-sky-300/50 bg-sky-400/15 text-sky-50",
  "AI 예측": "border-violet-300/50 bg-violet-400/15 text-violet-50",
  "사용자 입력": "border-amber-300/50 bg-amber-400/15 text-amber-50",
  "경우의 수": "border-fuchsia-300/50 bg-fuchsia-400/15 text-fuchsia-50",
  "확인 필요": "border-zinc-300/40 bg-zinc-400/15 text-zinc-100",
  "분석 참고": "border-cyan-300/50 bg-cyan-400/15 text-cyan-50",
  "재검증 필요": "border-orange-300/50 bg-orange-400/15 text-orange-50",
  "표시 불가": "border-red-300/50 bg-red-400/15 text-red-50",
  "표시 금지": "border-red-300/50 bg-red-400/15 text-red-50",
  "오래된 정보": "border-stone-300/50 bg-stone-400/15 text-stone-50",
  "출전 가능": "border-emerald-300/50 bg-emerald-400/15 text-emerald-50",
  "출전 불투명": "border-amber-300/50 bg-amber-400/15 text-amber-50",
  "출전 금지": "border-red-300/50 bg-red-400/15 text-red-50",
  결장: "border-red-300/50 bg-red-400/15 text-red-50",
  "징계 결장": "border-rose-300/50 bg-rose-400/15 text-rose-50",
  부상: "border-red-300/50 bg-red-400/15 text-red-50",
  징계: "border-rose-300/50 bg-rose-400/15 text-rose-50",
  "경고 누적 위험": "border-yellow-300/50 bg-yellow-400/15 text-yellow-50",
  "체력 저하": "border-lime-300/50 bg-lime-400/15 text-lime-50",
  neutral: "border-white/15 bg-white/10 text-white",
  success: "border-emerald-300/50 bg-emerald-400/15 text-emerald-50",
  warning: "border-amber-300/50 bg-amber-400/15 text-amber-50",
  danger: "border-red-300/50 bg-red-400/15 text-red-50",
  gold: "border-trophy/70 bg-trophy/20 text-amber-50"
};

export default function Badge({ children, tone = "neutral" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded border px-2 py-1 text-xs font-semibold ${toneClass[tone]}`}>
      {children}
    </span>
  );
}

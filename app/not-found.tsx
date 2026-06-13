import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded border border-white/10 bg-white/[0.06] p-8 text-center">
      <h1 className="text-2xl font-black text-white">페이지를 찾을 수 없습니다</h1>
      <p className="mt-2 text-white/60">요청한 경로를 확인해 주세요.</p>
      <Link href="/" className="mt-5 inline-flex rounded border border-trophy/60 bg-trophy/20 px-4 py-2 text-sm font-black text-white">
        홈으로 이동
      </Link>
    </div>
  );
}

import AdminAuthGate from "@/components/AdminAuthGate";
import AdminReviewPanel from "@/components/AdminReviewPanel";

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-black text-trophy">관리자 검토 모드</p>
        <h1 className="mt-2 text-3xl font-black text-white">출처 없는 데이터 삭제와 재검증</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">
          관리자 인증 후 목적별 데이터 정리, API 데이터 새로고침, 수동 검토 도구를 사용할 수 있습니다.
        </p>
      </section>
      <AdminAuthGate>
        <AdminReviewPanel />
      </AdminAuthGate>
    </div>
  );
}

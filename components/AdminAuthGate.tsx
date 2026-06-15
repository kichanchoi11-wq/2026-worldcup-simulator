"use client";

import { FormEvent, ReactNode, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function AdminAuthGate({ children }: { children: ReactNode }) {
  const { isAdminAuthenticated, isChecking, login, logout } = useAdminAuth();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await login(password);
    setMessage(result.message);

    if (result.ok) {
      setPassword("");
    }

    setLoading(false);
  }

  if (isChecking) {
    return (
      <section className="rounded border border-white/10 bg-white/[0.06] p-6 shadow-panel">
        <p className="text-sm font-black text-trophy">관리자 인증</p>
        <h2 className="mt-2 text-2xl font-black text-white">인증 상태를 확인하는 중입니다.</h2>
      </section>
    );
  }

  if (!isAdminAuthenticated) {
    return (
      <section className="mx-auto max-w-xl rounded border border-trophy/30 bg-trophy/10 p-6 shadow-panel">
        <p className="text-sm font-black text-trophy">관리자 인증</p>
        <h2 className="mt-2 text-2xl font-black text-white">관리자 기능을 사용하려면 비밀번호를 입력해 주세요.</h2>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-white/70">비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="w-full rounded border border-white/15 bg-pitch-900 px-4 py-3 text-white outline-none transition focus:border-trophy/70"
              placeholder="관리자 비밀번호"
            />
          </label>
          <button
            type="submit"
            disabled={loading || password.trim().length === 0}
            className="w-full rounded border border-trophy/60 bg-trophy/20 px-4 py-3 text-sm font-black text-white transition hover:bg-trophy/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "확인 중" : "로그인"}
          </button>
        </form>
        {message ? (
          <p className="mt-4 rounded border border-white/10 bg-white/8 p-3 text-sm font-semibold text-white/80">{message}</p>
        ) : (
          <p className="mt-4 rounded border border-white/10 bg-white/5 p-3 text-sm text-white/62">
            관리자 인증 전에는 관리자 검토 모드와 새로고침 기능을 사용할 수 없습니다.
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-emerald-300/25 bg-emerald-400/10 p-4">
        <div>
          <p className="text-sm font-black text-emerald-100">관리자 인증이 완료되었습니다.</p>
          <p className="mt-1 text-xs text-emerald-50/70">현재 브라우저 탭에서만 관리자 상태가 유지됩니다.</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded border border-white/15 bg-white/8 px-4 py-2 text-sm font-black text-white transition hover:bg-white/12"
        >
          관리자 로그아웃
        </button>
      </div>
      {children}
    </section>
  );
}

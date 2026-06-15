"use client";

import { useCallback, useEffect, useState } from "react";
import { adminSessionStorageKey } from "@/lib/adminConstants";

type AdminAuthStatus = "checking" | "authenticated" | "anonymous";

type AdminAuthResult = {
  ok: boolean;
  message: string;
};

function readSessionFlag() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.sessionStorage.getItem(adminSessionStorageKey) === "true";
}

function setSessionFlag(value: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  if (value) {
    window.sessionStorage.setItem(adminSessionStorageKey, "true");
    return;
  }

  window.sessionStorage.removeItem(adminSessionStorageKey);
}

export function useAdminAuth() {
  const [status, setStatus] = useState<AdminAuthStatus>("checking");

  const verify = useCallback(async () => {
    if (!readSessionFlag()) {
      setStatus("anonymous");
      return false;
    }

    try {
      const response = await fetch("/api/admin/status", { credentials: "same-origin" });
      const data = (await response.json()) as { authenticated?: boolean };

      if (response.ok && data.authenticated) {
        setStatus("authenticated");
        return true;
      }
    } catch {
      // Fall through and clear the tab-only flag.
    }

    setSessionFlag(false);
    setStatus("anonymous");
    return false;
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void verify();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [verify]);

  const login = useCallback(async (password: string): Promise<AdminAuthResult> => {
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "same-origin"
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setSessionFlag(false);
        setStatus("anonymous");
        return { ok: false, message: data.message ?? "비밀번호가 올바르지 않습니다." };
      }

      setSessionFlag(true);
      setStatus("authenticated");
      return { ok: true, message: data.message ?? "관리자 인증이 완료되었습니다." };
    } catch {
      setSessionFlag(false);
      setStatus("anonymous");
      return { ok: false, message: "관리자 인증 요청에 실패했습니다." };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
    } finally {
      setSessionFlag(false);
      setStatus("anonymous");
    }
  }, []);

  return {
    status,
    isChecking: status === "checking",
    isAdminAuthenticated: status === "authenticated",
    login,
    logout,
    verify
  };
}

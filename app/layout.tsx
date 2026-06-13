import type { Metadata } from "next";
import Header from "@/components/Header";
import LocalStorageMigration from "@/components/LocalStorageMigration";
import "./globals.css";

export const metadata: Metadata = {
  title: "2026 FIFA 월드컵 시뮬레이터",
  description: "API 실제 데이터, AI 예측, 사용자 입력을 분리하는 한국어 월드컵 시뮬레이션 플랫폼"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <LocalStorageMigration />
        <Header />
        <main className="page-shell">{children}</main>
      </body>
    </html>
  );
}

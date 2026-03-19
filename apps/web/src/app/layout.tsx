import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: "Bookfolio",
  description: "나만의 책 컬렉션을 기록하고 관리하는 개인 서재 서비스"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <div className="shell">
          <header className="topbar">
            <Link href="/" className="wordmark">
              Bookfolio
            </Link>
            <nav className="inlineActions">
              <Link href="/login" className="buttonGhost">
                로그인
              </Link>
              <Link href="/dashboard" className="button">
                내 서재
              </Link>
            </nav>
          </header>
        </div>
        {children}
      </body>
    </html>
  );
}


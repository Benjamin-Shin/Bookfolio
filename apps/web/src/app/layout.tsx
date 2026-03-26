import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Providers } from "@/components/providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "Bookfolio",
  description: "소장 도서를 관리하고 ISBN·바코드로 빠르게 검색하는 개인 서재"
};

/**
 * @history
 * - 2026-03-26: `SiteFooter` — `Providers` 안 세로 flex로 본문·푸터 배치
 */
export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}

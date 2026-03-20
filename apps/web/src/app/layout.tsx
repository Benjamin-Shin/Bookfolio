import type { Metadata } from "next";

import { SiteHeader } from "@/components/layout/site-header";
import { Providers } from "@/components/providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "Bookfolio",
  description: "소장 도서를 관리하고 ISBN·바코드로 빠르게 검색하는 개인 서재"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          <SiteHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}

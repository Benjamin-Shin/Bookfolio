import type { Metadata } from "next";
import { Manrope, Newsreader } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: "서가담",
  description:
    "소장 도서를 정리하고 ISBN·바코드로 빠르게 찾는 개인 서가 — 서가담",
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
    apple: [
      {
        url: "/assets/seogadam_favicon.png",
        sizes: "256x256",
        type: "image/png",
      },
    ],
  },
};

/**
 * @history
 * - 2026-03-26: `SiteFooter` — `Providers` 안 세로 flex로 본문·푸터 배치
 * - 2026-04-05: Manrope·Newsreader CSS 변수(`next/font`)·메타데이터 서가담화
 * - 2026-04-07: 파비콘·애플 터치 아이콘을 `#Resources` Seogadam 에셋으로 연결
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={cn(manrope.variable, newsreader.variable)}>
      <body className={cn(manrope.className, "antialiased")}>
        <Providers>
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}

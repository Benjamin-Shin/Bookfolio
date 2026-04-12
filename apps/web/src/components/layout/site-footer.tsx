import type { Route } from "next";
import Link from "next/link";

const sep = <span className="text-muted-foreground/70" aria-hidden>|</span>;

/**
 * 전역 하단 푸터 — 저작권(중앙)·정책 링크(우측, 큰 화면 기준).
 *
 * @history
 * - 2026-04-13: 계정·데이터 삭제 → 이용약관 제20조 앵커 링크
 * - 2026-03-26: 신규
 * - 2026-04-05: 서가담 표기·구역은 배경 톤만(솔리드 상단 보더 제거)
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-muted/60">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-4 px-4 py-8 sm:grid-cols-[1fr_auto_1fr] sm:gap-6">
        <div className="hidden sm:block" aria-hidden />
        <p className="text-center text-sm text-muted-foreground">
          © {year} 서가담. All rights reserved.
        </p>
        <nav
          className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm sm:justify-end"
          aria-label="법적 고지"
        >
          <Link href="/privacy" className="text-foreground/90 underline-offset-4 hover:text-foreground hover:underline">
            개인정보처리방침
          </Link>
          {sep}
          <Link href="/terms" className="text-foreground/90 underline-offset-4 hover:text-foreground hover:underline">
            서비스 약관
          </Link>
          {sep}
          <Link href="/cookies" className="text-foreground/90 underline-offset-4 hover:text-foreground hover:underline">
            쿠키 정책
          </Link>
          {sep}
          <Link
            href={"/terms#article-20-withdrawal" as Route}
            className="text-foreground/90 underline-offset-4 hover:text-foreground hover:underline"
          >
            계정·데이터 삭제
          </Link>
        </nav>
      </div>
    </footer>
  );
}

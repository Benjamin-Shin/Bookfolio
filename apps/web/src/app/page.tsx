import Link from "next/link";
import { redirect } from "next/navigation";
import { BookMarkedIcon, ScanBarcodeIcon, SmartphoneIcon } from "lucide-react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";

const ghostBorder = "border border-[#c1c8c1]/15";

/**
 * 공개 랜딩(홈) — 비로그인 사용자만 표시; 로그인 시 `/dashboard`로 이동.
 *
 * @history
 * - 2026-04-12: 비회원 전용·세션 시 리다이렉트; 카피·섹션 축소한 미니멀 랜딩으로 정리.
 * - 2026-04-07: 히어로·소개 카피와 마크를 서가담 브랜드 PNG(`seogadam_logo.png`)로 정렬.
 * - 2026-04-05: 서가담 브랜딩·에디토리얼 히어로·구역 분리(솔리드 Divider 제거), 카피·집계 명칭 정리
 * - 2026-03-29: 모바일 웹 미리보기(`/mobile-preview`) CTA 추가.
 * - 2026-03-29: 랜딩에서 모바일 웹 미리보기 CTA 제거(URL 직접 접근만 유지).
 * - 2026-03-29: 이미 로그인된 경우 메인 CTA에서 「로그인 · 가입」 버튼 숨김.
 * - 2026-03-29: 상단 서비스 소개 패널 추가(Book+Portfolio); 미니 3카드 제거; 상표는 영문 Bookfolio만 사용.
 * - 2026-03-28: 포인트·혜택 정책 요약 패널 추가(비회원·회원 안내, 이용약관 링크).
 * - 2026-03-28: 「왜 Bookfolio인가」 이후 최근 기능(모바일·웹) 소개 패널 추가.
 * - 2026-03-28: iOS 앱 순서 안내 패널 추가; 랜딩문구에서 스택·개발자용 표현 제거.
 * - 2026-03-28: 구현 기능·계획 기능 섹션 분리; 「왜 Bookfolio인가」에 구현 목록만 통합.
 * - 2026-03-28: 계획 카드에서 Google Books 조회 언급 제거(미도입).
 */
export default async function HomePage() {
  const session = await auth();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main>
      <section
        className="mx-auto flex min-h-[calc(100vh-3.5rem-8rem)] max-w-6xl flex-col justify-center px-4 py-16 md:min-h-[calc(100vh-3.5rem-10rem)] md:py-20"
        aria-labelledby="seogadam-hero-heading"
      >
        <div
          className={`mx-auto w-full max-w-2xl overflow-hidden rounded-sm bg-muted/80 px-8 py-14 text-center md:px-12 md:py-16 ${ghostBorder}`}
        >
          <div className="mb-8 flex justify-center">
            <img
              src="/assets/seogadam_logo.png"
              alt="서가담"
              width={200}
              height={80}
              className="h-14 w-auto object-contain md:h-16"
            />
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            서가담
          </p>
          <h1
            id="seogadam-hero-heading"
            className="mt-4 font-serif text-3xl font-medium leading-tight tracking-tight text-primary md:text-4xl"
          >
            소장한 책을,
            <span className="mt-1 block text-foreground">서가에 담습니다.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
            ISBN·바코드로 빠르게 찾고, 읽기 상태와 메모를 남기세요. 웹과 앱에서
            같은 서가를 이어갑니다.
          </p>
          <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" className="rounded-sm shadow-none" asChild>
              <Link href="/login">시작하기</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className={`rounded-sm bg-background/60 shadow-none ${ghostBorder}`}
              asChild
            >
              <Link href="/dashboard">둘러보기</Link>
            </Button>
          </div>
          <p className="mt-8 text-xs text-muted-foreground">
            계속 이용 시{" "}
            <Link
              href="/terms"
              className="text-foreground/80 underline-offset-4 hover:underline"
            >
              서비스 약관
            </Link>
            에 동의하는 것으로 간주됩니다.
          </p>
        </div>

        <ul className="mx-auto mt-14 grid max-w-xl gap-6 text-left sm:grid-cols-3 sm:gap-4">
          <li className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
            <span className="flex size-10 items-center justify-center rounded-sm bg-muted text-primary">
              <BookMarkedIcon className="size-5" aria-hidden />
            </span>
            <span className="text-sm font-medium text-foreground">
              소장 정리
            </span>
            <span className="text-xs text-muted-foreground">
              상태·평점·메모
            </span>
          </li>
          <li className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
            <span className="flex size-10 items-center justify-center rounded-sm bg-muted text-primary">
              <ScanBarcodeIcon className="size-5" aria-hidden />
            </span>
            <span className="text-sm font-medium text-foreground">
              ISBN·바코드
            </span>
            <span className="text-xs text-muted-foreground">빠른 조회</span>
          </li>
          <li className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
            <span className="flex size-10 items-center justify-center rounded-sm bg-muted text-primary">
              <SmartphoneIcon className="size-5" aria-hidden />
            </span>
            <span className="text-sm font-medium text-foreground">웹·앱</span>
            <span className="text-xs text-muted-foreground">동일 계정</span>
          </li>
        </ul>
      </section>
    </main>
  );
}

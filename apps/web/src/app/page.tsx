import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookMarked, Bookmark, FilePenLine, Users } from "lucide-react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Stitch 시안과 동일 원본을 `public/assets`에 저장한 파일 */
const HERO_IMAGE = "/assets/landing-hero-bg.png" as const;
const BENTO_IMAGE = "/assets/landing-bento-panel.png" as const;

/**
 * 공개 랜딩(홈) — 비로그인 사용자만 표시; 로그인 시 `/dashboard`로 이동.
 *
 * @history
 * - 2026-05-03: 히어로·벤토 배경을 `lh3` URL 대신 `public/assets` PNG(`landing-hero-bg`·`landing-bento-panel`)로 자체 호스팅
 * - 2026-05-02: 에디토리얼 시안(히어로·3공간·벤토)으로 본문 재구성; 외부 히어로·벤토 이미지·Lucide 아이콘 사용.
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

  const cardBase =
    "rounded-lg border border-[#e4e2de]/50 bg-white p-8 shadow-[0_4px_24px_rgba(27,67,50,0.04)] transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(27,67,50,0.08)]";

  return (
    <main className="bg-[#fbf9f5] text-[#1b1c1a]">
      {/* Hero — 시안: 배경 이미지 + 서피스 그라데이션 */}
      <section
        className="relative flex min-h-[min(100svh,52rem)] items-center justify-center py-16 md:py-24"
        aria-labelledby="seogadam-hero-heading"
      >
        <div className="absolute inset-0 z-0">
          <div className="relative size-full">
            <Image
              src={HERO_IMAGE}
              alt="따뜻한 조명 아래 나무 서가와 독서 의자가 있는 서재"
              fill
              className="object-cover object-center opacity-20"
              sizes="100vw"
              priority
            />
          </div>
          <div
            className="absolute inset-0 bg-gradient-to-b from-[#fbf9f5]/80 via-[#fbf9f5]/90 to-[#fbf9f5]"
            aria-hidden
          />
        </div>

        <div className="relative z-10 mx-auto max-w-[1200px] px-8 text-center">
          <h1
            id="seogadam-hero-heading"
            className="mx-auto mb-8 max-w-3xl font-serif text-[2.5rem] font-semibold leading-[1.2] tracking-tight text-[#1b4332] md:text-[3rem]"
          >
            읽고, 담고, 이어가는
            <br />
            <span className="font-normal italic">서가담</span>
          </h1>
          <p className="mx-auto mb-16 max-w-2xl font-sans text-lg leading-[1.6] text-[#414844]">
            책을 읽는 순간을 기록하고, 당신만의 서가로 차곡차곡 쌓아보세요.
            <br />
            작은 기록이 모여 하나의 이야기로 이어집니다.
          </p>
          <Button
            size="lg"
            className="rounded bg-[#1b4332] px-8 py-6 font-sans text-[13px] font-semibold tracking-[0.05em] text-white shadow-sm transition-transform duration-200 hover:bg-[#1b4332]/90 hover:-translate-y-0.5"
            asChild
          >
            <Link href="/login">당신의 첫 번째 서가를 시작해보세요</Link>
          </Button>
          <p className="mt-10 font-sans text-xs text-[#414844]/90">
            계속 이용 시{" "}
            <Link
              href="/terms"
              className="text-[#1b1c1a]/80 underline-offset-4 hover:underline"
            >
              서비스 약관
            </Link>
            에 동의하는 것으로 간주됩니다.
          </p>
        </div>
      </section>

      {/* Service Intro — 사유가 머무는 세 가지 공간 */}
      <section
        className="bg-[#f5f3ef] py-16 md:py-24"
        aria-labelledby="spaces-heading"
      >
        <div className="mx-auto max-w-[1200px] px-8">
          <div className="mb-16 text-center">
            <h2
              id="spaces-heading"
              className="mb-4 font-serif text-[2rem] font-medium leading-[1.3] text-[#1b4332]"
            >
              사유가 머무는 세 가지 공간
            </h2>
            <div className="mx-auto h-px w-16 bg-[#c1c8c2]" aria-hidden />
          </div>

          <ul className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-6">
            <li className={cn(cardBase, "flex h-full flex-col")}>
              <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-[#f0eeea] text-[#1b4332]">
                <BookMarked className="size-6" strokeWidth={1.5} aria-hidden />
              </span>
              <h3 className="mb-2 font-serif text-2xl font-medium leading-[1.4] text-[#1b1c1a]">
                나만의 서가
              </h3>
              <p className="grow font-sans text-base leading-[1.6] text-[#414844]">
                소장한 책을 체계적으로 관리하고, 나만의 분류법으로 아름답게
                시각화합니다. 디지털 공간에 구현된 완벽한 나만의 도서관.
              </p>
            </li>
            <li className={cn(cardBase, "flex h-full flex-col")}>
              <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-[#f0eeea] text-[#1b4332]">
                <FilePenLine className="size-6" strokeWidth={1.5} aria-hidden />
              </span>
              <h3 className="mb-2 font-serif text-2xl font-medium leading-[1.4] text-[#1b1c1a]">
                독서의 기록
              </h3>
              <p className="grow font-sans text-base leading-[1.6] text-[#414844]">
                단순한 완독 리스트가 아닌, 삶의 흔적을 남깁니다. 깊이 있는 문장
                수집과 감상평으로 책과 나의 대화를 기록하세요.
              </p>
            </li>
            <li className={cn(cardBase, "flex h-full flex-col")}>
              <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-[#f0eeea] text-[#1b4332]">
                <Users className="size-6" strokeWidth={1.5} aria-hidden />
              </span>
              <h3 className="mb-2 font-serif text-2xl font-medium leading-[1.4] text-[#1b1c1a]">
                모임서가
              </h3>
              <p className="grow font-sans text-base leading-[1.6] text-[#414844]">
                취향이 닿아있는 사람들과 서가를 공유합니다. 서로의 밑줄을
                훔쳐보며, 함께 읽고 깊어지는 지적인 즐거움을 경험하세요.
              </p>
            </li>
          </ul>
        </div>
      </section>

      {/* Branding — 벤토 그리드 */}
      <section
        className="bg-[#fbf9f5] py-16 md:py-24"
        aria-labelledby="philosophy-heading"
      >
        <div className="mx-auto max-w-[1200px] px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-6">
            <div className="group relative min-h-[400px] overflow-hidden rounded-xl border border-[#e4e2de]/50 shadow-[0_4px_24px_rgba(27,67,50,0.04)] md:col-span-8">
              <Image
                src={BENTO_IMAGE}
                alt="책과 커피가 놓인 독서 테이블"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(min-width: 768px) 66vw, 100vw"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-[#1b4332]/90 via-[#1b4332]/40 to-transparent"
                aria-hidden
              />
              <div className="absolute bottom-0 left-0 z-10 p-8 text-white">
                <span className="mb-4 inline-block rounded-full border border-white/20 bg-[#c4c9b1]/20 px-3 py-1 font-sans text-[13px] font-semibold tracking-[0.05em] backdrop-blur-sm">
                  The Philosophy
                </span>
                <h3
                  id="philosophy-heading"
                  className="mb-2 font-serif text-[2rem] font-medium leading-[1.3]"
                >
                  비우고, 채우는 감각
                </h3>
                <p className="max-w-md font-sans text-base leading-[1.6] opacity-90">
                  종이의 질감과 나무의 향기가 느껴지는 듯한 고요한 화면 속에서,
                  당신의 독서는 오롯이 당신만의 시간이 됩니다.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-6 md:col-span-4">
              <div
                className={cn(
                  "flex flex-1 flex-col justify-center rounded-xl border border-[#e4e2de]/50 bg-white p-8 shadow-[0_4px_24px_rgba(27,67,50,0.04)]",
                )}
              >
                <Bookmark
                  className="mb-4 size-10 text-[#7d562d]"
                  strokeWidth={1.25}
                  aria-hidden
                />
                <h4 className="mb-2 font-serif text-2xl font-medium leading-[1.4] text-[#1b4332]">
                  지적 안식처
                </h4>
                <p className="font-sans text-base leading-[1.6] text-[#414844]">
                  번잡한 일상을 벗어나 사색에 잠길 수 있는 디지털 프라이빗 서재.
                </p>
              </div>
              <div className="relative flex flex-1 flex-col justify-center overflow-hidden rounded-xl border border-[#f0bd8b]/50 bg-[#ffdcbd]/30 p-8">
                <div
                  className="absolute top-0 right-0 size-24 rounded-bl-full bg-[#f0bd8b] opacity-20"
                  aria-hidden
                />
                <h4 className="relative mb-2 font-serif text-2xl font-medium leading-[1.4] text-[#7a532a]">
                  프리미엄 큐레이션
                </h4>
                <p className="relative font-sans text-base leading-[1.6] text-[#414844]">
                  당신의 취향을 정교하게 다듬어주는 서가담만의 특별한 분류 체계.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

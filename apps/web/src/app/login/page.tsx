import { Suspense } from "react";

import { LoginFormDynamic } from "@/components/auth/login-form-dynamic";

/**
 * 로그인 라우트 — 스플릿 레이아웃이 뷰포트(헤더·푸터 제외)를 채우도록 래퍼만 둔다.
 *
 * @history
 * - 2026-05-02: 전역 고정 헤더·푸터에 맞춰 `min-h-full`·`flex-1`로 본문 영역만 채움, 패딩은 폼 내부로 이관
 */
export default function LoginPage() {
  const googleEnabled =
    Boolean(process.env.AUTH_GOOGLE_ID?.trim()) && Boolean(process.env.AUTH_GOOGLE_SECRET?.trim());
  const kakaoEnabled =
    Boolean(process.env.AUTH_KAKAO_ID?.trim()) && Boolean(process.env.AUTH_KAKAO_SECRET?.trim());

  return (
    <main className="flex min-h-full flex-1 flex-col bg-[#f5f3ef] text-[#333333]">
      <Suspense
        fallback={
          <p className="p-6 text-sm text-muted-foreground">로그인 화면을 불러오는 중…</p>
        }
      >
        <LoginFormDynamic googleEnabled={googleEnabled} kakaoEnabled={kakaoEnabled} />
      </Suspense>
    </main>
  );
}

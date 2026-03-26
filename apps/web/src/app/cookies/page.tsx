import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "쿠키 정책 — Bookfolio",
  description: "Bookfolio 쿠키 및 유사 기술 안내(초안)"
};

/**
 * @history
 * - 2026-03-26: 안내용 더미 본문
 */
export default function CookiePolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <h1 className="text-2xl font-bold tracking-tight">쿠키 정책</h1>
      <p className="mt-2 text-sm text-muted-foreground">최종 수정: 2026년 3월 26일 (예시)</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
        <p>
          Bookfolio는 웹·앱 서비스 운영과 보안, 로그인 세션 유지, 이용 통계(선택) 등의 목적으로 브라우저
          쿠키 또는 이와 유사한 저장 기술을 사용할 수 있습니다. 본 문서는 그와 관련된 <strong>일반적인 안내</strong>
          입니다.
        </p>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">1. 쿠키란</h2>
          <p>
            쿠키는 웹사이트 방문 시 브라우저에 저장되는 작은 텍스트 파일로, 로그인 유지, 언어 설정, 트래픽 분석 등에
            활용됩니다.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">2. 사용 목적(예시)</h2>
          <ul className="list-inside list-disc space-y-1">
            <li>
              <strong>필수</strong>: 인증 세션(로그인 상태), 보안(CSRF·악용 방지), 부하 분산 등 서비스 제공에 필요한
              기능
            </li>
            <li>
              <strong>기능</strong>: UI 선호(다크 모드 등), 언어 선택 등 이용 편의
            </li>
            <li>
              <strong>분석(선택)</strong>: 방문·클릭 등 익명화된 통계 — 실제 사용 시 분석 도구명·옵트아웃을 구체적으로
              밝혀 주세요.
            </li>
          </ul>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">3. 설정 거부</h2>
          <p>
            브라우저 설정에서 쿠키 저장을 거부할 수 있습니다. 다만 로그인·일부 기능이 정상 동작하지 않을 수
            있습니다.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">4. 변경</h2>
          <p>쿠키 정책은 서비스 또는 법령 변경에 따라 수정될 수 있으며, 중요한 변경 시 공지할 수 있습니다.</p>
        </section>
      </div>
    </div>
  );
}

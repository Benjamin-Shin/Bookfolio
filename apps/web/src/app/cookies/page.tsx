import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "쿠키 정책 — Bookfolio",
  description:
    "Bookfolio 웹 서비스에서 사용하는 쿠키·유사 기술, 목적 및 관리 방법을 안내합니다."
};

/**
 * @history
 * - 2026-03-28: NextAuth(Auth.js) v5·JWT 세션 기준으로 사용 목적·제3자 분석 미도입 등 현재 코드베이스에 맞게 본문 정리; 모바일 앱 저장소 구분
 * - 2026-03-26: 안내용 더미 본문
 */
export default function CookiePolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <h1 className="text-2xl font-bold tracking-tight">쿠키 정책</h1>
      <p className="mt-2 text-sm text-muted-foreground">최종 수정: 2026년 3월 28일</p>
      <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
        본 문서는 Bookfolio <strong>웹 애플리케이션</strong>(Next.js) 기준으로, 브라우저에 저장되는 쿠키 및 이에 준하는
        기술의 사용 현황을 설명합니다.{" "}
        <a className="underline underline-offset-2 hover:text-foreground" href="/privacy">
          개인정보처리방침
        </a>
        에서 개인정보 처리 전반을 함께 확인할 수 있습니다. 실제 쿠키 이름·유지 기간·제3자 도구는 배포 설정 변경 시
        달라질 수 있으므로, 도입·변경 시 본 문서를 갱신하는 것이 좋습니다.
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/90">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">1. 쿠키·유사 기술이란</h2>
          <p>
            <strong>쿠키</strong>는 웹사이트 방문 시 브라우저에 저장되는 작은 텍스트 파일입니다. 로그인 유지, 보안, 요청
            간 상태 전달 등에 쓰입니다. <strong>로컬 저장소·세션 저장소</strong>는 브라우저의 다른 저장 공간으로, 본
            서비스 웹 클라이언트 코드 기준으로는 별도로 사용하지 않습니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">2. 현재 웹 서비스에서의 사용</h2>
          <p>
            저장소 조사 결과(프런트엔드 소스), 웹에서는 주로 <strong>NextAuth.js(Auth.js) v5</strong>가 발급·갱신하는
            쿠키를 통해 <strong>JWT 기반 로그인 세션</strong>과 <strong>CSRF 방지·OAuth(예: Google) 로그인 절차</strong>
            (상태·콜백 URL 등)를 처리합니다. HTTPS 배포 시 쿠키 이름 앞에 <code className="rounded bg-muted px-1 py-0.5 text-xs">
              __Secure-
            </code>{" "}
            등이 붙는 등, 브라우저·환경에 따라 표시되는 이름이 달라질 수 있습니다.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>필수(인증·보안)</strong>: 로그인 상태 확인, 세션 토큰, CSRF 토큰, 소셜 로그인 리다이렉트 과정에
              필요한 일시적 쿠키
            </li>
          </ul>
          <p className="text-muted-foreground">
            코드베이스에는 <strong>Google Analytics, Meta Pixel, 기타 행동 분석·광고 네트워크용 제3자 쿠키</strong>를
            삽입하는 설정이 <strong>현재 포함되어 있지 않습니다.</strong> 향후 도입 시 본 정책에 도구명·목적·거부 방법을
            구체적으로 추가하고, 필요한 경우 동의 UI를 마련해야 합니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">3. Supabase·기타 서버 연동</h2>
          <p>
            서버 측에는 Supabase 서비스 롤 클라이언트 등으로 데이터에 접근하며, 일반 사용자 브라우저에 Supabase 세션
            쿠키를 심는 <strong>브라우저용 SSR 클라이언트 유틸</strong>이 코드에 준비되어 있습니다. 다만 현재 웹 앱
            라우트에서는 해당 유틸이 <strong>호출되지 않으며</strong>, 회원 인증의 주 경로는 위 NextAuth 세션입니다.
            이후 기능에서 브라우저 Supabase 세션을 쓰게 되면, 그에 맞춰 저장되는 쿠키(예: 프로젝트별 인증 쿠키)를 본
            정책에 명시하는 것이 좋습니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">4. 모바일 앱(Flutter)</h2>
          <p>
            모바일 앱은 브라우저 쿠키와 별도로, 운영체제·플랫폼이 제공하는 보안 저장소 등에 인증 토큰을 보관할 수
            있습니다. 그 처리는 본 &quot;쿠키 정책&quot;의 브라우저 쿠키 항목과 구분되며, 자세한 내용은{" "}
            <a className="underline underline-offset-2 hover:text-foreground" href="/privacy">
              개인정보처리방침
            </a>
            을 참고하시기 바랍니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">5. 보유 기간</h2>
          <p>
            인증 관련 쿠키의 유효 기간은 Auth.js·브라우저 세션 설정 및 &quot;로그아웃&quot; 시 삭제 여부에 따릅니다.
            OAuth 절차용 일시 쿠키는 로그인 완료 후 곧 만료되거나 삭제되는 경우가 많습니다. 정확한 만료 값은 브라우저
            개발자 도구의 저장소(Application) 탭에서 확인할 수 있습니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">6. 쿠키 설정·거부</h2>
          <p>
            브라우저 설정에서 쿠키 저장을 거부하거나 삭제할 수 있습니다. 다만 <strong>필수 인증 쿠키</strong>까지 차단하면
            로그인·대시보드 등 회원 기능이 정상 동작하지 않을 수 있습니다. 브라우저별 &quot;쿠키 및 사이트 데이터&quot;
            메뉴에서 예외 사이트를 지정하는 방법도 있습니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">7. 정책 변경</h2>
          <p>
            새로운 분석 도구·광고 기능·인증 방식을 도입하거나 법령이 변경되는 경우, 본 쿠키 정책을 개정할 수 있습니다.
            중요한 변경은 서비스 내 공지 등 합리적인 방법으로 안내합니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">8. 문의</h2>
          <p className="text-muted-foreground">
            쿠키·개인정보 관련 문의는 개인정보처리방침에 기재된 연락처(운영 시 확정)로 접수할 수 있습니다.
          </p>
        </section>
      </div>
    </div>
  );
}

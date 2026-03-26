import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 — Bookfolio",
  description: "Bookfolio 개인정보 처리방침(안내용 초안)"
};

/**
 * @history
 * - 2026-03-26: 법률 검토 전 안내용 더미 본문
 */
export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <h1 className="text-2xl font-bold tracking-tight">개인정보처리방침</h1>
      <p className="mt-2 text-sm text-muted-foreground">시행일: 2026년 3월 26일 (예시)</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
        <p>
          Bookfolio(이하 &quot;서비스&quot;)는 이용자의 개인정보를 중요하게 생각합니다. 본 문서는 서비스 제공을 위해
          어떤 정보를 수집·이용하는지에 대한 <strong>일반적인 안내용 초안</strong>이며, 실제 법적 효력은 사업
          주체의 최종 정책 및 관련 법령에 따릅니다.
        </p>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">1. 수집하는 항목(예시)</h2>
          <p>
            계정 생성 시 이메일 주소, 표시 이름, 소셜 로그인을 이용하는 경우 해당 제공자가 전달하는 프로필
            식별자 등이 저장될 수 있습니다. 서재 이용 과정에서 입력하시는 도서 메모, 읽기 상태 등 콘텐츠 성격의
            데이터도 서비스 운영을 위해 저장될 수 있습니다.
        </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">2. 이용 목적(예시)</h2>
          <p>
            회원 식별, 서재·통계 기능 제공, 보안·부정 이용 방지, 고지·문의 대응, 서비스 개선 및 법적 의무
            이행에 필요한 범위 내에서 이용합니다.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">3. 보관 및 파기(예시)</h2>
          <p>
            관련 법령 또는 내부 정책에 따른 보관 기간이 지나면 지체 없이 파기합니다. 회원 탈퇴 시 서비스 정책에
            따라 계정 및 연관 데이터가 삭제될 수 있습니다.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">4. 문의(예시)</h2>
          <p>
            개인정보와 관련한 문의는 서비스 내 안내 또는 관리자 연락처를 통해 접수할 수 있습니다. (연락처는
            실제 운영 시 기재하세요.)
          </p>
        </section>
      </div>
    </div>
  );
}

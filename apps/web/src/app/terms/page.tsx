import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "서비스 약관 — Bookfolio",
  description: "Bookfolio 이용약관(안내용 초안)"
};

/**
 * @history
 * - 2026-03-26: 법률 검토 전 안내용 더미 본문
 */
export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <h1 className="text-2xl font-bold tracking-tight">서비스 약관</h1>
      <p className="mt-2 text-sm text-muted-foreground">시행일: 2026년 3월 26일 (예시)</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
        <p>
          본 약관은 Bookfolio 서비스의 이용과 관련하여 회사(또는 운영 주체)와 이용자 간의 권리·의무를 규정하는
          <strong> 일반적인 안내용 초안</strong>입니다. 실제 서비스 오픈 전에는 반드시 법무 검토를 거쳐
          확정하시기 바랍니다.
        </p>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">제1조 (목적)</h2>
          <p>본 약관은 서비스의 제공 조건 및 이용 절차, 이용자와 운영자 간의 책무를 정함을 목적으로 합니다.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">제2조 (서비스 내용)</h2>
          <p>
            서비스는 개인 서재 관리, 독서 기록, 통계, 공유 기능 등을 포함할 수 있으며, 세부 기능은 운영 정책에 따라
            변경·중단될 수 있습니다.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">제3조 (이용자 의무)</h2>
          <p>
            이용자는 타인의 권리를 침해하는 콘텐츠를 게시하지 않아야 하며, 계정 정보를 타인과 공유하지 않아야
            합니다. 서비스 악용이 확인될 경우 이용 제한 등 조치가 취해질 수 있습니다.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">제4조 (면책)</h2>
          <p>
            서비스는 &quot;있는 그대로&quot; 제공될 수 있으며, 외부 API·메타데이터 조회 결과의 정확성에 대해 보증하지
            않습니다. 불가항력, 제3자 서비스 장애 등으로 인한 손해에 대해 책임이 제한될 수 있습니다.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">제5조 (약관 변경)</h2>
          <p>
            운영자는 필요 시 약관을 변경할 수 있으며, 변경 시 서비스 내 공지 등 합리적인 방법을 통해 안내합니다.
          </p>
        </section>
      </div>
    </div>
  );
}

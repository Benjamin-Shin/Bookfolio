import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "서비스 약관 — Bookfolio",
  description:
    "Bookfolio 서비스 이용 조건, 회원 의무, 포인트·VIP·공동서재 등에 관한 약관입니다."
};

/**
 * @history
 * - 2026-03-28: 서지 조회 제공자 문구에서 Google Books 제거(미사용).
 * - 2026-03-28: 현재 구현·설계 문서 기준 본문 정리(인증, 서재, 공동서재, 포인트·출석, VIP·구독·한도, 캐논 편집·투표, ISBN 조회·관리자 운영 등 반영; 향후 PG·결제 연계는 별도 고지 예정으로 명시)
 * - 2026-03-26: 법률 검토 전 안내용 더미 본문
 */
export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <h1 className="text-2xl font-bold tracking-tight">서비스 이용약관</h1>
      <p className="mt-2 text-sm text-muted-foreground">시행일: 2026년 3월 28일</p>
      <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
        본 약관은 Bookfolio(이하 &quot;서비스&quot;)의 이용 조건과 운영자·이용자 간 권리·의무를 규정합니다. 문구는{" "}
        <strong>현재 제공 중이거나 설계·로드맵 상 구현 예정인 기능</strong>을 참고하여 작성되었으나, 실제 사업자 명칭·
        주소·분쟁 관할 등은 운영 주체 정보와 함께 확정하고,{" "}
        <strong>법무 검토 후 게시</strong>하시기 바랍니다.
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/90">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제1조 (목적)</h2>
          <p>
            본 약관은 서비스의 이용에 관하여 운영자와 회원 간의 권리·의무·책임사항, 기타 필요한 사항을 정함을 목적으로
            합니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제2조 (정의)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>&quot;서비스&quot;</strong>란 Bookfolio가 제공하는 웹·모바일 애플리케이션 및 관련 API·부가 기능을
              말합니다.
            </li>
            <li>
              <strong>&quot;회원&quot;</strong>이란 본 약관에 동의하고 운영자가 정한 절차에 따라 계정을 생성한 자를
              말합니다.
            </li>
            <li>
              <strong>&quot;콘텐츠&quot;</strong>란 회원이 서비스에 입력·업로드·공개하는 텍스트, 이미지, 서지 관련 정보,
              메모, 평가, 한줄평 등 모든 정보를 말합니다.
            </li>
            <li>
              <strong>&quot;포인트&quot;</strong>란 운영 정책에 따라 적립·차감되는 서비스 내부 수치로, 현금으로 교환되지
              않으며 법정 통화가 아닙니다.
            </li>
            <li>
              <strong>&quot;플랜·VIP(구독)&quot;</strong>이란 이용 한도·혜택을 구분하기 위한 등급·기간 기반의 이용 조건을
              말하며, <strong>결제 모듈(PG) 도입 이전</strong>에는 운영자 정책·관리자 조치에 따라 부여·조정될 수 있습니다.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제3조 (약관의 명시·효력·변경)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>운영자는 본 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기 화면 또는 연결 화면에 게시합니다.</li>
            <li>회원이 본 약관에 동의하고 서비스를 이용하는 때부터 약관의 효력이 발생합니다.</li>
            <li>
              운영자는 관련 법령을 위배하지 않는 범위에서 약관을 개정할 수 있으며, 개정 시 적용 일자 및 사유를 명시하여
              사전에 공지합니다. 회원에게 불리한 변경의 경우 법령이 정한 절차를 따릅니다.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제4조 (회원가입·계정)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              회원은 이메일·비밀번호 방식 또는 운영자가 제공하는 소셜 로그인(예: Google) 등의 방법으로 가입할 수
              있습니다.
            </li>
            <li>
              회원은 등록 정보의 진실성·정확성을 유지해야 하며, 타인의 정보를 도용하거나 허위 정보를 제공해서는 안
              됩니다.
            </li>
            <li>
              계정·비밀번호·토큰 등 인증 수단의 관리 책임은 회원에게 있으며, 제3자에게 양도·대여해서는 안 됩니다.
            </li>
            <li>
              운영자는 부정 가입·중복 계정·이전 이용 제한 이력 등이 있는 경우 가입·이용을 거절 또는 제한할 수 있습니다.
            </li>
            <li>
              <strong>관리자·운영 스태프</strong> 등 내부 역할은 운영 목적에 한하여 시스템상 부여될 수 있으며, 해당 권한
              사용은 내부 정책·감사에 따릅니다.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제5조 (서비스의 내용)</h2>
          <p>서비스는 다음 각 호의 기능을 포함할 수 있으며, 세부 명칭·화면·API는 업데이트에 따라 달라질 수 있습니다.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>개인 서재: 소장 도서 등록·편집·삭제, 읽기 상태·별점·메모·독서 이벤트(시작·진행·완독 등) 기록</li>
            <li>
              서지 조회: ISBN·검색어 등을 이용한 메타데이터 조회(국립중앙도서관·네이버 등 외부 제공자 순·설정에 따름)
            </li>
            <li>공동서재(모임·가족 등): 서재 생성·설명, 멤버 초대·역할, 일부 소장 정보의 공유 표시</li>
            <li>포인트: 규칙에 따른 적립·차감, 일·월 한도 등 운영 정책, 잔액 조회</li>
            <li>출석·활동: 일 단위 활동 기록(타임존·로컬 날짜 기준 등 서비스 정책에 따름)</li>
            <li>
              플랜·VIP: 공동서재 개수·멤버·초대 한도, 메타 조회·스캔 등 <strong>이용 한도(caps)</strong>와 연계된 혜택
              (구체 항목은 서비스 공지·정책에 따름)
            </li>
            <li>커뮤니티·서지 품질: 공개 한줄평, 공유 서지(캐논) 수정 제안·검토·사용자 투표 등</li>
            <li>표지 등 이미지 업로드·저장(예: 클라우드 이미지 호스트 연동)</li>
            <li>웹 대시보드·모바일 앱을 통한 동일 계정 연동 이용</li>
            <li>
              <strong>향후</strong> 유료 테마·다국어(i18n)·결제(PG) 연동·VIP 자동 갱신 등은 별도 공지·약관·개인정보 처리
              방침 보완과 함께 제공될 수 있습니다.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제6조 (서비스의 변경·중단)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>운영자는 운영·기술상 필요에 따라 서비스의 전부 또는 일부를 변경·중단할 수 있습니다.</li>
            <li>
              무료 제공 기능의 중단·변경에 대하여는 사전 또는 사후 공지로 갈음할 수 있으나, 법령상 의무가 있는 경우 그에
              따릅니다.
            </li>
            <li>
              천재지변, 정전, 외부 플랫폼·API 장애, 보안 사고 등 불가항력으로 서비스를 제공할 수 없는 경우 책임이 면제될
              수 있습니다.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제7조 (회원의 의무 및 금지 행위)</h2>
          <p>회원은 다음 각 호의 행위를 해서는 안 됩니다.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>타인의 저작권·상표·초상권 등 지식재산권을 침해하는 콘텐츠 게시</li>
            <li>음란·폭력·혐오·불법 행위를 조장하거나 범죄와 관련된 정보 유포</li>
            <li>운영자·다른 회원·제3자를 사칭하거나 허위 사실을 유포하는 행위</li>
            <li>
              자동화 수단(매크로, 크롤러 등)으로 과도한 요청을 보내 정상 운영을 방해하거나, 포인트·출석·한도 규칙을 악용하는
              행위
            </li>
            <li>시스템·보안 취약점을 악용하거나 허가 없이 침입·데이터 수집을 시도하는 행위</li>
            <li>공동서재·공개 기능을 이용한 스팸·광고·영리 목적의 무단 홍보(운영자 정책이 허용하는 경우 제외)</li>
          </ul>
          <p>
            운영자는 위 반칙이 확인되거나 합리적으로 의심되는 경우, 사전 통지 없이 콘텐츠 삭제, 포인트 회수, 이용
            제한·계정 정지 등 필요한 조치를 취할 수 있습니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제8조 (포인트·혜택)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>포인트의 적립·차감 조건, 이벤트 코드, 일·월 한도, 잔액 부족 시 처리는 운영자가 정하는 바에 따릅니다.</li>
            <li>포인트는 양도·현금 환불·상속의 대상이 되지 않으며, 서비스 종료·정책 변경 시 소멸될 수 있습니다.</li>
            <li>운영자·관리자는 오류 정정, 이벤트 조정, 부정 이용 방지 등을 위해 포인트를 조정할 수 있습니다.</li>
            <li>VIP 등 플랜 혜택이 있는 경우에도, 남용 방지를 위한 상한(caps)은 별도로 적용될 수 있습니다.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제9조 (구독·결제)</h2>
          <p>
            <strong>유료 구독·인앱 결제·자동 결제</strong> 기능이 도입되는 경우, 요금·청약철회·환불·해지 등에 관한 사항은
            별도 유료 이용약관·결제 페이지 고지 및 전자상거래 등 관련 법령에 따릅니다. <strong>본 약관 시점에는 PG
            연동에 따른 자동 결제가 필수는 아니며</strong>, VIP 기간 등은 운영 정책에 따라 수동 부여될 수 있습니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제10조 (공동서재·공개 콘텐츠)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              회원이 공동서재에 소장 정보를 연결하거나 공개 한줄평 등을 게시하는 경우, 초대된 멤버 또는 서비스 정책에 따라
              정해진 범위에서 열람될 수 있습니다.
            </li>
            <li>회원은 공개 범위·대상을 이해하고 콘텐츠를 게시해야 하며, 민감 정보 노출에 유의해야 합니다.</li>
            <li>공유 서지(캐논)는 여러 회원이 열람·기여할 수 있는 구조일 수 있으며, 운영자는 품질·분쟁 방지를 위해 수정·
            삭제·검토할 수 있습니다.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제11조 (저작권 및 라이선스)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>서비스 UI·로고·소스코드(공개되지 않은 부분) 등에 대한 권리는 운영자 또는 정당한 권리자에게 있습니다.</li>
            <li>
              회원이 작성한 콘텐츠의 저작권은 회원에게 귀속됩니다. 다만 회원은 서비스 운영·개선·표시·백업·통계·법적
              대응을 위해 필요한 범위에서 운영자에게 비독점적 이용을 허락합니다.
            </li>
            <li>
              외부 API·오픈 데이터에서 수신한 서지 메타데이터의 이용은 해당 제공자 정책 및 저작권법의 한도 내에서만
              이루어집니다.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제12조 (개인정보 보호)</h2>
          <p>
            개인정보의 수집·이용·제공 등에 관하여는 별도의{" "}
            <a className="underline underline-offset-2 hover:text-foreground" href="/privacy">
              개인정보처리방침
            </a>
            에 정한 바에 따릅니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제13조 (계약 해지·탈퇴)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>회원은 언제든지 서비스 내 탈퇴 절차에 따라 이용 계약을 해지할 수 있습니다.</li>
            <li>
              탈퇴 후 일부 데이터는 법령·분쟁 대응·백업 정책에 따라 일정 기간 보관되거나, 공동서재·캐논 등 타인 권익과
              얽힌 정보는 분리·비식별 처리 등의 형태로 처리될 수 있습니다.
            </li>
            <li>운영자는 본 약관 위반 등 중대한 사유가 있는 경우 계약을 해지하거나 이용을 제한할 수 있습니다.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제14조 (책임의 한계)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              서비스는 &quot;있는 그대로&quot; 제공됩니다. 외부 서지 API·맵·호스팅 등 제3자 서비스의 정확성·가용성을
              보증하지 않습니다.
            </li>
            <li>
              회원이 입력한 정보·콘텐츠의 정확성·적법성에 대한 책임은 회원에게 있으며, 운영자는 그로 인한 분쟁에서 원칙적
              책임을 지지 않습니다.
            </li>
            <li>
              운영자의 고의 또는 중대한 과실이 없는 한, 간접 손해·특별 손해·영업 손실 등에 대하여는 책임을 지지 않을 수
              있습니다. 다만 관련 법령에서 달리 정하는 경우에는 그에 따릅니다.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제15조 (준거법 및 관할)</h2>
          <p>
            본 약관은 대한민국 법령에 따라 해석되며, 소송이 제기되는 경우 운영자의 본점 소재지를 관할하는 법원을 전속
            관할로 합니다. 다만 소비자에게 유리한 관할 규정이 있는 경우 그에 따릅니다.{" "}
            <span className="text-muted-foreground">(본문의 관할 법원은 실제 사업자 소재에 맞게 수정하세요.)</span>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제16조 (문의)</h2>
          <p>
            본 약관에 관한 문의는 [고객센터 이메일·전화 등 실제 연락처]로 접수할 수 있습니다. 회사명·대표자·주소 등
            상법·전자상거래법상 사업자 정보는 서비스 초기면 또는 별도 페이지에 함께 게시하는 것이 좋습니다.
          </p>
        </section>
      </div>
    </div>
  );
}

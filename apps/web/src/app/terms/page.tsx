import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "서비스 약관 — 서가담",
  description:
    "서가담 서비스 이용 조건, 회원·이용자 권리와 의무, 약관 개정, 통지, 게시물·저작권, 포인트·VIP, 공동서재, 분쟁 해결 등에 관한 약관입니다.",
};

/**
 * @history
 * - 2026-04-13: 제20조에 회원 탈퇴 절차(웹·앱)·삭제 범위·공동서재 제한·문의처 상세 보강 및 앵커 `article-20-withdrawal`
 * - 2026-04-05: 메타·정의 조 문구의 서비스 명칭을 서가담으로 정렬
 * - 2026-03-29: 트레바리 등 유사 서비스 약관을 참고해 게시·개정(7일·30일), 개별약관 우선, 이용자·게시물 정의, 이용계약·회원정보 변경, 통지, 운영자 의무, 서비스 제공·변경·무료 서비스, 정보·광고, 게시물 관리·권리 귀속, 환불·이용제한, 강행법규·분쟁 조항을 보강하고 공고·시행일을 명시.
 * - 2026-03-28: 서지 조회 제공자 문구에서 Google Books 제거(미사용).
 * - 2026-03-28: 현재 구현·설계 문서 기준 본문 정리(인증, 서재, 공동서재, 포인트·출석, VIP·구독·한도, 캐논 편집·투표, ISBN 조회·관리자 운영 등 반영; 향후 PG·결제 연계는 별도 고지 예정으로 명시)
 * - 2026-03-26: 법률 검토 전 안내용 더미 본문
 */
export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <h1 className="text-2xl font-bold tracking-tight">
        서비스 이용약관<span className="sr-only"> (서비스 약관)</span>
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        서비스 약관과 동일한 의미로 사용합니다.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        공고일: 2026년 3월 29일 · 시행일: 2026년 3월 29일
      </p>
      <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
        본 약관은 서가담(이하 &quot;서비스&quot;)의 이용과 관련하여{" "}
        <strong>운영자</strong>(서비스를 운영하는 사업자 또는 그로부터 위탁받아
        운영하는 주체)와 <strong>이용자</strong> 간 권리·의무·책임사항을
        규정합니다. 본문은 현재 제공·로드맵상 예정 기능을 참고하였으나,{" "}
        <strong>실제 상호·대표자·주소·고객센터 연락처·관할 법원</strong> 등은
        운영 주체와 함께 확정하고, <strong>법무 검토 후 게시</strong>하시기
        바랍니다.
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/90">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제1조 (목적)</h2>
          <p>
            본 약관은 운영자가 제공하는 서비스의 이용에 관하여 운영자와 회원
            및 비회원 이용자 간의 권리·의무 및 책임사항, 기타 필요한 사항을
            규정함을 목적으로 합니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제2조 (용어의 정의)</h2>
          <p>
            본 약관에서 사용하는 용어의 정의는 다음과 같습니다. 본 약관에
            명시되지 않은 용어는 관계 법령이 정하는 바에 따르며, 그 외에는
            통상의 거래 관행에 따릅니다.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>&quot;운영자&quot;</strong>란 서비스를 기획·운영하는
              주체를 말합니다.
            </li>
            <li>
              <strong>&quot;사이트&quot;</strong>란 운영자가 운영하는 웹사이트 및
              모바일 애플리케이션 등 서비스가 구현되는 온라인 접속 경로를
              말합니다.
            </li>
            <li>
              <strong>&quot;서비스&quot;</strong>란 PC, 휴대형 단말기 등 각종
              유·무선 기기를 포함한 단말의 종류에 관계없이 이용자가 이용할 수
              있는 서가담 및 이에 부수하는 기능·API를 말합니다.
            </li>
            <li>
              <strong>&quot;이용자&quot;</strong>란 사이트에 접속하여 본 약관에
              따라 운영자가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.
            </li>
            <li>
              <strong>&quot;회원&quot;</strong>이란 운영자가 정한 절차에 따라
              계정을 등록하고 서비스를 이용하는 자를 말합니다.
            </li>
            <li>
              <strong>&quot;게시물&quot;</strong>이란 회원이 서비스 이용 과정에서
              사이트에 게시하거나 서비스에 저장·연동되는 부호·문자·음성·음향·화상·
              동영상 등의 정보 형태로 표시되는 글, 사진, 동영상, 각종 파일과 링크
              등을 말합니다.
            </li>
            <li>
              <strong>&quot;콘텐츠&quot;</strong>란 게시물과 유사하나 입력·동기화
              목적의 서지·메타데이터·메모·평가 등 서비스 내 정보를 포괄적으로
              일컫는 말로 쓸 수 있습니다.
            </li>
            <li>
              <strong>&quot;포인트&quot;</strong>란 운영 정책에 따라 적립·차감되는
              서비스 내부 수치로, 법정 통화가 아니며 원칙적으로 현금으로 교환되지
              않습니다.
            </li>
            <li>
              <strong>&quot;플랜·VIP(구독)&quot;</strong>이란 이용 한도·혜택을
              구분하기 위한 등급·기간 기반의 이용 조건을 말하며,{" "}
              <strong>결제 모듈(PG) 도입 이전</strong>에는 운영 정책·관리자
              조치에 따라 부여·조정될 수 있습니다.
            </li>
            <li>
              <strong>&quot;유료 서비스&quot;</strong>란 운영자가 유료로 제공하거나
              추후 유료로 전환·추가할 수 있는 서비스(구독, 유료 기능, 유료 테마
              등)를 말합니다. 세부 조건은 서비스 화면 또는 별도 약관에서
              정합니다.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            제3조 (약관의 게시·효력·개정)
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              운영자는 본 약관의 내용을 이용자가 알 수 있도록 사이트 초기 화면
              또는 연결 화면에 게시합니다.
            </li>
            <li>
              운영자는 「약관의 규제에 관한 법률」, 「정보통신망 이용촉진 및
              정보보호 등에 관한 법률」(이하 &quot;정보통신망법&quot;) 등 관계
              법령을 위반하지 않는 범위에서 본 약관을 개정할 수 있습니다.
            </li>
            <li>
              운영자가 약관을 개정하는 경우 적용 일자 및 개정 사유를 명시하여
              현행 약관과 함께 그 적용 일자 <strong>7일 전</strong>부터 시행
              전일까지 공지합니다. 다만, 이용자에게 불리하게 변경하는 경우에는{" "}
              <strong>적용 일자 30일 전</strong>부터 공지합니다.
            </li>
            <li>
              공지된 시행 일자 이후 회원이 서비스를 계속 이용하는 경우 개정 약관에
              동의한 것으로 봅니다. 동의하지 않는 회원은 이용 계약을 해지(탈퇴)할
              수 있습니다. 유료 서비스를 이용하는 회원이 개정에 동의하지 않아
              계약을 해지하는 경우 환불 등은 운영자가 정한 환불 정책 및 관계
              법령에 따릅니다.
            </li>
            <li>
              본 약관에서 정하지 아니한 사항과 본 약관의 해석에 관하여는
              「전자상거래 등에서의 소비자 보호에 관한 법률」 등 관계 법령,
              공정거래위원회 고시·지침 또는 상관례에 따릅니다.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제4조 (약관의 해석)</h2>
          <p>
            유료 서비스 및 개별 기능에 대하여는 별도의 약관 및 이용 조건(이하{" "}
            <strong>&quot;개별 약관&quot;</strong> 또는 운영 정책)을 둘 수
            있습니다. 개별 약관은 해당 서비스 소개 화면 등에 고지하며, 결제 또는
            최초 이용 시 동의 절차를 거칠 수 있습니다. 이 경우 개별 약관이 본
            약관에 우선합니다.
          </p>
          <p>
            본 약관에서 정하지 아니한 사항과 해석에 관하여는 「전자상거래 등에서의
            소비자 보호에 관한 법률」, 「약관의 규제에 관한 법률」, 관계 법령 및
            상관례에 따릅니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            제5조 (이용 계약의 성립)
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              이용 계약은 이용자가 본 약관의 내용에 대하여 동의한 후 회원가입
              신청을 하고, 운영자가 이를 승낙함으로써 성립합니다.
            </li>
            <li>
              운영자는 원칙적으로 가입 신청에 대하여 승낙합니다. 다만 다음 각
              호에 해당하는 경우 승낙을 하지 않거나 사후에 이용 계약을 해지할 수
              있습니다: 본 약관에 의하여 이전에 회원 자격을 상실한 적이 있는
              경우(단, 운영자의 재가입 승낙이 있는 경우 예외), 타인의 명의 또는
              허위 정보를 이용한 경우, 운영자가 제시하는 필수 정보를 기재하지 않은
              경우,{" "}
              <strong>
                만 14세 미만 아동이 법정대리인의 동의를 받지 않은 것으로 확인된
                경우
              </strong>
              , 기술상 서비스 제공이 곤란한 경우, 기타 신청이 법령·본 약관에
              위반되거나 공서양속에 반하는 경우.
            </li>
            <li>
              운영자는 회원 유형·서비스에 따라 전문기관을 통한 본인 확인 등을
              요청할 수 있습니다.
            </li>
            <li>
              회원이 가입 시 연락처·이메일 등을 부정확히 기재하여 발생한 불이익에
              대하여 운영자는 책임지지 않습니다.
            </li>
            <li>
              설비 여유 부족, 기술·업무상 문제가 있는 경우 승낙을 유보할 수
              있습니다.
            </li>
            <li>
              운영자는 정책에 따라 등급·플랜별로 이용 시간, 이용 횟수, 메뉴
              등을 달리할 수 있습니다.
            </li>
            <li>
              「청소년 보호법」 등 관계 법령에 따른 연령·등급 준수를 위하여 이용
              제한이나 등급별 제한을 둘 수 있습니다.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제6조 (회원정보의 변경)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              회원은 서비스 내 회원정보 수정 기능을 통하여 정보를 열람·수정할 수
              있습니다. 다만 서비스 관리·보안을 위해 계정 식별자(예: 이메일) 등은
              수정이 제한될 수 있으며, 연락처 변경 시 별도 인증을 요구할 수
              있습니다.
            </li>
            <li>
              가입 시 기재 사항이 변경된 경우 지체 없이 수정하거나 운영자가
              안내하는 방법으로 통지해야 합니다.
            </li>
            <li>
              변경 사항을 알리지 않아 발생한 불이익에 대하여 운영자는 책임지지
              않습니다.
            </li>
            <li>
              운영자는 명백한 오기 등이 있다고 판단하는 경우 회원에게 정정을
              요청할 수 있으며, 이에 따르지 않아 발생한 서비스 이용 제한 등에
              대하여 운영자는 책임지지 않습니다.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제7조 (개인정보보호 의무)</h2>
          <p>
            운영자는 정보통신망법, 「개인정보 보호법」 등 관계 법령이 정하는 바에
            따라 회원의 개인정보를 보호하기 위해 노력합니다. 개인정보의 수집·이용·
            제공 등에 관하여는 별도의{" "}
            <a className="underline underline-offset-2 hover:text-foreground" href="/privacy">
              개인정보처리방침
            </a>
            에 정한 바에 따릅니다. 다만, 운영자의 공식 사이트에 연결된 외부
            사이트·앱에서는 운영자의 개인정보처리방침이 적용되지 않을 수 있습니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            제8조 (계정·비밀번호 등의 관리)
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              계정·비밀번호·소셜 로그인 연동 등 인증 수단의 관리 책임은 회원에게
              있으며, 제3자가 이용하도록 하여서는 안 됩니다.
            </li>
            <li>
              운영자는 계정 식별자가 개인정보 유출 우려, 공서양속에 반하거나 운영자
              또는 운영자로 오인할 우려가 있는 경우 이용을 제한할 수 있습니다.
            </li>
            <li>
              도용 또는 제3자 사용이 의심되는 경우 즉시 운영자에 통지하고 안내에
              따라야 하며, 통지·협력을 게을리하여 발생한 불이익에 대하여 운영자는
              책임지지 않습니다.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제9조 (회원에 대한 통지)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              운영자가 회원에게 통지하는 경우 별도 규정이 없으면 서비스에 등록된
              전자우편 주소 또는 회원이 제공한 연락처를 활용할 수 있습니다.
            </li>
            <li>
              회원 전체에 대한 통지의 경우 7일 이상 사이트 게시로 제1항의 통지를
              갈음할 수 있습니다.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제10조 (운영자의 의무)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              운영자는 관계 법령과 본 약관이 금지하거나 공서양속에 반하는 행위를
              하지 않으며, 서비스를 안정적으로 제공하기 위해 노력합니다.
            </li>
            <li>
              운영자는 회원이 안전하게 서비스를 이용할 수 있도록 개인정보 보호를
              위한 보안 조치를 갖추고, 개인정보처리방침을 공시·준수합니다.
            </li>
            <li>
              운영자는 이용자의 불만 또는 피해 구제 요청을 적절히 처리하기 위해
              필요한 채널·체계를 마련합니다.
            </li>
            <li>
              회원이 제기한 의견·불만이 정당하다고 인정되면 지체 없이 처리하며,
              게시판·전자우편 등으로 처리 과정과 결과를 전달할 수 있습니다.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            제11조 (회원의 의무 및 금지 행위)
          </h2>
          <p>
            회원은 적용 가능한 모든 법령·규범을 준수하고, 운영자가 서비스 운영을
            위해 공지하는 행동 기준·운영 정책을 따릅니다. 운영 정책은 모든 행위를
            열거하지 않을 수 있으며, 운영자는 서비스의 온전함을 보호하기 위해{" "}
            경고, 이용 제한, 콘텐츠 삭제, 계정 정지, 포인트 회수 등 필요한 조치를
            취할 수 있고 운영 정책을 개정할 수 있습니다.
          </p>
          <p>회원은 특히 다음 각 호의 행위를 하여서는 안 됩니다.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>타인의 저작권·상표·초상권 등 지식재산권을 침해하는 게시물 게시</li>
            <li>음란·폭력·혐오·불법 행위 조장 또는 범죄와 관련된 정보 유포</li>
            <li>운영자·다른 회원·제3자 사칭 또는 허위 사실 유포</li>
            <li>
              자동화 수단(매크로, 크롤러 등)으로 과도한 요청을 보내 정상 운영을
              방해하거나 포인트·출석·한도 규칙을 악용하는 행위
            </li>
            <li>시스템·보안 취약점 악용 또는 허가 없는 침입·데이터 수집 시도</li>
            <li>
              공동서재·공개 기능을 이용한 스팸·무단 영리 홍보(운영자가 허용하는
              경우 제외)
            </li>
            <li>기타 법령·본 약관·공지에 위반되거나 운영을 방해하는 행위</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제12조 (서비스의 내용)</h2>
          <p>
            서비스는 다음 각 호의 기능을 포함할 수 있으며, 세부 명칭·화면·API는
            업데이트에 따라 달라질 수 있습니다.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>개인 서재: 소장 도서 등록·편집·삭제, 읽기 상태·별점·메모·독서 이벤트 기록</li>
            <li>
              서지 조회: ISBN·검색어 등을 이용한 메타데이터 조회(국립중앙도서관·
              네이버 등 외부 제공자 순·설정에 따름)
            </li>
            <li>공동서재: 서재 생성·설명, 멤버 초대·역할, 일부 소장 정보의 공유 표시</li>
            <li>포인트: 규칙에 따른 적립·차감, 일·월 한도 등 운영 정책</li>
            <li>출석·활동: 일 단위 활동 기록(타임존·로컬 날짜 기준 등 정책에 따름)</li>
            <li>
              플랜·VIP: 공동서재 개수·멤버·초대 한도, 메타 조회·스캔 등 이용 한도와
              연계된 혜택(구체 항목은 공지·정책에 따름)
            </li>
            <li>커뮤니티·서지 품질: 공개 한줄평, 공유 서지(캐논) 수정 제안·검토·투표 등</li>
            <li>표지 등 이미지 업로드·저장(예: 클라우드 이미지 호스트 연동)</li>
            <li>웹 대시보드·모바일 앱을 통한 동일 계정 연동 이용</li>
            <li>
              <strong>향후</strong> 유료 테마·다국어(i18n)·결제(PG) 연동·VIP 자동
              갱신 등은 별도 공지·약관·개인정보 처리방침 보완과 함께 제공될 수
              있습니다.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            제13조 (서비스의 제공·변경·중단)
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              운영자는 서비스를 범위별로 나누어 이용 가능 시간을 달리 정할 수
              있으며, 이 경우 사전에 공지합니다.
            </li>
            <li>
              설비 보수·점검, 교체·고장, 통신 두절, 운영상 상당한 사유가 있는 경우
              서비스 제공을 일시 중단할 수 있습니다. 이 경우 제9조의 방법으로
              통지하되, 사전 통지가 불가능한 부득이한 사유가 있으면 사후 통지할
              수 있습니다.
            </li>
            <li>
              필요한 경우 정기 점검을 실시하며, 시간은 서비스 화면 등에 사전
              공지된 바에 따릅니다.
            </li>
            <li>
              상당한 이유가 있는 경우 운영·기술상 필요에 따라 서비스의 전부 또는
              일부를 변경할 수 있으며, 내용·이용 방법·이용 시간에 변경이 있는
              경우 변경 사유·내용·제공 일자 등을 변경 전에 서비스 화면 또는
              전자우편 등으로 알립니다.
            </li>
            <li>
              <strong>무료로 제공되는 서비스</strong>의 전부 또는 일부에 대하여
              운영자는 정책 및 운영상 필요에 따라 수정·중단·변경할 수 있으며,
              관계 법령에 특별한 규정이 없는 한 별도 보상을 하지 않습니다.
            </li>
            <li>
              천재지변, 정전, 외부 플랫폼·API 장애, 보안 사고 등 불가항력으로
              서비스를 제공할 수 없는 경우 책임이 면제될 수 있습니다.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            제14조 (정보의 제공 및 광고)
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              운영자는 서비스 이용에 필요하다고 인정되는 정보를 공지사항·전자우편
              등으로 제공할 수 있습니다. 다만 회원은 관계 법령에 따른 거래 관련
              정보 및 고객 문의 답변 등을 제외하고 전자우편에 대한 수신을 거부할
              수 있습니다.
            </li>
            <li>
              전화·팩스 등으로 광고성 정보를 보내려면 사전 동의를 받습니다. 다만
              거래 관련 정보·고객 문의 회신 등은 예외로 할 수 있습니다.
            </li>
            <li>
              운영자는 서비스 화면·사이트·전자우편 등에 광고를 게재할 수 있습니다.
            </li>
            <li>
              광고가 게재된 전자우편을 받은 회원은 수신 거부를 할 수 있습니다.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제15조 (포인트·혜택)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              포인트의 적립·차감 조건, 이벤트, 일·월 한도, 잔액 부족 시 처리는
              운영 정책에 따릅니다.
            </li>
            <li>
              포인트는 원칙적으로 양도·현금 교환·상속의 대상이 되지 않으며, 서비스
              종료·정책 변경 시 소멸될 수 있습니다.
            </li>
            <li>
              운영자·관리자는 오류 정정, 이벤트 조정, 부정 이용 방지 등을 위해
              포인트를 조정할 수 있습니다.
            </li>
            <li>
              프로모션 등으로 유효 기간이 있는 포인트를 제공하는 경우 운영자는
              유효 기간을 명확히 표시하고, 관계 법령이 정하는 범위에서 이를 안내할
              수 있습니다.
            </li>
            <li>VIP 등 플랜 혜택에도 남용 방지를 위한 상한은 별도로 적용될 수 있습니다.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            제16조 (유료 서비스·구독·결제)
          </h2>
          <p>
            <strong>유료 구독·인앱 결제·자동 결제</strong>가 도입되는 경우,
            요금·청약 철회·환불·해지는 별도 유료 이용약관·결제 화면 고지 및
            「전자상거래 등에서의 소비자 보호에 관한 법률」 등 관계 법령에
            따릅니다. <strong>본 약관 시점에는 PG 연동 자동 결제가 필수는 아니며</strong>,
            VIP 기간 등은 운영 정책에 따라 수동 부여될 수 있습니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            제17조 (공동서재·공개 콘텐츠)
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              회원이 공동서재에 소장 정보를 연결하거나 공개 한줄평 등을 게시하는
              경우, 초대된 멤버 또는 서비스 정책에 따라 정해진 범위에서 열람될 수
              있습니다.
            </li>
            <li>회원은 공개 범위·대상을 이해하고 콘텐츠를 게시해야 합니다.</li>
            <li>
              공유 서지(캐논)는 여러 회원이 열람·기여할 수 있으며, 운영자는
              품질·분쟁 방지를 위해 수정·삭제·검토할 수 있습니다.
            </li>
            <li>
              <strong>관리자·운영 스태프</strong> 등 내부 역할은 운영 목적에 한해
              시스템상 부여될 수 있으며, 권한 사용은 내부 정책·감사에 따릅니다.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            제18조 (게시물의 저작권·이용·관리)
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>운영자가 서비스 내에 게시한 콘텐츠의 저작권은 운영자에게 귀속될 수 있습니다.</li>
            <li>회원이 게시한 게시물의 저작권은 회원에게 귀속됩니다.</li>
            <li>
              회원이 게시하는 게시물은 검색 결과, 서비스·관련 프로모션 등에 노출될
              수 있으며, 해당 노출에 필요한 범위에서 복제·편집·표시될 수 있습니다.
              이 경우 운영자는 저작권법 등을 준수하며, 회원은 서비스 내 설정·
              고객 채널 등을 통해 삭제·비공개 등을 요청할 수 있습니다(법령·기술적
              한도 내).
            </li>
            <li>
              운영자가 제2항 이외의 방법으로 회원 게시물을 이용하려면 사전 동의를
              받습니다.
            </li>
            <li>
              게시물이 정보통신망법·저작권법 등에 위반된다고 인정되면 권리자는 관계
              법령에 따라 게시 중단 등을 요청할 수 있고, 운영자는 법령에 따라 조치
              합니다.
            </li>
            <li>
              권리자의 요청이 없더라도 권리 침해가 인정될 만한 사유가 있거나
              운영 정책·법령에 반하는 경우 운영자는 임시 조치·삭제 등을 할 수
              있습니다.
            </li>
            <li>
              서비스 UI·로고·비공개 소스코드 등에 대한 권리는 운영자 또는 정당한
              권리자에게 있습니다. 외부 API·오픈 데이터에서 수신한 서지 정보의
              이용은 해당 제공자 정책 및 저작권법의 한도 내에서만 이루어집니다.
            </li>
            <li>
              회원은 서비스 운영·개선·표시·백업·통계·분쟁 대응을 위해 필요한 범위에서
              운영자에게 비독점적 이용을 허락합니다(별도 동의 절차가 있는 경우는
              예외).
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제19조 (권리의 귀속)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              서비스에 대한 저작권 및 지적재산권은 운영자에 귀속됩니다. 단, 회원의
              게시물 및 제휴·라이선스에 따라 제공된 저작물 등은 예외로 합니다.
            </li>
            <li>
              운영자는 서비스와 관련하여 회원에게 운영자가 정한 이용 조건에 따라
              계정, 콘텐츠 열람, 포인트 등을 이용할 수 있는 권한만을 부여하며,
              회원은 이를 양도·판매·담보 제공 등의 처분 행위를 할 수 없습니다.
            </li>
          </ul>
        </section>

        <section id="article-20-withdrawal" className="space-y-3 scroll-mt-24">
          <h2 className="text-base font-semibold text-foreground">제20조 (계약 해지·탈퇴)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              회원은 언제든지 아래 <strong>서비스 내 탈퇴 절차</strong>를 통해 이용 계약을 해지할 수
              있습니다. 탈퇴는 <strong>로그인한 상태</strong>에서만 진행할 수 있습니다. 앱·웹 이용이
              어려운 경우에는 운영자가 안내하는 고객 채널(개인정보처리방침의 문의처 등)을 통해 삭제(탈퇴)를 요청할 수
              있습니다.
            </li>
            <li>
              운영자는 본 약관 위반 등 중대한 사유가 있는 경우 계약을 해지하거나 이용을 제한할 수 있습니다.
            </li>
          </ul>

          <div className="space-y-4 border-l-2 border-muted pl-4">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">가. 웹 브라우저에서 탈퇴</h3>
              <ol className="list-decimal space-y-1 pl-5">
                <li>
                  <a className="underline underline-offset-2 hover:text-foreground" href="/login">
                    로그인
                  </a>
                  합니다.
                </li>
                <li>
                  화면 상단 오른쪽의 <strong>프로필 설정</strong>(톱니바퀴 아이콘)을 눌러{" "}
                  <strong>프로필</strong> 창을 엽니다.
                </li>
                <li>
                  창 하단의 <strong>회원 탈퇴</strong>를 누르고, 안내를 확인한 뒤 <strong>탈퇴 확인</strong>으로
                  완료합니다.
                </li>
              </ol>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">나. 모바일 앱에서 탈퇴</h3>
              <ol className="list-decimal space-y-1 pl-5">
                <li>앱 하단 탭에서 <strong>프로필</strong>을 선택합니다.</li>
                <li>
                  <strong>계정 설정</strong>에서 <strong>프로필 편집</strong>으로 이동합니다.
                </li>
                <li>
                  화면 하단의 <strong>회원 탈퇴…</strong>를 누르고, 대화 상자 안내에 따라 확인합니다.
                </li>
              </ol>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">다. 탈퇴 시 삭제되는 정보(요약)</h3>
              <p>
                탈퇴를 확인하면 복구할 수 없는 범위에서 아래에 해당하는 정보가 삭제되거나, 이용 계약 종료에 따라
                처리됩니다.
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>보유 포인트 및 포인트 원장 전체</li>
                <li>내 서재(소장 도서), 메모, 독서 이벤트 기록, 한줄평</li>
                <li>
                  내가 만든 공동서재 — 다른 멤버가 없으면 탈퇴와 함께 삭제되고, 다른 멤버가 있으면 탈퇴 전 소유권 이전이
                  필요합니다
                </li>
                <li>다른 사람 서재에 참여 중이던 멤버십</li>
                <li>프로필·계정(로그인) 정보</li>
              </ul>
              <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-foreground">
                <strong>소유한 공동·모임 서재</strong>에 다른 멤버가 있으면 탈퇴할 수 없습니다. 해당 서재 화면에서{" "}
                <strong>소유권을 다른 멤버에게 이전</strong>한 뒤 탈퇴해 주세요. 본인만 남은 공동서재는 별도 삭제 없이
                탈퇴 시 함께 정리됩니다.
              </p>
              <p className="text-xs text-muted-foreground">
                여러 이용자가 공유하는 서지 데이터(
                <code className="rounded bg-muted px-1">books</code> 등)는 서비스 운영을 위해 그대로 둘 수 있습니다.
                회원이 서비스에 남긴 일부 정보·게시물은 자동으로 삭제되지 않거나, 타인의 권익과 얽혀 분리·비식별 처리
                등의 형태로 남을 수 있으니 탈퇴 전 필요한 조치를 하시기 바랍니다.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">라. 보유·문의</h3>
              <p>
                탈퇴 후 개인정보 및 계정 데이터의 보유·삭제는 「개인정보 보호법」 등 관계 법령 및{" "}
                <a className="underline underline-offset-2 hover:text-foreground" href="/privacy">
                  개인정보처리방침
                </a>
                에 따릅니다. 로그인이 불가능하거나 위 절차 진행이 어려운 경우에도 동일 방침의{" "}
                <strong>개인정보 보호 책임자·문의</strong>로 삭제(탈퇴) 요청을 보내실 수 있으며, 본인 확인에 필요한
                정보를 요청할 수 있습니다.
              </p>
              <ul className="list-none space-y-1 border-l-2 border-muted pl-4 text-foreground/90">
                <li>이메일: bookfolio.app@gmail.com</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제21조 (환불)</h2>
          <p>
            유료 서비스 구매 회원이 환불을 신청하는 경우, 각 유료 상품·구독 화면에
            고지된 환불 규정 및 「전자상거래 등에서의 소비자 보호에 관한 법률」
            등 관계 법령에 따릅니다. 환불 금액 계산 방식(절상·절사 등)은 결제
            또는 운영 정책에서 정합니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제22조 (이용 제한 등)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              운영자는 회원이 본 약관상 의무를 위반하거나 서비스 운영을 현저히
              방해한 경우 경고, 일시 정지, 영구 이용 정지 등 단계적으로 서비스
              이용을 제한할 수 있습니다.
            </li>
            <li>
              명의 도용·결제 도용, 저작권법 위반, 정보통신망법 위반(불법 통신·
              해킹 등), 악성 프로그램 유포 등 법령을 위반한 경우에는 즉시 영구
              이용 정지 등 조치를 할 수 있으며, 이에 따라 소멸한 혜택 등에 대해
              별도 보상하지 않을 수 있습니다(관계 법령에 반하지 않는 범위).
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제23조 (책임의 한계)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              운영자의 고의 또는 중대한 과실이 없는 한, 간접적·특별·결과적·징벌적
              손해 등에 대하여 책임을 지지 않을 수 있습니다(관계 법령이 달리
              규정하는 경우 제외).
            </li>
            <li>
              천재지변 또는 이에 준하는 불가항력으로 서비스를 제공할 수 없는 경우
              운영자의 책임이 면제될 수 있습니다.
            </li>
            <li>회원의 귀책 사유로 인한 이용 장애에 대하여 운영자는 책임지지 않습니다.</li>
            <li>
              회원이 서비스에 게재한 정보·자료·사실의 신뢰도·정확성 등에 관하여
              운영자는 보증하지 않습니다.
            </li>
            <li>
              회원 간 또는 회원과 제3자 간에 서비스를 매개로 한 거래 등에
              대하여 운영자는 책임을 지지 않습니다.
            </li>
            <li>
              무료 서비스 이용과 관련하여 관계 법령에 특별한 규정이 없는 한
              운영자는 책임지지 않을 수 있습니다.
            </li>
            <li>
              서비스는 &quot;있는 그대로&quot; 제공되며, 외부 서지 API·호스팅 등
              제3자 서비스의 정확성·가용성을 보증하지 않습니다.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제24조 (분쟁 해결)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              운영자는 회원의 정당한 의견·불만을 반영하고 피해 구제를 위해 고객
              응대 채널을 운영합니다.
            </li>
            <li>
              접수된 불만·의견을 신속히 처리하며, 곤란한 경우 그 사유와 일정을
              통지합니다.
            </li>
            <li>
              본 약관의 일부 규정이 대한민국의 강행 법규와 상충하는 경우 그
              강행 법규에 따르며, 일부 조항의 효력 정지가 다른 조항의 효력에
              영향을 주지 않습니다.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            제25조 (준거법 및 재판 관할)
          </h2>
          <p>
            본 약관은 대한민국 법령에 따라 해석됩니다. 운영자와 회원 간 분쟁에
            관한 소송은 민사소송법 등 관계 법령에 따른 관할 법원에 제기합니다.
            다만 소비자에게 유리한 관할 규정이 있는 경우 그에 따릅니다.{" "}
            <span className="text-muted-foreground">
              (전속 관할·본점 소재 등은 실제 사업자 정보에 맞게 확정하시기
              바랍니다.)
            </span>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">제26조 (문의)</h2>
          <p>
            본 약관에 관한 문의는 [고객센터 이메일·전화 등 실제 연락처]로 접수할
            수 있습니다. 사업자 정보(상호·대표자·주소·통신판매업 신고 등)는 서비스
            초기면 또는 별도 페이지에 함께 게시하는 것이 좋습니다.
          </p>
        </section>
      </div>
    </div>
  );
}

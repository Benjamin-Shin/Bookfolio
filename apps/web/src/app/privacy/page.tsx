import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 — 서가담",
  description:
    "서가담 서비스의 개인정보 수집·이용, 보관, 제3자 연동 및 정보주체 권리에 관한 안내입니다.",
};

/**
 * @history
 * - 2026-04-13: 회원 탈퇴 절차 안내에 이용약관 제20조 앵커 링크
 * - 2026-04-12: 모바일 앱 카메라(ISBN 바코드 스캔·메모용 촬영·기기 내 OCR) 수집·처리 안내 보강
 * - 2026-04-05: 메타·도입부·책임자 표기 서가담 정렬
 * - 2026-03-29: 「캐논·투표」를 공통 도서 정보·수정 제안·투표 참여로 풀어 설명.
 * - 2026-03-29: 트레바리 등 유사 서비스 방침을 참고해 도입부·필수·선택·자동 수집, 법정 보존·파기, 제3자 예외, 쿠키·개정 공지(7일·30일), 외부 링크 적용 범위, 피해 구제 기관, 향후 결제(PG) 수집 안내 보강.
 * - 2026-03-28: Google 항목을 소셜 로그인만 명시(Google Books 조회 미사용).
 * - 2026-03-28: 현재 웹·모바일·DB 스키마 기준 개인정보처리방침 본문 정리(인증, 서재, 공동서재, 포인트·출석, VIP·구독, 캐논 편집·투표, ISBN 조회·Cloudinary 등 반영)
 * - 2026-03-26: 법률 검토 전 안내용 더미 본문
 */
export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <h1 className="text-2xl font-bold tracking-tight">개인정보처리방침</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        공고일: 2026년 3월 29일 · 시행일: 2026년 3월 29일
      </p>
      <p className="mt-4 text-sm leading-relaxed text-foreground/90">
        서가담(이하 &quot;서비스&quot;)는 이용자의 동의를 바탕으로
        개인정보를 수집·이용하며, 정보주체의 권리를 존중합니다. 서비스는
        「개인정보 보호법」 등 대한민국 관계 법령과 가이드라인을 준수합니다.
      </p>
      <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
        &quot;개인정보 처리방침&quot;은 이용자가 안심하고 서비스를 이용할 수
        있도록, 개인정보 처리에 관한 기준과 절차를 알리기 위한 문서입니다. 본
        방침은 <strong>현재 제공되는 기능과 시스템 구성</strong>을 바탕으로
        작성되었습니다. 실제 사업자 명칭·대표자·주소 등은 서비스 랜딩·공지 또는
        별도 약관과 함께 확정·게시하시기 바랍니다.{" "}
        <strong>최종 법적 검토는 변호사 등 전문가에게 위탁</strong>하는 것을
        권장합니다.
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/90">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            1. 처리 목적
          </h2>
          <p>
            서비스의 주요 기능은 <strong>회원 가입 후</strong> 제공되는 경우가
            많습니다. 비회원에게 제공되는 기능이 있는 경우 해당 화면 또는 안내에
            따릅니다.
          </p>
          <p>서비스는 다음 목적 범위에서만 개인정보를 처리합니다.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>회원 가입·로그인·본인 식별, 계정 및 세션 관리</li>
            <li>
              개인 서재(소장 도서) 등록·편집·조회, 읽기 상태·별점·메모·독서
              이벤트 기록
            </li>
            <li>
              ISBN·제목 기반 외부 서지 조회를 통한 도서 메타데이터 제공 및, 여러
              이용자에게 같은 내용으로 보이도록 모아 둔{" "}
              <strong>공통 도서 정보(내부 용어: 캐논)</strong> 보강
            </li>
            <li>공동서재 생성·초대·멤버 관리 및 공유 소장 정보 표시</li>
            <li>
              포인트 적립·차감, 출석(일일 활동) 처리, 플랜·이용 한도와의 연동
            </li>
            <li>
              VIP 등 이용 등급·구독 상태 표시(현 단계에서는 결제(PG) 자동 연동
              없이 운영 정책·관리자 처리에 따를 수 있음)
            </li>
            <li>
              공통 도서 정보에 대한 수정 제안·검토·투표 등 참여형 기능 운영
            </li>
            <li>부정 이용 방지, 보안·품질 개선, 분쟁 대응, 법령상 의무 이행</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            2. 수집하는 개인정보 항목
          </h2>
          <p>
            항목은 회원 가입·이용 과정에서{" "}
            <strong>이용자가 입력하거나, 연동·자동 생성되는 정보</strong>로
            나뉩니다.{" "}
            <strong>필수 항목</strong>은 해당 기능의 본질적 제공에 필요한
            정보이고, <strong>선택 항목</strong>은 없어도 기본 이용이 가능하나
            편의·개인화를 위해 추가로 제공받는 정보입니다(실제 화면의 입력·동의
            문구가 우선합니다).
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>회원 가입(이메일)·로그인(일반):</strong> 필수 — 이메일
              주소, 비밀번호(서버에는 단방향 해시로 저장). 선택 — 표시 이름,
              프로필 이미지 URL 등 프로필에 기재하는 항목
            </li>
            <li>
              <strong>소셜 로그인(Google):</strong> Google이 OAuth 과정에서
              제공하는 식별·프로필 정보(필수·선택은 Google 동의 화면에 따름)
            </li>
            <li>
              <strong>계정·인증(상세):</strong> 이메일 인증 시각(해당하는 경우),
              내부 이용을 위한 역할·정책 값(예: 관리자/일반 등)
            </li>
            <li>
              <strong>프로필·환경:</strong> 표시명·아바타, 출석 일자 산정을 위한
              타임존(IANA) 등 서비스가 제공하는 프로필 설정 항목
            </li>
            <li>
              <strong>서재·도서 활동:</strong> 읽기 상태, 별점, 소장 여부, 보관
              위치 등 텍스트, 마크다운 메모, 독서 이벤트 기록, 도서별 공개
              한줄평 등 이용자가 기록하는 콘텐츠
            </li>
            <li>
              <strong>공동서재:</strong> 서재 이름·설명·유형, 멤버십·역할,
              공유에 포함된 소장 항목 매핑 정보; 멤버 초대 시 초대 대상의 이메일
              주소(초대·가입 연계 처리)
            </li>
            <li>
              <strong>포인트·출석·구독:</strong> 포인트 변동 내역(증감 값,
              사유·참조, 잔액), 일별 출석에 해당하는 날짜·첫 활동 시각, 구독
              플랜 식별자·상태·이용 기간 등
            </li>
            <li>
              <strong>공통 도서 정보 수정·투표(캐논):</strong> &quot;캐논&quot;은
              ISBN 등으로 묶인 <strong>서비스 공통 도서 정보</strong>(제목·저자
              등 표시용 데이터)를 가리키는 내부 이름입니다. 회원이 이 정보의{" "}
              <strong>오류를 고치자는 제안</strong>을 올리거나, 반영 여부를
              정하는 <strong>투표에 참여</strong>할 때 제안·검토·투표 내역, 기여
              점수·순위 계산에 필요한 식별 정보가 기록될 수 있습니다.
            </li>
            <li>
              <strong>기술·자동 생성 정보:</strong> 단말기·브라우저 환경에 따른
              일부 정보, 접속 IP 주소, 쿠키·세션·로그인 유지에 필요한 식별자,
              방문·이용 시각, 서비스 이용 기록, 부정 이용 방지를 위한 기록, 모바일
              앱 등에서 API 접근 시 발급·사용하는 액세스 토큰(보유 기간·항목
              세부는 내부 보안 정책에 따름)
            </li>
            <li>
              <strong>모바일 앱 카메라(안드로이드·iOS):</strong> 앱에서{" "}
              <strong>도서 ISBN 바코드를 스캔</strong>하거나, 메모 작성 시{" "}
              <strong>책 페이지를 촬영해 글자로 변환(OCR)</strong>하는 기능을
              쓸 때 단말의 카메라(또는 이에 상응하는 영상 입력)에 접근할 수
              있습니다. 운영체제는 이 과정에서 카메라 권한 허용을 요청할 수
              있습니다.
            </li>
          </ul>
          <div className="space-y-2 rounded-md border border-border/60 bg-muted/30 px-4 py-3">
            <p className="font-medium text-foreground">
              모바일 앱에서 카메라로 처리하는 정보
            </p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                <strong>바코드 스캔:</strong> 카메라로 비추는 화면은 기기 안에서
                처리되어 바코드에 담긴 숫자(주로 ISBN)를 읽는 데 사용됩니다.{" "}
                <strong>
                  카메라 영상 전체를 서비스 서버에 저장하거나 전송하는 기능은
                  제공하지 않습니다.
                </strong>{" "}
                읽은 ISBN 등 식별값은 기존과 같이 외부 서지 API 조회·내 서재
                등록 등 서비스 제공 목적에 한해 처리될 수 있습니다.
              </li>
              <li>
                <strong>촬영 후 글 인식(OCR):</strong> 이용자가 촬영한 이미지는{" "}
                <strong>기기에서 텍스트를 추출하는 데만</strong> 사용되며,{" "}
                <strong>
                  촬영 파일 자체를 서비스에 업로드·보관하는 흐름은 제공하지
                  않습니다
                </strong>
                (단, 이용자가 메모 등에 넣은 <strong>인식된 텍스트</strong>를
                저장하는 경우에는 회원 콘텐츠로 서비스에 기록될 수 있습니다).
              </li>
            </ul>
            <p className="text-xs text-muted-foreground leading-relaxed">
              카메라를 쓰지 않아도 ISBN·제목 입력 등 다른 방법으로 동일 기능을
              대체할 수 있는 경우가 많습니다. 권한을 거부하면 해당 기능만 제한될
              수 있습니다.
            </p>
          </div>
          <p className="text-muted-foreground">
            <strong>유료 서비스·결제가 도입되는 경우,</strong> 결제대행사(PG) 등
            수탁자가 결제 과정에서 이름, 연락처, 카드·계좌 관련 정보 등 결제에
            필요한 정보를 별도로 수집할 수 있습니다. 그때는 해당 사업자의
            개인정보 처리방침과 이용 약관이 함께 적용됩니다.
          </p>
          <p className="text-muted-foreground">
            ISBN 조회 과정에서 외부 API로 전송되는 값은 주로 ISBN·검색어 등{" "}
            <strong>서지 식별 정보</strong>이며, 이용자 본인을 직접 특정하는
            목적이 아닐 수 있습니다. 다만 외부 사업자의 정책에 따라 처리 대상이
            될 수 있으므로 아래 &quot;제3자 제공·연동&quot;을 함께 참고하시기
            바랍니다.
          </p>
          <p className="text-muted-foreground">
            이 밖에 새로운 기능 등으로 <strong>추가 개인정보를 수집</strong>하는
            경우에는 수집 시점에 항목·이용 목적·보유 기간 등을 안내하고, 법령상
            필요한 경우 동의를 받습니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            3. 수집 방법
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              회원 가입·로그인, 프로필·서재 화면에서 이용자가 입력·동의하는 경우
            </li>
            <li>Google 등 소셜 로그인 연동 시 인증 서버로부터의 수신·매핑</li>
            <li>
              서비스 이용 과정에서의 자동 생성·기록(포인트 원장, 출석, 접속·로그,
              세션·쿠키 등)
            </li>
            <li>
              고객 문의·민원 대응 과정에서 이메일 등을 통해 이용자가 제공하는
              정보(문의에 포함된 범위 내)
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            4. 보유·이용 기간 및 파기
          </h2>
          <p>
            원칙적으로 <strong>회원 탈퇴 시 또는 처리 목적 달성 시</strong> 지체
            없이 파기합니다. 공동서재·공통 도서 정보(캐논) 참여 기록 등 타
            이용자 또는 공개 영역과 연계된
            정보는 서비스 무결성·분쟁 대응을 위해 일정 기간 제한 보관될 수
            있으며, 세부는 내부 정책에 따릅니다.
          </p>
          <p>
            전자적 파일 형태의 개인정보는 복구·재생이 불가능한 방법으로
            삭제하고, 출력물·서면 등은 분쇄·소각 등 안전한 방법으로 파기합니다.
          </p>
          <p className="font-medium text-foreground">
            관계 법령에 따른 보존 의무가 있는 경우의 예시(해당 법령·판례에
            따름):
          </p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>표시·광고에 관한 기록: 6개월</li>
            <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
            <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
            <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
            <li>통신비밀보호법 등에 따른 로그인 기록 등: 3개월</li>
            <li>전자금융거래법 등에 따른 전자금융 거래 기록: 5년</li>
            <li>
              신용정보의 수집·처리 및 이용 등에 관한 기록: 3년(해당되는 경우)
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            5. 제3자 제공
          </h2>
          <p>
            서비스는 원칙적으로 이용자의 개인정보를 외부에{" "}
            <strong>판매·임의 공개하지 않습니다.</strong> 다만 다음에 해당하는
            경우에는 예외로 제공될 수 있습니다.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령에 근거하거나 수사·재판 등 정당한 요청이 있는 경우</li>
            <li>
              통계 작성·학술 연구·시장 조사 등을 위해 필요한 경우, 특정
              개인을 알아볼 수 없는 형태로 가공하여 제공하는 경우
            </li>
            <li>
              정보주체 또는 제3자의 생명·신체·재산에 급박한 위험이 있어 이를
              해소하기 위해 필요한 경우 등 법령이 정한 예외에 해당하는 경우
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            6. 개인정보 처리 위탁 및 국외 이전
          </h2>
          <p>
            서비스 운영을 위해 클라우드 인프라·데이터베이스, 이미지 저장소,
            OAuth 제공자 등 <strong>신뢰할 수 있는 처리자</strong>를 이용할 수
            있습니다. 예시는 다음과 같으며, 실제 설계·계약에 맞게
            명칭·항목·기간을 확정해 게시하는 것이 좋습니다.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Supabase(PostgreSQL 등):</strong> 회원·서재·포인트 등 주된
              저장소
            </li>
            <li>
              <strong>Cloudinary:</strong> 표지 등 이미지 업로드·배포(해당 URL이
              이용자 콘텐츠로 노출될 수 있음)
            </li>
            <li>
              <strong>Google:</strong> 소셜 로그인(OAuth)
            </li>
            <li>
              <strong>네이버·국립중앙도서관 등:</strong> ISBN·제목 기반 서지
              메타데이터 조회 API
            </li>
            <li>
              <strong>애플리케이션 호스팅:</strong> 예: Vercel 등 배포
              환경(로그·세션 처리 포함 가능)
            </li>
          </ul>
          <p>
            위 처리자의 <strong>서버 위치가 대한민국 외</strong>인 경우
            「개인정보 보호법」에 따른 국외 이전 요건(동의, 보호 조치 등)을
            충족하는지 검토·고지해야 합니다. 이전 국가·전달 항목·목적·보유
            기간·거부 방법 등은 계약서와 제품 설정에 맞추어 이 방침에
            구체화하시기 바랍니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            7. 이용자의 권리와 행사 방법
          </h2>
          <p>
            회원 및 법정대리인은 언제든지 개인정보 열람·정정·삭제·처리 정지,
            동의 철회를 요청할 수 있습니다. 다만 동의 철회·삭제 시 법령상 보존
            대상이거나, 서비스 제공에 필수인 정보에 대해서는 이용이 제한되거나
            일부 기능을 쓰지 못할 수 있습니다.
          </p>
          <p>
            서비스 내 프로필·설정 화면에서 직접 확인·수정이 가능한 항목은 해당
            화면을 이용해 주시고, 그 외에는 아래 &quot;개인정보 보호 책임자·문의&quot;를 통해
            요청하실 수 있습니다. 요청이 법령상 제한되는 경우 그 사유를
            안내합니다.
          </p>
          <p>
            <strong>회원 탈퇴</strong>를 하시면 관련 법령과 내부 정책 범위에서
            개인정보 수집·이용에 대한 동의를 철회하는 효과가 있습니다. 탈퇴
            절차는 서비스 내 안내에 따르며, 웹·앱에서의 구체적인 경로와 삭제
            범위는{" "}
            <a className="underline underline-offset-2 hover:text-foreground" href="/terms#article-20-withdrawal">
              이용약관 제20조 (계약 해지·탈퇴)
            </a>
            를 참고해 주세요. 이미 제3자 제공 또는 위탁 처리된 정보에 대해서는
            합리적 범위에서 정정·삭제·처리 정지를 요구하도록 조치합니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            8. 쿠키 및 유사 기술
          </h2>
          <p>
            서비스는 로그인 유지·보안·이용 편의를 위해 쿠키 등 정보를 저장·조회할
            수 있습니다. 쿠키는 이용자 개인을 직접 식별하지 않는 경우가 많으나,
            브라우저 설정에 따라 모든 쿠키 저장을 거부하거나 저장 시 확인을
            받도록 할 수 있습니다. 쿠키를 거부하면 로그인 등 일부 기능 이용에
            불편이 있을 수 있습니다.
          </p>
          <p className="text-muted-foreground">
            설정 예: Microsoft Edge — 설정 &gt; 쿠키 및 사이트 권한 &gt; 쿠키 및
            사이트 데이터. Google Chrome — 설정 &gt; 개인정보 및 보안 &gt; 서드
            파티 쿠키(또는 쿠키 및 기타 사이트 데이터).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            9. 안전성 확보 조치
          </h2>
          <p>
            서비스는 개인정보 안전성 확보를 위해 다음과 같은 조치를 취합니다(실제
            운영 수준에 맞게 보완·기재하세요).
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>관리적 조치:</strong> 개인정보 취급자 최소화, 내부 교육 등
            </li>
            <li>
              <strong>기술적 조치:</strong> 비밀번호 등 주요 정보의 암호화 저장,
              API·데이터베이스 접근에 대한 인가·서버측 검증, 클라우드·SaaS 보안
              설정 및 키 관리, 필요 시 접근 기록·모니터링
            </li>
            <li>
              <strong>물리적 조치:</strong> 서버·자료 보관에 대한 접근 통제 등
              (클라우드 이용 시 제공자 정책·계약에 따름)
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            10. 만 14세 미만
          </h2>
          <p>
            법정대리인 동의가 필요한 연령 미만 아동을 대상으로 하는 경우, 관련
            법령에 따라 별도 절차를 둡니다. 현재 서비스가 아동 전용이 아니라면,
            실제 정책에 맞추어 본 조항을 조정하시기 바랍니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            11. 본 방침의 적용 범위
          </h2>
          <p>
            본 개인정보 처리방침은 서비스가 제공하는 웹·앱 등 제반 서비스에
            적용됩니다. 서비스가 외부 사이트·서비스로 연결되는 링크를 제공할 수
            있으며, 이를 통해 이동한 사이트의 개인정보 처리는 해당 사이트 정책에
            따르므로 별도로 확인하시기 바랍니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            12. 방침 변경 및 공지
          </h2>
          <p>
            법령 또는 서비스 변경에 따라 본 방침을 개정할 수 있습니다. 내용
            추가·삭제·변경이 있는 경우, 시행일 최소{" "}
            <strong>7일 전</strong>부터 서비스 내 공지 등을 통해 안내하는 것을
            원칙으로 합니다. 다만 이용자의 권리·의무에 중대한 변경이 있는 경우에는
            최소 <strong>30일 전</strong>에 공지할 수 있습니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            13. 개인정보 보호 책임자·문의
          </h2>
          <p>
            개인정보 처리에 관한 문의·불만·피해 구제 요청은 아래 연락처로 접수할
            수 있습니다.
          </p>
          <ul className="list-none space-y-1 border-l-2 border-muted pl-4">
            <li>책임자: 서가담 운영</li>
            <li>이메일: bookfolio.app@gmail.com</li>
          </ul>
          <p className="text-xs text-muted-foreground">
            운영 주체·담당 부서명 등은 실제 사업 현황에 맞게 보완하시기 바랍니다.
            개인정보 침해에 대한 상담·신고는 아래 기관에도 문의하실 수 있습니다.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
            <li>
              개인정보 침해신고센터: 국번 없이 118 ·{" "}
              <a
                className="underline underline-offset-2 hover:text-foreground"
                href="https://privacy.kisa.or.kr"
                rel="noopener noreferrer"
                target="_blank"
              >
                privacy.kisa.or.kr
              </a>
            </li>
            <li>
              개인정보 분쟁조정위원회:{" "}
              <a
                className="underline underline-offset-2 hover:text-foreground"
                href="https://www.kopico.go.kr"
                rel="noopener noreferrer"
                target="_blank"
              >
                kopico.go.kr
              </a>{" "}
              (대표번호 등은 해당 사이트 안내 참고)
            </li>
            <li>
              대검찰청 사이버범죄수사단: 국번 없이 1301 ·{" "}
              <a
                className="underline underline-offset-2 hover:text-foreground"
                href="https://www.spo.go.kr"
                rel="noopener noreferrer"
                target="_blank"
              >
                spo.go.kr
              </a>
            </li>
            <li>
              경찰청 사이버수사국: 국번 없이 182 ·{" "}
              <a
                className="underline underline-offset-2 hover:text-foreground"
                href="https://ecrm.police.go.kr"
                rel="noopener noreferrer"
                target="_blank"
              >
                ecrm.police.go.kr
              </a>
            </li>
            <li>
              개인정보 보호위원회:{" "}
              <a
                className="underline underline-offset-2 hover:text-foreground"
                href="https://www.pipc.go.kr"
                rel="noopener noreferrer"
                target="_blank"
              >
                pipc.go.kr
              </a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

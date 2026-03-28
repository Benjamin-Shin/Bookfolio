import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 — Bookfolio",
  description:
    "Bookfolio 서비스의 개인정보 수집·이용, 보관, 제3자 연동 및 정보주체 권리에 관한 안내입니다.",
};

/**
 * @history
 * - 2026-03-28: Google 항목을 소셜 로그인만 명시(Google Books 조회 미사용).
 * - 2026-03-28: 현재 웹·모바일·DB 스키마 기준 개인정보처리방침 본문 정리(인증, 서재, 공동서재, 포인트·출석, VIP·구독, 캐논 편집·투표, ISBN 조회·Cloudinary 등 반영)
 * - 2026-03-26: 법률 검토 전 안내용 더미 본문
 */
export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <h1 className="text-2xl font-bold tracking-tight">개인정보처리방침</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        시행일: 2026년 3월 28일
      </p>
      <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
        Bookfolio(이하 &quot;서비스&quot;)는 「개인정보 보호법」 등 관련 법령을
        준수하며, 이용자의 개인정보가 어떤 목적으로 어떻게 처리되는지를 투명하게
        안내합니다. 본 방침은 <strong>현재 제공되는 기능과 시스템 구성</strong>
        을 바탕으로 작성되었습니다. 실제 사업자 명칭·대표자·주소·고객센터 등은
        서비스 랜딩·공지 또는 별도 약관과 함께 확정·게시하시기 바랍니다.{" "}
        <strong>최종 법적 검토는 변호사 등 전문가에게 위탁</strong>하는 것을
        권장합니다.
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/90">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            1. 처리 목적
          </h2>
          <p>서비스는 다음 목적 범위에서만 개인정보를 처리합니다.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>회원 가입·로그인·본인 식별, 계정 및 세션 관리</li>
            <li>
              개인 서재(소장 도서) 등록·편집·조회, 읽기 상태·별점·메모·독서
              이벤트 기록
            </li>
            <li>
              ISBN·제목 기반 외부 서지 조회를 통한 도서 메타데이터 제공 및 내부
              서지(캐논) 보강
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
              도서 메타데이터 수정 제안·검토·사용자 투표 등 커뮤니티형 기능 운영
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
            나뉩니다.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>계정·인증:</strong> 이메일 주소, 비밀번호(이메일 가입 시
              단방향 해시로 저장), 표시 이름, 프로필 이미지 URL, 이메일 인증
              시각(해당하는 경우), 내부 이용을 위한 역할·정책 값(예: 관리자/일반
              등)
            </li>
            <li>
              <strong>소셜 로그인(Google):</strong> Google이 OAuth 절차에서
              제공하는 식별·프로필 정보(이메일, 이름, 사진 등, Google 정책 및
              동의 화면에 따름)
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
              <strong>캐논·투표:</strong> 서지 수정 제안 내용, 검토 결과, 투표
              기록, 기여·순위 산출에 필요한 식별 정보(설계 상 집계·기록으로 남을
              수 있음)
            </li>
            <li>
              <strong>기술 정보:</strong> 모바일 앱 등에서 API 접근 시
              발급·사용하는 액세스 토큰, 웹 브라우저의 세션·쿠키, 접속·로그에
              해당하는 정보(보유 기간·항목 세부는 내부 보안 정책에 따름)
            </li>
          </ul>
          <p className="text-muted-foreground">
            ISBN 조회 과정에서 외부 API로 전송되는 값은 주로 ISBN·검색어 등{" "}
            <strong>서지 식별 정보</strong>이며, 이용자 본인을 직접 특정하는
            목적이 아닐 수 있습니다. 다만 외부 사업자의 정책에 따라 처리 대상이
            될 수 있으므로 아래 &quot;제3자 제공·연동&quot;을 함께 참고하시기
            바랍니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            3. 수집 방법
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>회원 가입·로그인, 프로필·서재 화면에서의 직접 입력</li>
            <li>Google 등 소셜 로그인 연동 시 인증 서버로부터의 수신·매핑</li>
            <li>
              서비스 이용 과정에서의 자동 생성·기록(포인트 원장, 출석, 접속·세션
              등)
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            4. 보유 및 이용 기간
          </h2>
          <p>
            원칙적으로 <strong>회원 탈퇴 시 또는 처리 목적 달성 시</strong> 지체
            없이 파기합니다. 다만 관계 법령에 따라 보존할 의무가 있는 경우에는
            해당 기간 동안 별도 분리 보관 후 파기할 수 있습니다. 공동서재·캐논
            등 타 이용자 또는 공개 영역과 연계된 정보는 서비스 무결성·분쟁
            대응을 위해 일정 기간 제한 보관될 수 있으며, 세부는 내부 정책에
            따릅니다.
          </p>
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
            7. 이용자의 권리
          </h2>
          <p>
            이용자는 언제든지 개인정보 열람·정정·삭제·처리 정지 등을 요청할 수
            있으며, 서비스 내 설정·고객 지원 절차에 따라 처리합니다. 요청이
            법령상 제한되는 경우에는 그 사유를 안내할 수 있습니다. 회원 탈퇴는
            설정 또는 안내된 절차로 신청할 수 있습니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            8. 쿠키 및 유사 기술
          </h2>
          <p>
            웹 서비스는 로그인 유지·보안을 위해 쿠키 등을 사용할 수 있습니다.
            브라우저 설정에서 쿠키를 거부할 수 있으나, 그 경우 일부 기능이
            제한될 수 있습니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            9. 안전성 확보 조치
          </h2>
          <p>
            서비스는 개인정보 보호를 위해 다음과 같은 조치를 취합니다(실제 운영
            수준에 맞게 보완·기재하세요).
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>비밀번호 등 주요 정보의 암호화 저장</li>
            <li>API·데이터베이스 접근에 대한 인가·서버측 검증</li>
            <li>클라우드·SaaS 제공자와의 보안 설정 및 키 관리</li>
            <li>필요 시 접근 기록·모니터링</li>
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
            11. 방침 변경
          </h2>
          <p>
            법령·서비스 변경 시 본 방침을 개정할 수 있습니다. 중요한 변경은
            시행일·개정 사유와 함께 서비스 내 공지 등으로 안내합니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            12. 개인정보 보호 책임자·문의
          </h2>
          <p>
            개인정보 처리에 관한 문의·불만·피해 구제 요청은 아래 연락처로 접수할
            수 있습니다.
          </p>
          <ul className="list-none space-y-1 border-l-2 border-muted pl-4">
            <li>책임자: 북폴리오 개발자</li>
            <li>이메일: bookfolio.app@gmail.com</li>
          </ul>
          <p className="text-xs text-muted-foreground">
            위 대괄호 항목은 실제 운영 주체 정보로 교체하세요. 기타 권익 침해
            신고는 개인정보보호위원회(
            <a
              className="underline underline-offset-2 hover:text-foreground"
              href="https://www.pipc.go.kr"
              rel="noopener noreferrer"
              target="_blank"
            >
              www.pipc.go.kr
            </a>
            ) 등 관계 기관 안내를 참고할 수 있습니다.
          </p>
        </section>
      </div>
    </div>
  );
}

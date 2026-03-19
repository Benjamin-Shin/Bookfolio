import Link from "next/link";

const features = [
  {
    title: "내 책장 정리",
    description: "종이책과 Ebook을 한곳에서 정리하고 읽는 상태, 평점, 메모를 함께 관리합니다."
  },
  {
    title: "바코드로 빠른 등록",
    description: "모바일에서 ISBN 바코드를 스캔해 도서 정보를 불러오고 바로 내 컬렉션에 추가합니다."
  },
  {
    title: "확장 가능한 구조",
    description: "리뷰, 통계, 독서관리, 커뮤니티 기능을 이어서 붙일 수 있도록 MVP부터 구조를 준비합니다."
  }
];

export default function HomePage() {
  return (
    <main>
      <section className="shell hero">
        <div>
          <div className="eyebrow">Personal Library, Reimagined</div>
          <h1 className="heroTitle">내가 가진 책의 기록을, 북폴리오로.</h1>
          <p className="heroLead">
            Bookfolio는 개인이 소장한 종이책과 Ebook을 관리하는 서비스입니다. MVP에서는 책 등록,
            상태 관리, 평점, 메모에 집중하고 이후 커뮤니티와 통계로 자연스럽게 확장합니다.
          </p>
          <div className="inlineActions">
            <Link href="/dashboard" className="button">
              웹 대시보드 보기
            </Link>
            <Link href="/login" className="buttonGhost">
              이메일로 시작하기
            </Link>
          </div>
          <div className="statsRow">
            <div className="statCard">
              <strong>MVP 범위</strong>
              <p className="muted">인증, 내 서재, 책 CRUD, 바코드 등록, 평점/메모</p>
            </div>
            <div className="statCard">
              <strong>클라이언트</strong>
              <p className="muted">Flutter 모바일 우선, Next.js 웹 보조</p>
            </div>
            <div className="statCard">
              <strong>백엔드</strong>
              <p className="muted">Next.js API + Supabase Auth/Postgres/RLS</p>
            </div>
          </div>
        </div>
        <aside className="heroCard" style={{ padding: "1.5rem" }}>
          <div className="eyebrow">Core Flow</div>
          <h2>등록하고, 기록하고, 다시 찾기 쉽게</h2>
          <p className="muted">
            바코드 스캔 또는 수동 입력으로 책을 등록하고 읽기 상태를 관리합니다. 간단한 웹
            대시보드에서는 내 목록을 빠르게 확인하고 수정할 수 있습니다.
          </p>
          <div className="stack">
            <div className="featureCard">
              <span className="tag">Step 1</span>
              책 등록: 바코드 스캔 또는 수동 입력
            </div>
            <div className="featureCard">
              <span className="tag">Step 2</span>
              상태 관리: unread / reading / completed
            </div>
            <div className="featureCard">
              <span className="tag">Step 3</span>
              기록 추가: 평점, 메모, 보유 여부
            </div>
          </div>
        </aside>
      </section>

      <section className="shell" style={{ paddingBottom: "4rem" }}>
        <h2 className="sectionTitle">왜 Bookfolio인가</h2>
        <div className="featureGrid">
          {features.map((feature) => (
            <article key={feature.title} className="featureCard">
              <h3>{feature.title}</h3>
              <p className="muted">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}


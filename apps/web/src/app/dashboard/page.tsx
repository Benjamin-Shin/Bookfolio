import Link from "next/link";
import { redirect } from "next/navigation";

import { listUserBooks } from "@/lib/books/repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const books = await listUserBooks({});

  return (
    <main className="shell dashboardLayout">
      <aside className="panel sidebar">
        <div className="eyebrow">My Library</div>
        <h2>{user.email}</h2>
        <p className="muted">개인 서재 목록, 상태 관리, 평점/메모를 이 공간에서 확인합니다.</p>
        <div className="stack">
          <Link href="/dashboard/books/new" className="button">
            책 추가하기
          </Link>
          <form action="/auth/signout" method="post">
            <button className="buttonGhost" type="submit">
              로그아웃
            </button>
          </form>
        </div>
      </aside>

      <section className="panel" style={{ padding: "1.5rem" }}>
        <div className="inlineActions" style={{ justifyContent: "space-between" }}>
          <div>
            <div className="eyebrow">Dashboard</div>
            <h1 style={{ marginTop: "0.4rem" }}>내 책장</h1>
          </div>
          <Link href="/dashboard/books/new" className="buttonGhost">
            수동 등록
          </Link>
        </div>

        {books.length === 0 ? (
          <div className="emptyState" style={{ marginTop: "1.5rem" }}>
            <h3>아직 등록한 책이 없습니다.</h3>
            <p className="muted">첫 번째 책을 추가해서 Bookfolio를 시작해보세요.</p>
          </div>
        ) : (
          <div className="bookGrid" style={{ marginTop: "1.5rem" }}>
            {books.map((book) => (
              <article key={book.id} className="bookCard">
                <div className="stack">
                  <div>
                    <span className="tag">{book.format}</span>
                    <span className="tag">{book.readingStatus}</span>
                  </div>
                  <div>
                    <h3>{book.title}</h3>
                    <p className="muted">{book.authors.join(", ") || "저자 미상"}</p>
                  </div>
                  <p className="muted">{book.memo || "아직 메모가 없습니다."}</p>
                  <Link href={`/dashboard/books/${book.id}`} className="buttonGhost">
                    상세/수정
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}


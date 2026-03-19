import Link from "next/link";
import { notFound } from "next/navigation";
import { BOOK_FORMATS, READING_STATUSES } from "@bookfolio/shared";

import { getUserBook } from "@/lib/books/repository";

export default async function BookDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = await getUserBook(id);

  if (!book) {
    notFound();
  }

  return (
    <main className="shell" style={{ padding: "2rem 0 4rem" }}>
      <section className="panel" style={{ padding: "2rem" }}>
        <div className="inlineActions" style={{ justifyContent: "space-between" }}>
          <div>
            <div className="eyebrow">Book Detail</div>
            <h1>{book.title}</h1>
            <p className="muted">{book.authors.join(", ")}</p>
          </div>
          <Link href="/dashboard" className="buttonGhost">
            목록으로
          </Link>
        </div>

        <form action={`/api/me/books/${book.id}`} method="post" className="stack" style={{ marginTop: "1.5rem" }}>
          <input type="hidden" name="_method" value="PATCH" />
          <label className="field">
            제목
            <input name="title" defaultValue={book.title} />
          </label>
          <label className="field">
            저자
            <input name="authorsCsv" defaultValue={book.authors.join(", ")} />
          </label>
          <label className="field">
            형식
            <select name="format" defaultValue={book.format}>
              {BOOK_FORMATS.map((format) => (
                <option key={format} value={format}>
                  {format}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            읽기 상태
            <select name="readingStatus" defaultValue={book.readingStatus}>
              {READING_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            평점
            <input type="number" name="rating" min={1} max={5} defaultValue={book.rating ?? ""} />
          </label>
          <label className="field">
            메모
            <textarea name="memo" rows={6} defaultValue={book.memo ?? ""} />
          </label>
          <div className="inlineActions">
            <button type="submit" className="button">
              수정 저장
            </button>
            <button type="submit" className="buttonGhost" name="_method" value="DELETE">
              삭제
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}


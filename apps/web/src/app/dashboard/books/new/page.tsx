import { BOOK_FORMATS, READING_STATUSES } from "@bookfolio/shared";

export default function NewBookPage() {
  return (
    <main className="shell" style={{ padding: "2rem 0 4rem" }}>
      <section className="panel" style={{ padding: "2rem" }}>
        <div className="eyebrow">Manual Entry</div>
        <h1>책 수동 등록</h1>
        <p className="muted">
          바코드 스캔은 모바일 앱이 담당하고, 웹에서는 수동 입력 중심의 관리 흐름을 제공합니다.
        </p>

        <form className="stack" action="/api/me/books" method="post" style={{ marginTop: "1.5rem" }}>
          <label className="field">
            제목
            <input name="title" required placeholder="책 제목" />
          </label>
          <label className="field">
            저자
            <input name="authorsCsv" required placeholder="예: 김영하, 한강" />
          </label>
          <label className="field">
            형식
            <select name="format" defaultValue={BOOK_FORMATS[0]}>
              {BOOK_FORMATS.map((format) => (
                <option key={format} value={format}>
                  {format}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            읽기 상태
            <select name="readingStatus" defaultValue={READING_STATUSES[0]}>
              {READING_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            평점
            <input type="number" name="rating" min={1} max={5} />
          </label>
          <label className="field">
            메모
            <textarea name="memo" rows={5} placeholder="나중에 다시 보고 싶은 포인트" />
          </label>
          <button type="submit" className="button">
            등록하기
          </button>
        </form>
      </section>
    </main>
  );
}


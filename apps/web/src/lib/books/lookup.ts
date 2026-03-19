import type { BookLookupResult } from "@bookfolio/shared";

export async function lookupBookByIsbn(isbn: string): Promise<BookLookupResult> {
  const normalized = isbn.replace(/[^0-9X]/gi, "");

  if (!normalized) {
    throw new Error("ISBN is required");
  }

  const response = await fetch(
    `https://openlibrary.org/isbn/${encodeURIComponent(normalized)}.json`,
    {
      headers: {
        "User-Agent": "Bookfolio/0.1 (MVP lookup)"
      },
      next: { revalidate: 3600 }
    }
  );

  if (!response.ok) {
    throw new Error("Book metadata lookup failed");
  }

  const data = (await response.json()) as {
    title?: string;
    publishers?: string[];
    publish_date?: string;
    subtitle?: string;
    by_statement?: string;
    covers?: number[];
  };

  const authors = data.by_statement
    ? data.by_statement
        .split(",")
        .map((author) => author.trim())
        .filter(Boolean)
    : [];

  return {
    isbn: normalized,
    title: data.title ?? "제목 미상",
    authors,
    publisher: data.publishers?.[0] ?? null,
    publishedDate: data.publish_date ?? null,
    coverUrl: data.covers?.[0]
      ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg`
      : null,
    description: data.subtitle ?? null,
    source: "openlibrary"
  };
}


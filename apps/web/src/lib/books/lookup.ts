import type { BookLookupResult } from "@bookfolio/shared";

export async function lookupBookByIsbn(isbn: string): Promise<BookLookupResult> {
  const normalized = isbn.replace(/[^0-9X]/gi, "");
  const certKey = process.env.NL_API_CERT_KEY;

  if (!normalized) {
    throw new Error("ISBN is required");
  }
  if (!certKey) {
    throw new Error("NL_API_CERT_KEY is not configured");
  }

  const searchParams = new URLSearchParams({
    cert_key: certKey,
    result_style: "json",
    page_no: "1",
    page_size: "1",
    isbn: normalized
  });
  const response = await fetch(`https://www.nl.go.kr/seoji/SearchApi.do?${searchParams.toString()}`, {
    next: { revalidate: 3600 }
  });

  if (!response.ok) {
    throw new Error("Book metadata lookup failed");
  }

  const data = (await response.json()) as Record<string, unknown>;
  const record = getFirstRecord(data);

  if (!record) {
    throw new Error("Book not found");
  }

  const authors = splitAuthors(record.AUTHOR);

  return {
    isbn: normalized,
    title: readString(record.TITLE) ?? "제목 미상",
    authors,
    publisher: readString(record.PUBLISHER),
    publishedDate: readString(record.PUBLISH_PREDATE),
    coverUrl: readString(record.TITLE_URL),
    description: readString(record.BOOK_SUMMARY_URL) ?? readString(record.BOOK_INTRODUCTION_URL),
    source: "nl.go.kr"
  };
}

type NlBookRecord = {
  TITLE?: unknown;
  AUTHOR?: unknown;
  PUBLISHER?: unknown;
  PUBLISH_PREDATE?: unknown;
  TITLE_URL?: unknown;
  BOOK_SUMMARY_URL?: unknown;
  BOOK_INTRODUCTION_URL?: unknown;
};

function getFirstRecord(payload: Record<string, unknown>): NlBookRecord | null {
  if (Array.isArray(payload.docs) && payload.docs.length > 0) {
    return asRecord(payload.docs[0]);
  }
  if (Array.isArray(payload.result) && payload.result.length > 0) {
    return asRecord(payload.result[0]);
  }

  const result = asRecord(payload.RESULT);
  if (result && Array.isArray(result.docs) && result.docs.length > 0) {
    return asRecord(result.docs[0]);
  }
  if (result && Array.isArray(result.result) && result.result.length > 0) {
    return asRecord(result.result[0]);
  }

  if (Array.isArray(payload)) {
    return asRecord(payload[0]);
  }

  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function splitAuthors(value: unknown): string[] {
  const authorText = readString(value);
  if (!authorText) {
    return [];
  }

  return authorText
    .split(/[;,]/)
    .map((author) => author.trim())
    .filter(Boolean);
}


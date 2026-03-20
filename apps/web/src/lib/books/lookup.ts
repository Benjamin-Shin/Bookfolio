import type { BookLookupResult } from "@bookfolio/shared";

/** ISBN만 남깁니다 (ISBN-10의 X 포함). */
export function normalizeIsbn(isbn: string): string {
  return isbn.replace(/[^0-9X]/gi, "");
}

/**
 * 국립중앙도서관 → 네이버 책검색 → Google Books 순으로 시도합니다.
 * 환경 변수가 없는 제공자는 건너뛰고, 설정된 제공자만 순서대로 호출합니다.
 */
export async function lookupBookByIsbn(isbn: string): Promise<BookLookupResult> {
  const normalized = normalizeIsbn(isbn);
  if (!normalized) {
    throw new Error("ISBN is required");
  }

  const nlKey = process.env.NL_API_CERT_KEY?.trim();
  const naverId = process.env.NAVER_API_CLIENT_ID?.trim();
  const naverSecret = process.env.NAVER_API_CLIENT_SECRET?.trim();
  const googleKey = process.env.GOOGLE_BOOKS_API_KEY?.trim();

  const hasAnyProvider = Boolean(nlKey || (naverId && naverSecret) || googleKey);
  if (!hasAnyProvider) {
    throw new Error(
      "ISBN 조회를 위해 NL_API_CERT_KEY, NAVER_API_CLIENT_ID·NAVER_API_CLIENT_SECRET, GOOGLE_BOOKS_API_KEY 중 하나 이상을 설정해 주세요."
    );
  }

  let lastMessage: string | null = null;

  if (nlKey) {
    try {
      return await lookupNationalLibrary(normalized, nlKey);
    } catch (e) {
      lastMessage = e instanceof Error ? e.message : "국립중앙도서관 조회 실패";
    }
  }

  if (naverId && naverSecret) {
    try {
      return await lookupNaver(normalized, naverId, naverSecret);
    } catch (e) {
      lastMessage = e instanceof Error ? e.message : "네이버 조회 실패";
    }
  }

  if (googleKey) {
    try {
      return await lookupGoogleBooks(normalized, googleKey);
    } catch (e) {
      lastMessage = e instanceof Error ? e.message : "Google Books 조회 실패";
    }
  }

  throw new Error(lastMessage ?? "도서를 찾지 못했습니다.");
}

async function lookupNationalLibrary(normalized: string, certKey: string): Promise<BookLookupResult> {
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
    throw new Error("국립중앙도서관 API 요청이 실패했습니다.");
  }

  const data = (await response.json()) as Record<string, unknown>;
  const record = getNlFirstRecord(data);

  if (!record) {
    throw new Error("국립중앙도서관에서 책을 찾지 못했습니다.");
  }

  const authors = splitAuthors(record.AUTHOR);

  return {
    isbn: normalized,
    title: readString(record.TITLE) ?? "제목 미상",
    authors,
    publisher: readString(record.PUBLISHER),
    publishedDate: readString(record.PUBLISH_PREDATE),
    coverUrl: ensureHttpsUrl(readString(record.TITLE_URL)),
    description: readString(record.BOOK_SUMMARY_URL) ?? readString(record.BOOK_INTRODUCTION_URL),
    priceKrw: nlPriceKrwFromRecord(record),
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

function getNlFirstRecord(payload: Record<string, unknown>): NlBookRecord | null {
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

type NaverBookItem = {
  title?: string;
  author?: string;
  publisher?: string;
  pubdate?: string;
  isbn?: string;
  description?: string;
  image?: string;
  /** 정가(원). JSON에서 문자열로 올 수 있음. */
  price?: string | number;
  /** 판매가(원). */
  discount?: string | number;
};

async function lookupNaver(
  normalized: string,
  clientId: string,
  clientSecret: string
): Promise<BookLookupResult> {
  const url = new URL("https://openapi.naver.com/v1/search/book.json");
  url.searchParams.set("query", normalized);
  url.searchParams.set("display", "10");
  url.searchParams.set("sort", "sim");

  const response = await fetch(url.toString(), {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret
    },
    next: { revalidate: 3600 }
  });

  if (!response.ok) {
    throw new Error("네이버 책 검색 API 요청이 실패했습니다.");
  }

  const data = (await response.json()) as { items?: NaverBookItem[] };
  const items = data.items;
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("네이버에서 책을 찾지 못했습니다.");
  }

  const matched =
    items.find((item) => isbnFieldMatches(item.isbn, normalized)) ?? items[0];

  const titleRaw = matched.title ?? "";
  const title = stripHtml(titleRaw) || "제목 미상";
  const authors = splitAuthorString(stripHtml(matched.author ?? ""));
  const description = stripHtml(matched.description ?? "") || null;

  return {
    isbn: normalized,
    title,
    authors,
    publisher: matched.publisher?.trim() || null,
    publishedDate: formatNaverPubdate(matched.pubdate?.trim() ?? null),
    coverUrl: ensureHttpsUrl(matched.image?.trim() || null),
    description,
    priceKrw: naverPriceKrw(matched),
    source: "naver"
  };
}

type GoogleSaleInfo = {
  listPrice?: { amount?: number; currencyCode?: string };
  retailPrice?: { amount?: number; currencyCode?: string };
};

type GoogleVolume = {
  volumeInfo?: {
    title?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    industryIdentifiers?: { type?: string; identifier?: string }[];
    imageLinks?: { smallThumbnail?: string; thumbnail?: string };
  };
  saleInfo?: GoogleSaleInfo;
};

async function lookupGoogleBooks(normalized: string, apiKey: string): Promise<BookLookupResult> {
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", `isbn:${normalized}`);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString(), { next: { revalidate: 3600 } });

  if (!response.ok) {
    throw new Error("Google Books API 요청이 실패했습니다.");
  }

  const data = (await response.json()) as { items?: GoogleVolume[]; totalItems?: number };
  const items = data.items;
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Google Books에서 책을 찾지 못했습니다.");
  }

  const picked = pickGoogleVolumeMatchingIsbn(items, normalized) ?? items[0];
  const volumeInfo = picked?.volumeInfo;
  if (!volumeInfo) {
    throw new Error("Google Books에서 책을 찾지 못했습니다.");
  }

  const title = volumeInfo.title?.trim() || "제목 미상";
  const authors = Array.isArray(volumeInfo.authors)
    ? volumeInfo.authors.map((a) => a.trim()).filter(Boolean)
    : [];
  const thumb =
    volumeInfo.imageLinks?.thumbnail ?? volumeInfo.imageLinks?.smallThumbnail ?? null;

  return {
    isbn: normalized,
    title,
    authors,
    publisher: volumeInfo.publisher?.trim() || null,
    publishedDate: volumeInfo.publishedDate?.trim() || null,
    coverUrl: ensureHttpsUrl(thumb),
    description: volumeInfo.description?.trim() || null,
    priceKrw: googleBooksPriceKrw(picked?.saleInfo),
    source: "googlebooks"
  };
}

function pickGoogleVolumeMatchingIsbn(
  items: GoogleVolume[],
  normalized: string
): GoogleVolume | undefined {
  for (const item of items) {
    const ids = item.volumeInfo?.industryIdentifiers;
    if (!Array.isArray(ids)) continue;
    for (const id of ids) {
      const idStr = id.identifier?.trim();
      if (!idStr) continue;
      if (normalizeIsbn(idStr) === normalized) {
        return item;
      }
    }
  }
  return undefined;
}

function isbnFieldMatches(isbnField: string | undefined, normalized: string): boolean {
  if (!isbnField) return false;
  const compact = normalizeIsbn(isbnField);
  if (!compact) return false;
  if (compact === normalized) return true;
  if (compact.includes(normalized)) return true;
  if (normalized.includes(compact)) return true;
  return false;
}

function formatNaverPubdate(raw: string | null): string | null {
  if (!raw) return null;
  if (raw.length === 8 && /^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  }
  return raw;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

function splitAuthorString(text: string): string[] {
  if (!text) return [];
  return text
    .split(/[;,]/)
    .map((a) => a.trim())
    .filter(Boolean);
}

function ensureHttpsUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http://")) {
    return `https://${url.slice(7)}`;
  }
  if (url.startsWith("//")) {
    return `https:${url}`;
  }
  return url;
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

/** 숫자만 추출해 원 단위 양의 정수로 만듭니다. */
function parsePositiveKrw(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.min(Math.round(value), 2_000_000_000);
  }
  if (typeof value !== "string") {
    return null;
  }
  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return null;
  }
  const n = parseInt(digits, 10);
  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }
  return Math.min(n, 2_000_000_000);
}

function naverPriceKrw(item: NaverBookItem): number | null {
  const sale = parsePositiveKrw(item.discount);
  if (sale != null) {
    return sale;
  }
  return parsePositiveKrw(item.price);
}

function googleBooksPriceKrw(saleInfo: GoogleSaleInfo | undefined): number | null {
  if (!saleInfo || typeof saleInfo !== "object") {
    return null;
  }
  const r = saleInfo.retailPrice;
  if (r?.currencyCode === "KRW" && typeof r.amount === "number" && Number.isFinite(r.amount)) {
    return parsePositiveKrw(r.amount);
  }
  const l = saleInfo.listPrice;
  if (l?.currencyCode === "KRW" && typeof l.amount === "number" && Number.isFinite(l.amount)) {
    return parsePositiveKrw(l.amount);
  }
  return null;
}

const NL_PRICE_KEYS = ["PRICE", "PRICES", "SALE_PRICE", "REAL_PRICE", "BOOK_PRICE", "RETAIL_PRICE"] as const;

function nlPriceKrwFromRecord(record: NlBookRecord): number | null {
  const wide = record as Record<string, unknown>;
  for (const key of NL_PRICE_KEYS) {
    const n = parsePositiveKrw(wide[key]);
    if (n != null) {
      return n;
    }
  }
  return null;
}

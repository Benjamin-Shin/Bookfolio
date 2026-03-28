import type { BookLookupResult } from "@bookfolio/shared";

/** ISBN 외부 조회 시 단일 제공자만 강제할 때 사용합니다. */
export type IsbnLookupExternalProvider = "naver" | "nl";

/** ISBN만 남깁니다 (ISBN-10의 X 포함). */
export function normalizeIsbn(isbn: string): string {
  return isbn.replace(/[^0-9X]/gi, "");
}

/**
 * ISBN-10(마지막 자리 X 가능)을 ISBN-13(EAN-13)으로 바꿉니다. 잘못된 길이면 빈 문자열.
 *
 * @history
 * - 2026-03-26: 관리자 알라딘 목록과 `books.isbn` 매칭(10·13 혼용 대비)
 */
export function isbn10ToIsbn13(isbn10: string): string {
  const n = normalizeIsbn(isbn10).replace(/x/gi, "X");
  if (n.length !== 10) return "";
  const core = n.slice(0, 9);
  if (!/^\d{9}$/.test(core)) return "";
  const last = n[9]!;
  if (last !== "X" && !/^\d$/.test(last)) return "";
  const prefix = `978${core}`;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(prefix[i]!, 10) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return `${prefix}${check}`;
}

/**
 * `978` 접두 EAN-13을 ISBN-10으로 바꿉니다. `979` 등은 미지원 → 빈 문자열.
 *
 * @history
 * - 2026-03-26: DB에 ISBN-10만 있는 행과 알라딘 ISBN-13 매칭
 */
export function isbn13ToIsbn10(isbn13: string): string {
  const n = normalizeIsbn(isbn13);
  if (n.length !== 13 || !n.startsWith("978") || !/^\d{13}$/.test(n)) return "";
  const nine = n.slice(3, 12);
  if (!/^\d{9}$/.test(nine)) return "";
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(nine[i]!, 10) * (10 - i);
  }
  const check = (11 - (sum % 11)) % 11;
  return nine + (check === 10 ? "X" : String(check));
}

/**
 * `books.isbn`에 저장될 수 있는 표기(10·13·상호 변환) 후보를 모읍니다.
 *
 * @history
 * - 2026-03-26: 알라딘 피드 항목 vs 기등록 서지 중복 제거
 */
export function expandNormalizedIsbnForDbLookup(normalized: string): string[] {
  const n = normalizeIsbn(normalized).replace(/x/gi, "X");
  if (!n) return [];
  const out = new Set<string>([n]);
  if (n.length === 10) {
    const u = isbn10ToIsbn13(n);
    if (u) out.add(u);
  } else if (n.length === 13 && n.startsWith("978")) {
    const t = isbn13ToIsbn10(n);
    if (t) out.add(t);
  }
  return [...out];
}

/**
 * 제목(또는 키워드)으로 외부 메타만 검색합니다. 네이버 책검색 후 국립중앙도서관 `SearchApi.do`의 `title` 조건을 시도합니다.
 * `books` 테이블은 호출 측(예: API 라우트)에서 먼저 조회한 뒤, 이 결과와 합치면 됩니다.
 *
 * @history
 * - 2026-03-24: 우선순위를 네이버 → 국립중앙도서관으로 조정; Google Books 제목 폴백 제거
 * - 2026-03-24: 모바일·API용 제목 검색 추가 (당시 네이버 → Google 폴백)
 */
export async function searchBooksByTitleFromExternalApis(rawQuery: string): Promise<BookLookupResult[]> {
  const query = rawQuery.trim();
  if (!query) {
    throw new Error("검색어가 필요합니다.");
  }

  const naverId = process.env.NAVER_API_CLIENT_ID?.trim();
  const naverSecret = process.env.NAVER_API_CLIENT_SECRET?.trim();
  const nlKey = process.env.NL_API_CERT_KEY?.trim();

  if (!(naverId && naverSecret) && !nlKey) {
    return [];
  }

  let lastMessage: string | null = null;
  const ordered: BookLookupResult[] = [];

  if (naverId && naverSecret) {
    try {
      ordered.push(...(await fetchNaverBookSearch(query, naverId, naverSecret, 20)));
    } catch (e) {
      lastMessage = e instanceof Error ? e.message : "네이버 제목 검색 실패";
    }
  }

  if (nlKey) {
    try {
      ordered.push(...(await searchNationalLibraryByTitle(query, nlKey)));
    } catch (e) {
      lastMessage = e instanceof Error ? e.message : "국립중앙도서관 제목 검색 실패";
    }
  }

  if (ordered.length === 0) {
    throw new Error(
      lastMessage ??
        "외부에서 도서를 찾지 못했습니다. NAVER_API_CLIENT_ID·NAVER_API_CLIENT_SECRET 또는 NL_API_CERT_KEY를 확인해 주세요."
    );
  }

  return dedupeLookupByIsbn(ordered);
}

/**
 * 네이버 책검색 → 국립중앙도서관 순으로 시도합니다.
 * 환경 변수가 없는 제공자는 건너뛰고, 설정된 제공자만 순서대로 호출합니다.
 *
 * @history
 * - 2026-03-28: Google Books API 폴백 제거(도입 예정 없음).
 * - 2026-03-24: `provider` 옵션으로 단일 제공자(네이버·국립)만 조회 가능 (관리자 UI 분리용)
 * - 2026-03-24: 외부 제공자 순서를 네이버 → 국립중앙도서관으로 변경
 * - 2026-03-24: 네이버 ISBN 조회를 공통 매핑·원시 검색 헬퍼로 정리 (동작 동일)
 * - 2026-03-26: 국립 응답에서 `pageCount` 매핑 (`BookLookupResult`)
 */
export async function lookupBookByIsbn(
  isbn: string,
  options?: { provider?: IsbnLookupExternalProvider }
): Promise<BookLookupResult> {
  const normalized = normalizeIsbn(isbn);
  if (!normalized) {
    throw new Error("ISBN is required");
  }

  const naverId = process.env.NAVER_API_CLIENT_ID?.trim();
  const naverSecret = process.env.NAVER_API_CLIENT_SECRET?.trim();
  const nlKey = process.env.NL_API_CERT_KEY?.trim();

  if (options?.provider) {
    return lookupBookByIsbnSingleProvider(normalized, options.provider, {
      naverId,
      naverSecret,
      nlKey
    });
  }

  const hasAnyProvider = Boolean((naverId && naverSecret) || nlKey);
  if (!hasAnyProvider) {
    throw new Error(
      "ISBN 조회를 위해 NAVER_API_CLIENT_ID·NAVER_API_CLIENT_SECRET 또는 NL_API_CERT_KEY를 설정해 주세요."
    );
  }

  let lastMessage: string | null = null;

  if (naverId && naverSecret) {
    try {
      return await lookupNaver(normalized, naverId, naverSecret);
    } catch (e) {
      lastMessage = e instanceof Error ? e.message : "네이버 조회 실패";
    }
  }

  if (nlKey) {
    try {
      return await lookupNationalLibrary(normalized, nlKey);
    } catch (e) {
      lastMessage = e instanceof Error ? e.message : "국립중앙도서관 조회 실패";
    }
  }

  throw new Error(lastMessage ?? "도서를 찾지 못했습니다.");
}

type LookupEnvSnapshot = {
  naverId: string | undefined;
  naverSecret: string | undefined;
  nlKey: string | undefined;
};

/**
 * 지정한 외부 제공자 하나만 호출합니다 (폴백 없음).
 *
 * @history
 * - 2026-03-24: 관리자 ISBN 검색 버튼(네이버 / 국립) 분리용으로 추가
 */
async function lookupBookByIsbnSingleProvider(
  normalized: string,
  provider: IsbnLookupExternalProvider,
  env: LookupEnvSnapshot
): Promise<BookLookupResult> {
  switch (provider) {
    case "naver":
      if (!env.naverId || !env.naverSecret) {
        throw new Error("네이버 책 검색 API(NAVER_API_CLIENT_ID·NAVER_API_CLIENT_SECRET)가 설정되지 않았습니다.");
      }
      return await lookupNaver(normalized, env.naverId, env.naverSecret);
    case "nl":
      if (!env.nlKey) {
        throw new Error("국립중앙도서관 API(NL_API_CERT_KEY)가 설정되지 않았습니다.");
      }
      return await lookupNationalLibrary(normalized, env.nlKey);
    default: {
      const _exhaustive: never = provider;
      throw new Error(`지원하지 않는 제공자입니다: ${String(_exhaustive)}`);
    }
  }
}

async function lookupNationalLibrary(normalized: string, certKey: string): Promise<BookLookupResult> {
  const searchParams = new URLSearchParams({
    cert_key: certKey,
    result_style: "json",
    page_no: "1",
    page_size: "1",
    isbn: normalized
  });
  const data = await fetchNationalLibraryJson(searchParams);
  const record = getNlFirstRecord(data);

  if (!record) {
    throw new Error("국립중앙도서관에서 책을 찾지 못했습니다.");
  }

  const mapped = nlBookRecordToLookup(record, normalized);
  if (!mapped) {
    throw new Error("국립중앙도서관에서 책을 찾지 못했습니다.");
  }
  return mapped;
}

/**
 * 국립중앙도서관 ISBN 서지 `title` 파라미터로 목록을 가져옵니다.
 *
 * @history
 * - 2026-03-24: 제목 검색 3순위 제공자용
 */
async function searchNationalLibraryByTitle(titleQuery: string, certKey: string): Promise<BookLookupResult[]> {
  const searchParams = new URLSearchParams({
    cert_key: certKey,
    result_style: "json",
    page_no: "1",
    page_size: "20",
    title: titleQuery.trim()
  });
  const data = await fetchNationalLibraryJson(searchParams);
  const records = getNlDocRecords(data);
  const out: BookLookupResult[] = [];
  for (const record of records) {
    const row = nlBookRecordToLookup(record);
    if (row) {
      out.push(row);
    }
  }
  return out;
}

async function fetchNationalLibraryJson(searchParams: URLSearchParams): Promise<Record<string, unknown>> {
  const response = await fetch(`https://www.nl.go.kr/seoji/SearchApi.do?${searchParams.toString()}`, {
    next: { revalidate: 3600 }
  });

  if (!response.ok) {
    throw new Error("국립중앙도서관 API 요청이 실패했습니다.");
  }

  return (await response.json()) as Record<string, unknown>;
}

type NlBookRecord = {
  TITLE?: unknown;
  title?: unknown;
  AUTHOR?: unknown;
  PUBLISHER?: unknown;
  PUBLISH_PREDATE?: unknown;
  TITLE_URL?: unknown;
  BOOK_SUMMARY_URL?: unknown;
  BOOK_INTRODUCTION_URL?: unknown;
  EA_ISBN?: unknown;
  ISBN?: unknown;
  ea_isbn?: unknown;
  isbn?: unknown;
};

function clampPageCount(n: number): number | null {
  if (!Number.isFinite(n) || n < 1) {
    return null;
  }
  return Math.min(Math.floor(n), 50_000);
}

function parsePositivePageCountScalar(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return clampPageCount(value);
  }
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (/^\d{1,5}$/.test(trimmed)) {
    return clampPageCount(parseInt(trimmed, 10));
  }
  const m = trimmed.match(/(\d{1,5})\s*쪽/);
  if (m) {
    return clampPageCount(parseInt(m[1]!, 10));
  }
  return null;
}

/**
 * 국립 서지 레코드에서 총 페이지(쪽) 후보를 뽑습니다.
 *
 * @history
 * - 2026-03-26: `BookLookupResult.pageCount`·관리자 ISBN 조회용
 */
function nlPageCountFromRecord(record: NlBookRecord): number | null {
  const wide = record as Record<string, unknown>;
  const keys = ["PAGES", "PAGE", "BOOK_PAGE", "PAGE_CNT", "TOTAL_PAGE", "VOL", "BOOK_VOL"] as const;
  for (const k of keys) {
    const n = parsePositivePageCountScalar(wide[k]);
    if (n != null) {
      return n;
    }
  }
  return parsePositivePageCountScalar(wide["BOOK_SIZE"]);
}

function nlBookRecordToLookup(record: NlBookRecord, isbnExplicit?: string): BookLookupResult | null {
  const title = readString(record.TITLE) ?? readString(record.title);
  if (!title?.trim()) {
    return null;
  }

  let isbn = (isbnExplicit ?? "").trim();
  if (!isbn) {
    const rawIsbn =
      readString(record.EA_ISBN) ?? readString(record.ISBN) ?? readString(record.ea_isbn) ?? readString(record.isbn);
    isbn = rawIsbn ? normalizeIsbn(rawIsbn) : "";
  }

  const authors = splitAuthors(record.AUTHOR);
  const pageCount = nlPageCountFromRecord(record);

  return {
    isbn,
    title,
    authors,
    publisher: readString(record.PUBLISHER),
    publishedDate: readString(record.PUBLISH_PREDATE),
    coverUrl: ensureHttpsUrl(readString(record.TITLE_URL)),
    description: readString(record.BOOK_SUMMARY_URL) ?? readString(record.BOOK_INTRODUCTION_URL),
    priceKrw: nlPriceKrwFromRecord(record),
    source: "nl.go.kr",
    ...(pageCount != null ? { pageCount } : {})
  };
}

function getNlDocRecords(payload: Record<string, unknown>): NlBookRecord[] {
  const out: NlBookRecord[] = [];
  const pushAll = (arr: unknown) => {
    if (!Array.isArray(arr)) {
      return;
    }
    for (const item of arr) {
      const r = asRecord(item);
      if (r) {
        out.push(r as NlBookRecord);
      }
    }
  };

  pushAll(payload.docs);
  if (out.length > 0) {
    return out;
  }
  pushAll(payload.result);
  if (out.length > 0) {
    return out;
  }

  const result = asRecord(payload.RESULT);
  if (result) {
    pushAll(result.docs);
    if (out.length > 0) {
      return out;
    }
    pushAll(result.result);
    if (out.length > 0) {
      return out;
    }
  }

  if (Array.isArray(payload)) {
    pushAll(payload);
  }
  return out;
}

function getNlFirstRecord(payload: Record<string, unknown>): NlBookRecord | null {
  const all = getNlDocRecords(payload);
  return all[0] ?? null;
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

function naverBookItemToLookupResult(item: NaverBookItem, isbnForResult: string): BookLookupResult {
  const titleRaw = item.title ?? "";
  const title = stripHtml(titleRaw) || "제목 미상";
  const authors = splitAuthorString(stripHtml(item.author ?? ""));
  const description = stripHtml(item.description ?? "") || null;

  return {
    isbn: isbnForResult,
    title,
    authors,
    publisher: item.publisher?.trim() || null,
    publishedDate: formatNaverPubdate(item.pubdate?.trim() ?? null),
    coverUrl: ensureHttpsUrl(item.image?.trim() || null),
    description,
    priceKrw: naverPriceKrw(item),
    source: "naver"
  };
}

/** 네이버 `isbn` 필드(복수 ISBN 공백 구분)에서 우선 ISBN-13을 고릅니다. */
function pickBestIsbnFromNaverField(isbnField: string | undefined): string {
  if (!isbnField?.trim()) {
    return "";
  }
  const tokens = isbnField.split(/\s+/).map((t) => normalizeIsbn(t)).filter(Boolean);
  const isbn13 = tokens.find((t) => t.length === 13);
  if (isbn13) {
    return isbn13;
  }
  const isbn10 = tokens.find((t) => t.length === 10);
  return isbn10 ?? tokens[0] ?? "";
}

async function fetchNaverBookSearch(
  searchQuery: string,
  clientId: string,
  clientSecret: string,
  display: number
): Promise<BookLookupResult[]> {
  const items = await fetchNaverBookSearchRaw(searchQuery, clientId, clientSecret, display);
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }
  return items.map((item) => naverBookItemToLookupResult(item, pickBestIsbnFromNaverField(item.isbn)));
}

/** 동일 ISBN은 먼저 나온 항목을 유지합니다. */
export function dedupeLookupByIsbn(results: BookLookupResult[]): BookLookupResult[] {
  const seen = new Set<string>();
  const out: BookLookupResult[] = [];
  for (const r of results) {
    const i = r.isbn.trim();
    if (i) {
      if (seen.has(i)) {
        continue;
      }
      seen.add(i);
    }
    out.push(r);
  }
  return out;
}

async function lookupNaver(
  normalized: string,
  clientId: string,
  clientSecret: string
): Promise<BookLookupResult> {
  const items = await fetchNaverBookSearchRaw(normalized, clientId, clientSecret, 10);
  if (items.length === 0) {
    throw new Error("네이버에서 책을 찾지 못했습니다.");
  }

  const matched =
    items.find((item) => isbnFieldMatches(item.isbn, normalized)) ?? items[0];

  return naverBookItemToLookupResult(matched, normalized);
}

async function fetchNaverBookSearchRaw(
  searchQuery: string,
  clientId: string,
  clientSecret: string,
  display: number
): Promise<NaverBookItem[]> {
  const url = new URL("https://openapi.naver.com/v1/search/book.json");
  url.searchParams.set("query", searchQuery);
  url.searchParams.set("display", String(Math.min(Math.max(display, 1), 100)));
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
    return [];
  }
  return items;
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

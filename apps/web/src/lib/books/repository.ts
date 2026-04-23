import type {
  BookFormat,
  BookLookupResult,
  BooksQuery,
  CreateUserBookInput,
  UpdateUserBookInput,
  UserBookDetail,
  UserBookSummary,
} from "@bookfolio/shared";

import { auth } from "@/auth";
import { normalizeCoverUrlForClient } from "@/lib/books/cover-url";
import { normalizeIsbn } from "@/lib/books/lookup";
import { replaceBookAuthorLinks } from "@/lib/books/replace-book-author-links";
import { tryRecordDailyActivityCheckIn } from "@/lib/points/daily-check-in";
import { awardPointsUserBookRegister } from "@/lib/points/award-points";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/** RPC `list_user_books_paged`가 반환하는 평탄화 행 (books 조인 결과). */
type DbUserBook = {
  id: string;
  user_id: string;
  book_id: string;
  isbn: string | null;
  title: string;
  authors: string[];
  format: UserBookSummary["format"];
  reading_status: UserBookSummary["readingStatus"];
  rating: number | null;
  cover_url: string | null;
  publisher: string | null;
  published_date: string | null;
  description: string | null;
  price_krw: number | null;
  /** `0030` RPC — `books.page_count` */
  book_page_count?: number | null;
  current_page?: number | null;
  reading_total_pages?: number | null;
  /** 마이그레이션 0015 이전 RPC는 생략될 수 있음. */
  genre_slugs?: string[];
  is_owned: boolean;
  location: string | null;
  created_at: string;
  updated_at: string;
};

type DbUserBookOwner = {
  id: string;
  user_id: string;
  book_id: string;
  reading_status: string;
  rating: number | null;
  current_page?: number | null;
  reading_total_pages?: number | null;
  is_owned: boolean;
  location: string | null;
  created_at: string;
  updated_at: string;
};

type DbUserBookNestedSelect = DbUserBookOwner & {
  books: DbCanonicalBook | DbCanonicalBook[] | null;
};

/**
 * `books` 테이블 행 (조회·조인용).
 *
 * @history
 * - 2026-03-26: `format` — 캐논 서지(`books`) 소유; `user_books.format` 제거(0021)
 * - 2026-03-24: `translators`, `api_source` 필드 추가 (0013 마이그레이션)
 */
export type DbCanonicalBook = {
  id: string;
  isbn: string | null;
  title: string;
  authors: string[];
  /** 매체 구분. 0021 이전 DB에는 없을 수 있음(기본 `paper`로 취급). */
  format?: BookFormat;
  /** 옮긴이 (서지). 마이그레이션 0013 이전 DB는 없을 수 있음. */
  translators?: string[];
  publisher: string | null;
  published_date: string | null;
  cover_url: string | null;
  description: string | null;
  price_krw: number | null;
  /** 서지 총 쪽수 (`0020`). */
  page_count?: number | null;
  source: string;
  /** 외부 메타 조회 API 식별. nullable. */
  api_source?: string | null;
  genre_slugs: string[];
  literature_region: string | null;
  original_language: string | null;
  created_at: string;
  updated_at: string;
};

export type RepositoryContext = {
  userId: string;
  useAdmin?: boolean;
};

function pickNestedBook(row: DbUserBookNestedSelect): DbCanonicalBook | null {
  const b = row.books;
  if (!b) {
    return null;
  }
  return Array.isArray(b) ? (b[0] ?? null) : b;
}

/**
 * RPC/조인 행을 클라이언트용 요약으로 변환합니다.
 *
 * @history
 * - 2026-04-06: `pageCount`·`currentPage`·`readingTotalPages` (`0030`)
 * - 2026-03-26: `bookId`를 항상 문자열로 직렬화(누락 시 빈 문자열) — 모바일에서 키 생략 시 잘못된 API URL 방지
 */
function mapFlatRow(row: DbUserBook): UserBookDetail {
  const genreSlugs = Array.isArray(row.genre_slugs) ? row.genre_slugs : [];
  const pageCount =
    row.book_page_count != null && Number.isFinite(Number(row.book_page_count))
      ? Math.floor(Number(row.book_page_count))
      : null;
  return {
    id: row.id,
    userId: row.user_id,
    bookId: row.book_id ?? "",
    isbn: row.isbn,
    title: row.title,
    authors: Array.isArray(row.authors) ? row.authors : [],
    format: row.format,
    readingStatus: row.reading_status,
    rating: row.rating,
    coverUrl: normalizeCoverUrlForClient(row.cover_url),
    publisher: row.publisher,
    publishedDate: row.published_date,
    description: row.description,
    priceKrw: row.price_krw,
    pageCount,
    currentPage:
      row.current_page != null && Number.isFinite(Number(row.current_page))
        ? Math.floor(Number(row.current_page))
        : null,
    readingTotalPages:
      row.reading_total_pages != null &&
      Number.isFinite(Number(row.reading_total_pages))
        ? Math.floor(Number(row.reading_total_pages))
        : null,
    isOwned: row.is_owned,
    location: row.location ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    genreSlugs: genreSlugs.length > 0 ? genreSlugs : undefined,
  };
}

function mapJoinedRow(row: DbUserBookNestedSelect): UserBookDetail {
  const book = pickNestedBook(row);
  if (!book) {
    throw new Error("연결된 도서 정보(books)를 찾을 수 없습니다.");
  }
  const flat: DbUserBook = {
    id: row.id,
    user_id: row.user_id,
    book_id: row.book_id,
    isbn: book.isbn,
    title: book.title,
    authors: book.authors,
    format: (book.format ?? "paper") as DbUserBook["format"],
    reading_status: row.reading_status as DbUserBook["reading_status"],
    rating: row.rating,
    cover_url: book.cover_url,
    publisher: book.publisher,
    published_date: book.published_date,
    description: book.description,
    price_krw: book.price_krw,
    book_page_count: book.page_count ?? null,
    current_page: row.current_page ?? null,
    reading_total_pages: row.reading_total_pages ?? null,
    is_owned: row.is_owned,
    location: row.location,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
  return {
    ...mapFlatRow(flat),
    catalogSource: book.source,
    genreSlugs: Array.isArray(book.genre_slugs) ? book.genre_slugs : [],
    literatureRegion: book.literature_region ?? null,
    originalLanguage: book.original_language ?? null,
  };
}

async function requireUserId() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("Unauthorized");
  }

  return { supabase: createSupabaseAdminClient(), userId };
}

async function getClientAndUser(context?: RepositoryContext) {
  if (context) {
    return {
      supabase: createSupabaseAdminClient(),
      userId: context.userId,
    };
  }

  return requireUserId();
}

const USER_BOOK_WITH_BOOKS_SELECT = `
  id,
  user_id,
  book_id,
  reading_status,
  rating,
  current_page,
  reading_total_pages,
  is_owned,
  location,
  created_at,
  updated_at,
  books!inner (
    id,
    isbn,
    title,
    authors,
    format,
    publisher,
    published_date,
    cover_url,
    description,
    price_krw,
    page_count,
    source,
    genre_slugs,
    literature_region,
    original_language,
    created_at,
    updated_at
  )
`;

export async function findCanonicalBookByIsbn(
  supabase: SupabaseClient,
  normalizedIsbn: string,
): Promise<DbCanonicalBook | null> {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("isbn", normalizedIsbn)
    .maybeSingle();

  if (error) throw error;
  return data as DbCanonicalBook | null;
}

/**
 * 공유 서지 `books` 행을 제목 메타 검색 API 응답 형태로 변환합니다.
 *
 * @history
 * - 2026-03-24: lookup-by-isbn 라우트와 제목 검색에서 공통 사용; 제목 검색 시 ISBN 없는 행은 `requireIsbn: false`
 */
export function mapCanonicalBookToLookupResult(
  row: DbCanonicalBook,
  opts?: { requireIsbn?: boolean },
): BookLookupResult | null {
  const requireIsbn = opts?.requireIsbn !== false;
  const isbn = row.isbn?.trim() ?? "";
  if (requireIsbn && !isbn) {
    return null;
  }

  const genreSlugs = Array.isArray(row.genre_slugs) ? row.genre_slugs : [];

  return {
    isbn,
    title: row.title,
    authors: Array.isArray(row.authors) ? row.authors : [],
    publisher: row.publisher,
    publishedDate: row.published_date,
    coverUrl: row.cover_url,
    description: row.description,
    priceKrw: row.price_krw ?? null,
    source: "catalog",
    genreSlugs: genreSlugs.length > 0 ? genreSlugs : undefined,
    literatureRegion: row.literature_region ?? null,
    originalLanguage: row.original_language ?? null,
  };
}

/**
 * `books.title` 부분 일치(대소문자 무시)로 공유 서지를 찾습니다. API 제목 검색의 1순위 소스입니다.
 *
 * @history
 * - 2026-03-24: 제목 검색 시 카탈로그 우선 반영
 */
export async function searchCanonicalBooksByTitle(
  supabase: SupabaseClient,
  rawQuery: string,
  limit = 20,
): Promise<BookLookupResult[]> {
  const q = rawQuery.trim();
  if (!q) {
    return [];
  }
  const safe = q.replace(/[%_]/g, " ").trim();
  if (!safe) {
    return [];
  }

  const { data, error } = await supabase
    .from("books")
    .select("*")
    .ilike("title", `%${safe}%`)
    .limit(Math.min(Math.max(limit, 1), 50));

  if (error) throw error;
  const rows = (data ?? []) as DbCanonicalBook[];
  const out: BookLookupResult[] = [];
  for (const row of rows) {
    const mapped = mapCanonicalBookToLookupResult(row, { requireIsbn: false });
    if (mapped) {
      out.push(mapped);
    }
  }
  return out;
}

/**
 * 공유 서지 `books` 행을 삽입하고 `book_authors`·`books.authors` 를 맞춥니다.
 *
 * @history
 * - 2026-03-24: `authors` text[] 는 RPC `replace_book_author_links` 로만 반영
 */
async function insertCanonicalBook(
  supabase: SupabaseClient,
  row: {
    isbn: string | null;
    title: string;
    authors: string[];
    publisher: string | null;
    published_date: string | null;
    cover_url: string | null;
    description: string | null;
    price_krw: number | null;
    source: string;
    format?: BookFormat;
  },
): Promise<DbCanonicalBook> {
  const { data, error } = await supabase
    .from("books")
    .insert({
      isbn: row.isbn,
      title: row.title,
      publisher: row.publisher,
      published_date: row.published_date,
      cover_url: row.cover_url,
      description: row.description,
      price_krw: row.price_krw,
      source: row.source,
      format: row.format ?? "paper",
    })
    .select("*")
    .single();

  if (error?.code === "23505" && row.isbn) {
    const again = await findCanonicalBookByIsbn(supabase, row.isbn);
    if (again) return again;
  }

  if (error) throw error;
  const inserted = data as DbCanonicalBook;
  await replaceBookAuthorLinks(supabase, inserted.id, row.authors);
  const { data: synced, error: syncErr } = await supabase
    .from("books")
    .select("*")
    .eq("id", inserted.id)
    .single();
  if (syncErr) throw syncErr;
  return synced as DbCanonicalBook;
}

/**
 * 공동서가 등 user_books 없이 `books` 행만 필요할 때 — ISBN·제목으로 카탈로그 행을 찾거나 만듭니다.
 */
export async function resolveCanonicalBookForSharedLibrary(
  supabase: SupabaseClient,
  input: Pick<
    CreateUserBookInput,
    | "isbn"
    | "title"
    | "authors"
    | "publisher"
    | "publishedDate"
    | "coverUrl"
    | "description"
    | "priceKrw"
    | "format"
  >,
): Promise<DbCanonicalBook> {
  const normalized = input.isbn ? normalizeIsbn(input.isbn) : "";
  const isbnValue = normalized.length > 0 ? normalized : null;

  if (isbnValue) {
    const found = await findCanonicalBookByIsbn(supabase, isbnValue);
    if (found) {
      const { error: upErr } = await supabase
        .from("books")
        .update({
          title: input.title,
          publisher: input.publisher ?? null,
          published_date: input.publishedDate ?? null,
          cover_url: input.coverUrl ?? found.cover_url,
          description: input.description ?? null,
          price_krw: input.priceKrw ?? found.price_krw,
          format: input.format ?? "paper",
        })
        .eq("id", found.id);
      if (upErr) throw upErr;
      await replaceBookAuthorLinks(supabase, found.id, input.authors);
      const { data: refreshed, error: refErr } = await supabase
        .from("books")
        .select("*")
        .eq("id", found.id)
        .single();
      if (refErr) throw refErr;
      return refreshed as DbCanonicalBook;
    }
    return insertCanonicalBook(supabase, {
      isbn: isbnValue,
      title: input.title,
      authors: input.authors,
      publisher: input.publisher ?? null,
      published_date: input.publishedDate ?? null,
      cover_url: input.coverUrl ?? null,
      description: input.description ?? null,
      price_krw: input.priceKrw ?? null,
      source: "manual",
      format: input.format ?? "paper",
    });
  }

  return insertCanonicalBook(supabase, {
    isbn: null,
    title: input.title,
    authors: input.authors,
    publisher: input.publisher ?? null,
    published_date: input.publishedDate ?? null,
    cover_url: input.coverUrl ?? null,
    description: input.description ?? null,
    price_krw: input.priceKrw ?? null,
    source: "manual",
    format: input.format ?? "paper",
  });
}

export type ListUserBooksPagedOptions = {
  search?: string;
  limit: number;
  offset: number;
  format?: BooksQuery["format"];
  readingStatus?: BooksQuery["readingStatus"];
  /** true/false로 소장만·비소장만. 생략 시 구분 없음. */
  isOwned?: boolean;
  /** `books.genre_slugs`에 포함된 슬러그로 한정 (0015 RPC). */
  genreSlug?: string;
  /** `title`: 제목순(RPC `p_sort`). 생략: `updated_at` 내림차순. */
  sort?: "title" | "updated";
  /** `true`면 완독·개인 평점 4+만 (`0038` `p_hall_of_fame`). */
  hallOfFameOnly?: boolean;
};

/**
 * `list_user_books_paged` RPC JSON 본문 파싱.
 *
 * @history
 * - 2026-03-24: 신규 — 문자열 JSON·total 키 누락 등 방어
 */
function parseListUserBooksPagedPayload(data: unknown): {
  rawItems: unknown[];
  total: number;
} {
  let raw: unknown = data;
  if (typeof data === "string") {
    try {
      raw = JSON.parse(data) as unknown;
    } catch {
      return { rawItems: [], total: 0 };
    }
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { rawItems: [], total: 0 };
  }
  const o = raw as Record<string, unknown>;
  const itemsVal = o.items;
  const totalVal = o.total ?? o.Total;
  const rawItems = Array.isArray(itemsVal) ? itemsVal : [];
  const totalNum =
    typeof totalVal === "string"
      ? parseInt(totalVal, 10)
      : typeof totalVal === "number"
        ? totalVal
        : Number(totalVal ?? 0);
  return { rawItems, total: Number.isFinite(totalNum) ? totalNum : 0 };
}

/**
 * 사용자 도서 목록 페이지(RPC `list_user_books_paged`).
 *
 * @history
 * - 2026-04-12: `p_hall_of_fame` — 완독·평점 4+만 (`0038`, `hallOfFameOnly`일 때만 RPC에 전달)
 * - 2026-04-12: `p_sort`는 `sort==='title'`일 때만 RPC 인자에 포함(PostgREST가 `null` 키로 9인자 시그니처를 찾는 문제·`0037` 미적용 DB 호환)
 * - 2026-04-12: `p_sort`(`0037`) — 제목순·기본 수정일순
 * - 2026-04-06: RPC `0030` — `book_page_count`·`current_page`·`reading_total_pages`
 * - 2026-03-24: `p_genre_slug`·행 `genre_slugs` 반영(마이그레이션 0015)
 * - 2026-03-24: RPC JSON 응답 문자열·키 누락 등 방어적 파싱(`parseListUserBooksPagedPayload`)
 */
export async function listUserBooksPaged(
  opts: ListUserBooksPagedOptions,
  context?: RepositoryContext,
): Promise<{ items: UserBookSummary[]; total: number }> {
  const { supabase, userId } = await getClientAndUser(context);
  const genreTrim = opts.genreSlug?.trim();
  const { data, error } = await supabase.rpc("list_user_books_paged", {
    p_user_id: userId,
    p_search: opts.search?.trim() ? opts.search.trim() : null,
    p_limit: opts.limit,
    p_offset: opts.offset,
    p_format: opts.format && opts.format !== "all" ? opts.format : null,
    p_reading_status:
      opts.readingStatus && opts.readingStatus !== "all"
        ? opts.readingStatus
        : null,
    p_is_owned: typeof opts.isOwned === "boolean" ? opts.isOwned : null,
    p_genre_slug: genreTrim ? genreTrim : null,
    ...(opts.sort === "title" ? { p_sort: "title" as const } : {}),
    ...(opts.hallOfFameOnly ? { p_hall_of_fame: true as const } : {}),
  });

  if (error) throw error;

  const { rawItems, total } = parseListUserBooksPagedPayload(data);
  const items = rawItems.map((row) => mapFlatRow(row as DbUserBook));

  return { items, total };
}

export async function listUserBooks(
  query: BooksQuery,
  context?: RepositoryContext,
): Promise<UserBookSummary[]> {
  const { items } = await listUserBooksPaged(
    {
      search: query.search,
      limit: 50_000,
      offset: 0,
      format: query.format,
      readingStatus: query.readingStatus,
    },
    context,
  );
  return items;
}

export async function getUserBook(
  id: string,
  context?: RepositoryContext,
): Promise<UserBookDetail | null> {
  const { supabase, userId } = await getClientAndUser(context);
  const { data, error } = await supabase
    .from("user_books")
    .select(USER_BOOK_WITH_BOOKS_SELECT)
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    return null;
  }
  return mapJoinedRow(data as DbUserBookNestedSelect);
}

export async function getCanonicalBookById(
  bookId: string,
  context?: RepositoryContext,
): Promise<DbCanonicalBook | null> {
  const { supabase } = await getClientAndUser(context);
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .maybeSingle();

  if (error) throw error;
  return data as DbCanonicalBook | null;
}

/** 상세 화면용: 서지는 `getUserBook` 결과에 포함됩니다. */
export async function getUserBookWithCanonical(
  userBookId: string,
  context?: RepositoryContext,
): Promise<{ userBook: UserBookDetail } | null> {
  const userBook = await getUserBook(userBookId, context);
  if (!userBook) {
    return null;
  }
  return { userBook };
}

/** 같은 `books` 행이 이미 내 `user_books`에 있을 때 (ISBN 등으로 동일 서지 재추가). */
export class UserBookAlreadyInShelfError extends Error {
  readonly code = "USER_BOOK_ALREADY_EXISTS" as const;

  constructor(public readonly existingUserBookId: string) {
    super("이미 내 서가에 등록된 책입니다.");
    this.name = "UserBookAlreadyInShelfError";
  }
}

/**
 * 개인 서가에 도서를 등록합니다. 성공 시 `user_book_register` 포인트 규칙이 있으면 원장에 반영합니다.
 *
 * @history
 * - 2026-03-26: `user_book_register` 포인트 지급 연동
 */
export async function createUserBook(
  input: CreateUserBookInput,
  context?: RepositoryContext,
): Promise<UserBookDetail> {
  const { supabase, userId } = await getClientAndUser(context);

  const normalized = input.isbn ? normalizeIsbn(input.isbn) : "";
  const isbnValue = normalized.length > 0 ? normalized : null;

  let canonical: DbCanonicalBook;

  if (isbnValue) {
    const found = await findCanonicalBookByIsbn(supabase, isbnValue);
    if (found) {
      const { error: upErr } = await supabase
        .from("books")
        .update({
          title: input.title,
          publisher: input.publisher ?? null,
          published_date: input.publishedDate ?? null,
          cover_url: input.coverUrl ?? found.cover_url,
          description: input.description ?? null,
          price_krw: input.priceKrw ?? found.price_krw,
          format: input.format,
        })
        .eq("id", found.id);
      if (upErr) throw upErr;
      await replaceBookAuthorLinks(supabase, found.id, input.authors);
      const { data: refreshed, error: refErr } = await supabase
        .from("books")
        .select("*")
        .eq("id", found.id)
        .single();
      if (refErr) throw refErr;
      canonical = refreshed as DbCanonicalBook;
    } else {
      canonical = await insertCanonicalBook(supabase, {
        isbn: isbnValue,
        title: input.title,
        authors: input.authors,
        publisher: input.publisher ?? null,
        published_date: input.publishedDate ?? null,
        cover_url: input.coverUrl ?? null,
        description: input.description ?? null,
        price_krw: input.priceKrw ?? null,
        source: "manual",
        format: input.format,
      });
    }
  } else {
    canonical = await insertCanonicalBook(supabase, {
      isbn: null,
      title: input.title,
      authors: input.authors,
      publisher: input.publisher ?? null,
      published_date: input.publishedDate ?? null,
      cover_url: input.coverUrl ?? null,
      description: input.description ?? null,
      price_krw: input.priceKrw ?? null,
      source: "manual",
      format: input.format,
    });
  }

  const { data: existingRow, error: existingErr } = await supabase
    .from("user_books")
    .select("id")
    .eq("user_id", userId)
    .eq("book_id", canonical.id)
    .maybeSingle();

  if (existingErr) throw existingErr;
  if (existingRow?.id) {
    throw new UserBookAlreadyInShelfError(existingRow.id as string);
  }

  const loc = input.location?.trim();
  const payload = {
    user_id: userId,
    book_id: canonical.id,
    reading_status: input.readingStatus ?? "unread",
    rating: input.rating ?? null,
    is_owned: input.isOwned ?? true,
    location: loc ? loc : null,
    current_page:
      input.currentPage !== undefined && input.currentPage !== null
        ? Math.floor(Math.min(Math.max(0, input.currentPage), 50_000))
        : null,
    reading_total_pages:
      input.readingTotalPages !== undefined && input.readingTotalPages !== null
        ? Math.floor(Math.min(Math.max(1, input.readingTotalPages), 50_000))
        : null,
  };

  const { data: inserted, error } = await supabase
    .from("user_books")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw error;

  const detail = await getUserBook(inserted.id as string, context);
  if (!detail) {
    throw new Error("등록한 책을 다시 불러오지 못했습니다.");
  }

  try {
    await awardPointsUserBookRegister(userId, inserted.id as string);
  } catch (e) {
    console.error("awardPointsUserBookRegister", e);
  }

  try {
    await tryRecordDailyActivityCheckIn(supabase, userId);
  } catch (e) {
    console.error("tryRecordDailyActivityCheckIn", e);
  }

  return detail;
}

/**
 * @history
 * - 2026-04-06: `current_page`·`reading_total_pages` 갱신
 * - 2026-03-26: `user_books.memo` 제거 — 메모는 `user_book_memos`·API로 이관
 * - 2026-03-24: 공유 서지 저자 변경 시 `replaceBookAuthorLinks` 로 `book_authors` 동기화
 */
export async function updateUserBook(
  id: string,
  input: UpdateUserBookInput,
  context?: RepositoryContext,
): Promise<UserBookDetail> {
  const { supabase, userId } = await getClientAndUser(context);

  const { data: existing, error: fetchErr } = await supabase
    .from("user_books")
    .select("book_id")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (!existing?.book_id) {
    throw new Error("Not found");
  }

  const catalogPatch: Record<string, unknown> = {};
  if (input.title !== undefined) catalogPatch.title = input.title;
  if (input.coverUrl !== undefined) catalogPatch.cover_url = input.coverUrl;
  if (input.publisher !== undefined) catalogPatch.publisher = input.publisher;
  if (input.publishedDate !== undefined)
    catalogPatch.published_date = input.publishedDate;
  if (input.description !== undefined)
    catalogPatch.description = input.description;
  if (input.priceKrw !== undefined) catalogPatch.price_krw = input.priceKrw;
  if (input.format !== undefined) catalogPatch.format = input.format;

  if (Object.keys(catalogPatch).length > 0) {
    const { error: cErr } = await supabase
      .from("books")
      .update(catalogPatch)
      .eq("id", existing.book_id);
    if (cErr) throw cErr;
  }

  if (input.authors !== undefined) {
    await replaceBookAuthorLinks(
      supabase,
      existing.book_id as string,
      input.authors,
    );
  }

  const userPatch: Record<string, unknown> = {};
  if (input.readingStatus !== undefined)
    userPatch.reading_status = input.readingStatus;
  if (input.rating !== undefined) userPatch.rating = input.rating;
  if (input.isOwned !== undefined) userPatch.is_owned = input.isOwned;
  if (input.location !== undefined) userPatch.location = input.location;
  if (input.currentPage !== undefined) {
    userPatch.current_page =
      input.currentPage === null
        ? null
        : Math.floor(Math.min(Math.max(0, input.currentPage), 50_000));
  }
  if (input.readingTotalPages !== undefined) {
    userPatch.reading_total_pages =
      input.readingTotalPages === null
        ? null
        : Math.floor(Math.min(Math.max(1, input.readingTotalPages), 50_000));
  }

  if (Object.keys(userPatch).length > 0) {
    const { error: uErr } = await supabase
      .from("user_books")
      .update(userPatch)
      .eq("id", id)
      .eq("user_id", userId);
    if (uErr) throw uErr;
  }

  const detail = await getUserBook(id, context);
  if (!detail) {
    throw new Error("Not found");
  }
  return detail;
}

export async function deleteUserBook(
  id: string,
  context?: RepositoryContext,
): Promise<void> {
  const { supabase, userId } = await getClientAndUser(context);
  const { error } = await supabase
    .from("user_books")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export type UserOwnedBooksPriceStats = {
  totalKrw: number;
  pricedOwnedCount: number;
  ownedCount: number;
};

export async function getUserOwnedBooksPriceStats(
  context?: RepositoryContext,
): Promise<UserOwnedBooksPriceStats> {
  const { supabase, userId } = await getClientAndUser(context);
  const { data, error } = await supabase.rpc("user_owned_books_price_stats", {
    p_user_id: userId,
  });
  if (error) throw error;
  const row = data as {
    totalKrw?: string | number;
    pricedOwnedCount?: string | number;
    ownedCount?: string | number;
  };
  return {
    totalKrw: Number(row.totalKrw ?? 0),
    pricedOwnedCount: Number(row.pricedOwnedCount ?? 0),
    ownedCount: Number(row.ownedCount ?? 0),
  };
}

/**
 * 소장 도서(`is_owned`)에 붙은 `books.genre_slugs` 값을 모아 중복 제거·정렬한 목록.
 *
 * @history
 * - 2026-03-24: RPC `list_user_owned_genre_slugs` 연동(마이그레이션 0015)
 */
export async function listUserOwnedGenreSlugs(
  context?: RepositoryContext,
): Promise<string[]> {
  const { supabase, userId } = await getClientAndUser(context);
  const { data, error } = await supabase.rpc("list_user_owned_genre_slugs", {
    p_user_id: userId,
  });
  if (error) throw error;
  let raw: unknown = data;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw) as unknown;
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: string[] = [];
  for (const x of raw) {
    if (typeof x === "string" && x.trim()) {
      out.push(x.trim());
    }
  }
  return out;
}

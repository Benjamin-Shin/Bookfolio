import type {
  BooksQuery,
  CreateUserBookInput,
  UpdateUserBookInput,
  UserBookDetail,
  UserBookSummary
} from "@bookfolio/shared";

import { auth } from "@/auth";
import { normalizeCoverUrlForClient } from "@/lib/books/cover-url";
import { normalizeIsbn } from "@/lib/books/lookup";
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
  memo: string | null;
  cover_url: string | null;
  publisher: string | null;
  published_date: string | null;
  description: string | null;
  price_krw: number | null;
  is_owned: boolean;
  location: string | null;
  created_at: string;
  updated_at: string;
};

type DbUserBookOwner = {
  id: string;
  user_id: string;
  book_id: string;
  format: string;
  reading_status: string;
  rating: number | null;
  memo: string | null;
  is_owned: boolean;
  location: string | null;
  created_at: string;
  updated_at: string;
};

type DbUserBookNestedSelect = DbUserBookOwner & {
  books: DbCanonicalBook | DbCanonicalBook[] | null;
};

export type DbCanonicalBook = {
  id: string;
  isbn: string | null;
  title: string;
  authors: string[];
  publisher: string | null;
  published_date: string | null;
  cover_url: string | null;
  description: string | null;
  price_krw: number | null;
  source: string;
  genre_slugs: string[];
  literature_region: string | null;
  original_language: string | null;
  created_at: string;
  updated_at: string;
};

type RepositoryContext = {
  userId: string;
  useAdmin?: boolean;
};

function pickNestedBook(row: DbUserBookNestedSelect): DbCanonicalBook | null {
  const b = row.books;
  if (!b) {
    return null;
  }
  return Array.isArray(b) ? b[0] ?? null : b;
}

function mapFlatRow(row: DbUserBook): UserBookDetail {
  return {
    id: row.id,
    userId: row.user_id,
    bookId: row.book_id,
    isbn: row.isbn,
    title: row.title,
    authors: Array.isArray(row.authors) ? row.authors : [],
    format: row.format,
    readingStatus: row.reading_status,
    rating: row.rating,
    memo: row.memo,
    coverUrl: normalizeCoverUrlForClient(row.cover_url),
    publisher: row.publisher,
    publishedDate: row.published_date,
    description: row.description,
    priceKrw: row.price_krw,
    isOwned: row.is_owned,
    location: row.location ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
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
    format: row.format as DbUserBook["format"],
    reading_status: row.reading_status as DbUserBook["reading_status"],
    rating: row.rating,
    memo: row.memo,
    cover_url: book.cover_url,
    publisher: book.publisher,
    published_date: book.published_date,
    description: book.description,
    price_krw: book.price_krw,
    is_owned: row.is_owned,
    location: row.location,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
  return {
    ...mapFlatRow(flat),
    catalogSource: book.source,
    genreSlugs: Array.isArray(book.genre_slugs) ? book.genre_slugs : [],
    literatureRegion: book.literature_region ?? null,
    originalLanguage: book.original_language ?? null
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
      userId: context.userId
    };
  }

  return requireUserId();
}

const USER_BOOK_WITH_BOOKS_SELECT = `
  id,
  user_id,
  book_id,
  format,
  reading_status,
  rating,
  memo,
  is_owned,
  location,
  created_at,
  updated_at,
  books!inner (
    id,
    isbn,
    title,
    authors,
    publisher,
    published_date,
    cover_url,
    description,
    price_krw,
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
  normalizedIsbn: string
): Promise<DbCanonicalBook | null> {
  const { data, error } = await supabase.from("books").select("*").eq("isbn", normalizedIsbn).maybeSingle();

  if (error) throw error;
  return data as DbCanonicalBook | null;
}

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
  }
): Promise<DbCanonicalBook> {
  const { data, error } = await supabase
    .from("books")
    .insert({
      isbn: row.isbn,
      title: row.title,
      authors: row.authors,
      publisher: row.publisher,
      published_date: row.published_date,
      cover_url: row.cover_url,
      description: row.description,
      price_krw: row.price_krw,
      source: row.source
    })
    .select("*")
    .single();

  if (error?.code === "23505" && row.isbn) {
    const again = await findCanonicalBookByIsbn(supabase, row.isbn);
    if (again) return again;
  }

  if (error) throw error;
  return data as DbCanonicalBook;
}

export type ListUserBooksPagedOptions = {
  search?: string;
  limit: number;
  offset: number;
  format?: BooksQuery["format"];
  readingStatus?: BooksQuery["readingStatus"];
  /** true/false로 소장만·비소장만. 생략 시 구분 없음. */
  isOwned?: boolean;
};

export async function listUserBooksPaged(
  opts: ListUserBooksPagedOptions,
  context?: RepositoryContext
): Promise<{ items: UserBookSummary[]; total: number }> {
  const { supabase, userId } = await getClientAndUser(context);

  const { data, error } = await supabase.rpc("list_user_books_paged", {
    p_user_id: userId,
    p_search: opts.search?.trim() ? opts.search.trim() : null,
    p_limit: opts.limit,
    p_offset: opts.offset,
    p_format:
      opts.format && opts.format !== "all" ? opts.format : null,
    p_reading_status:
      opts.readingStatus && opts.readingStatus !== "all" ? opts.readingStatus : null,
    p_is_owned: typeof opts.isOwned === "boolean" ? opts.isOwned : null
  });

  if (error) throw error;

  const body = data as { items: DbUserBook[] | null; total: number | string | null };
  const rawItems = Array.isArray(body.items) ? body.items : [];
  const items = rawItems.map((row) => mapFlatRow(row as DbUserBook));
  const total = typeof body.total === "string" ? parseInt(body.total, 10) : Number(body.total ?? 0);

  return { items, total: Number.isFinite(total) ? total : 0 };
}

export async function listUserBooks(
  query: BooksQuery,
  context?: RepositoryContext
): Promise<UserBookSummary[]> {
  const { items } = await listUserBooksPaged(
    {
      search: query.search,
      limit: 50_000,
      offset: 0,
      format: query.format,
      readingStatus: query.readingStatus
    },
    context
  );
  return items;
}

export async function getUserBook(
  id: string,
  context?: RepositoryContext
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
  context?: RepositoryContext
): Promise<DbCanonicalBook | null> {
  const { supabase } = await getClientAndUser(context);
  const { data, error } = await supabase.from("books").select("*").eq("id", bookId).maybeSingle();

  if (error) throw error;
  return data as DbCanonicalBook | null;
}

/** 상세 화면용: 서지는 `getUserBook` 결과에 포함됩니다. */
export async function getUserBookWithCanonical(
  userBookId: string,
  context?: RepositoryContext
): Promise<{ userBook: UserBookDetail } | null> {
  const userBook = await getUserBook(userBookId, context);
  if (!userBook) {
    return null;
  }
  return { userBook };
}

export async function createUserBook(
  input: CreateUserBookInput,
  context?: RepositoryContext
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
          authors: input.authors,
          publisher: input.publisher ?? null,
          published_date: input.publishedDate ?? null,
          cover_url: input.coverUrl ?? found.cover_url,
          description: input.description ?? null,
          price_krw: input.priceKrw ?? found.price_krw
        })
        .eq("id", found.id);
      if (upErr) throw upErr;
      const { data: refreshed, error: refErr } = await supabase.from("books").select("*").eq("id", found.id).single();
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
        source: "manual"
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
      source: "manual"
    });
  }

  const loc = input.location?.trim();
  const payload = {
    user_id: userId,
    book_id: canonical.id,
    format: input.format,
    reading_status: input.readingStatus ?? "unread",
    rating: input.rating ?? null,
    memo: input.memo ?? null,
    is_owned: input.isOwned ?? true,
    location: loc ? loc : null
  };

  const { data: inserted, error } = await supabase.from("user_books").insert(payload).select("id").single();

  if (error) throw error;

  const detail = await getUserBook(inserted.id as string, context);
  if (!detail) {
    throw new Error("등록한 책을 다시 불러오지 못했습니다.");
  }
  return detail;
}

export async function updateUserBook(
  id: string,
  input: UpdateUserBookInput,
  context?: RepositoryContext
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
  if (input.authors !== undefined) catalogPatch.authors = input.authors;
  if (input.coverUrl !== undefined) catalogPatch.cover_url = input.coverUrl;
  if (input.publisher !== undefined) catalogPatch.publisher = input.publisher;
  if (input.publishedDate !== undefined) catalogPatch.published_date = input.publishedDate;
  if (input.description !== undefined) catalogPatch.description = input.description;
  if (input.priceKrw !== undefined) catalogPatch.price_krw = input.priceKrw;

  if (Object.keys(catalogPatch).length > 0) {
    const { error: cErr } = await supabase.from("books").update(catalogPatch).eq("id", existing.book_id);
    if (cErr) throw cErr;
  }

  const userPatch: Record<string, unknown> = {};
  if (input.format !== undefined) userPatch.format = input.format;
  if (input.readingStatus !== undefined) userPatch.reading_status = input.readingStatus;
  if (input.rating !== undefined) userPatch.rating = input.rating;
  if (input.memo !== undefined) userPatch.memo = input.memo;
  if (input.isOwned !== undefined) userPatch.is_owned = input.isOwned;
  if (input.location !== undefined) userPatch.location = input.location;

  if (Object.keys(userPatch).length > 0) {
    const { error: uErr } = await supabase.from("user_books").update(userPatch).eq("id", id).eq("user_id", userId);
    if (uErr) throw uErr;
  }

  const detail = await getUserBook(id, context);
  if (!detail) {
    throw new Error("Not found");
  }
  return detail;
}

export async function deleteUserBook(id: string, context?: RepositoryContext): Promise<void> {
  const { supabase, userId } = await getClientAndUser(context);
  const { error } = await supabase.from("user_books").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

export type UserOwnedBooksPriceStats = {
  totalKrw: number;
  pricedOwnedCount: number;
  ownedCount: number;
};

export async function getUserOwnedBooksPriceStats(
  context?: RepositoryContext
): Promise<UserOwnedBooksPriceStats> {
  const { supabase, userId } = await getClientAndUser(context);
  const { data, error } = await supabase.rpc("user_owned_books_price_stats", {
    p_user_id: userId
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
    ownedCount: Number(row.ownedCount ?? 0)
  };
}

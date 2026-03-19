import type {
  BooksQuery,
  CreateUserBookInput,
  UpdateUserBookInput,
  UserBookDetail,
  UserBookSummary
} from "@bookfolio/shared";

import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

type DbUserBook = {
  id: string;
  user_id: string;
  book_id: string | null;
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
  is_owned: boolean;
  created_at: string;
  updated_at: string;
};

type RepositoryContext = {
  userId: string;
  useAdmin?: boolean;
};

function mapBook(row: DbUserBook): UserBookDetail {
  return {
    id: row.id,
    userId: row.user_id,
    bookId: row.book_id,
    isbn: row.isbn,
    title: row.title,
    authors: row.authors,
    format: row.format,
    readingStatus: row.reading_status,
    rating: row.rating,
    memo: row.memo,
    coverUrl: row.cover_url,
    publisher: row.publisher,
    publishedDate: row.published_date,
    description: row.description,
    isOwned: row.is_owned,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function requireUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return { supabase, userId: user.id };
}

async function getClientAndUser(context?: RepositoryContext) {
  if (context) {
    return {
      supabase: context.useAdmin ? createSupabaseAdminClient() : await createSupabaseServerClient(),
      userId: context.userId
    };
  }

  return requireUserId();
}

export async function listUserBooks(
  query: BooksQuery,
  context?: RepositoryContext
): Promise<UserBookSummary[]> {
  const { supabase, userId } = await getClientAndUser(context);

  let builder = supabase
    .from("user_books")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (query.search) {
    builder = builder.ilike("title", `%${query.search}%`);
  }
  if (query.format && query.format !== "all") {
    builder = builder.eq("format", query.format);
  }
  if (query.readingStatus && query.readingStatus !== "all") {
    builder = builder.eq("reading_status", query.readingStatus);
  }

  const { data, error } = await builder;
  if (error) throw error;

  return (data as DbUserBook[]).map(mapBook);
}

export async function getUserBook(
  id: string,
  context?: RepositoryContext
): Promise<UserBookDetail | null> {
  const { supabase, userId } = await getClientAndUser(context);
  const { data, error } = await supabase
    .from("user_books")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapBook(data as DbUserBook) : null;
}

export async function createUserBook(
  input: CreateUserBookInput,
  context?: RepositoryContext
): Promise<UserBookDetail> {
  const { supabase, userId } = await getClientAndUser(context);
  const payload = {
    user_id: userId,
    isbn: input.isbn ?? null,
    title: input.title,
    authors: input.authors,
    format: input.format,
    reading_status: input.readingStatus ?? "unread",
    rating: input.rating ?? null,
    memo: input.memo ?? null,
    cover_url: input.coverUrl ?? null,
    publisher: input.publisher ?? null,
    published_date: input.publishedDate ?? null,
    description: input.description ?? null,
    is_owned: input.isOwned ?? true
  };

  const { data, error } = await supabase
    .from("user_books")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return mapBook(data as DbUserBook);
}

export async function updateUserBook(
  id: string,
  input: UpdateUserBookInput,
  context?: RepositoryContext
): Promise<UserBookDetail> {
  const { supabase, userId } = await getClientAndUser(context);
  const payload = {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.authors !== undefined ? { authors: input.authors } : {}),
    ...(input.format !== undefined ? { format: input.format } : {}),
    ...(input.readingStatus !== undefined ? { reading_status: input.readingStatus } : {}),
    ...(input.rating !== undefined ? { rating: input.rating } : {}),
    ...(input.memo !== undefined ? { memo: input.memo } : {}),
    ...(input.coverUrl !== undefined ? { cover_url: input.coverUrl } : {}),
    ...(input.publisher !== undefined ? { publisher: input.publisher } : {}),
    ...(input.publishedDate !== undefined ? { published_date: input.publishedDate } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.isOwned !== undefined ? { is_owned: input.isOwned } : {})
  };

  const { data, error } = await supabase
    .from("user_books")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return mapBook(data as DbUserBook);
}

export async function deleteUserBook(id: string, context?: RepositoryContext): Promise<void> {
  const { supabase, userId } = await getClientAndUser(context);
  const { error } = await supabase.from("user_books").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

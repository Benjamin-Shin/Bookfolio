"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/require-admin";
import { normalizeIsbn } from "@/lib/books/lookup";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type AdminBookActionState = { error: string | null };

function parseAuthorsCsv(raw: string): string[] {
  return raw
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseGenreSlugs(raw: string): string[] {
  return raw
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseOptionalInt(raw: string | null): number | null {
  if (raw == null) return null;
  const t = raw.trim();
  if (!t) return null;
  const n = parseInt(t, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function readCanonicalFields(formData: FormData) {
  const title = formData.get("title")?.toString().trim() ?? "";
  const authors = parseAuthorsCsv(formData.get("authorsCsv")?.toString() ?? "");
  const isbnRaw = formData.get("isbn")?.toString() ?? "";
  const normalizedIsbn = normalizeIsbn(isbnRaw);
  const isbn = normalizedIsbn.length > 0 ? normalizedIsbn : null;

  const publisher = formData.get("publisher")?.toString().trim() || null;
  const publishedDate = formData.get("publishedDate")?.toString().trim() || null;
  const coverUrl = formData.get("coverUrl")?.toString().trim() || null;
  const description = formData.get("description")?.toString().trim() || null;
  const literatureRegion = formData.get("literatureRegion")?.toString().trim() || null;
  const originalLanguage = formData.get("originalLanguage")?.toString().trim() || null;
  const priceKrw = parseOptionalInt(formData.get("priceKrw")?.toString() ?? null);
  const genreSlugs = parseGenreSlugs(formData.get("genreSlugs")?.toString() ?? "");

  return {
    title,
    authors,
    isbn,
    publisher,
    publishedDate,
    coverUrl,
    description,
    literatureRegion,
    originalLanguage,
    priceKrw,
    genreSlugs
  };
}

export async function createAdminCanonicalBook(
  _prev: AdminBookActionState | null,
  formData: FormData
): Promise<AdminBookActionState> {
  await requireAdmin();

  const f = readCanonicalFields(formData);
  if (!f.title) {
    return { error: "제목을 입력해 주세요." };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("books")
    .insert({
      title: f.title,
      authors: f.authors,
      isbn: f.isbn,
      publisher: f.publisher,
      published_date: f.publishedDate,
      cover_url: f.coverUrl,
      description: f.description,
      price_krw: f.priceKrw,
      genre_slugs: f.genreSlugs.length > 0 ? f.genreSlugs : [],
      literature_region: f.literatureRegion,
      original_language: f.originalLanguage,
      source: "admin"
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "같은 ISBN의 도서가 이미 있습니다." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/admin/books");
  redirect(`/dashboard/admin/books/${data.id}/edit`);
}

export async function updateAdminCanonicalBook(
  _prev: AdminBookActionState | null,
  formData: FormData
): Promise<AdminBookActionState> {
  await requireAdmin();

  const id = formData.get("bookId")?.toString().trim();
  if (!id) {
    return { error: "도서 ID가 없습니다." };
  }

  const f = readCanonicalFields(formData);
  if (!f.title) {
    return { error: "제목을 입력해 주세요." };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("books")
    .update({
      title: f.title,
      authors: f.authors,
      isbn: f.isbn,
      publisher: f.publisher,
      published_date: f.publishedDate,
      cover_url: f.coverUrl,
      description: f.description,
      price_krw: f.priceKrw,
      genre_slugs: f.genreSlugs.length > 0 ? f.genreSlugs : [],
      literature_region: f.literatureRegion,
      original_language: f.originalLanguage
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: "같은 ISBN의 도서가 이미 있습니다." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/admin/books");
  revalidatePath(`/dashboard/admin/books/${id}/edit`);
  return { error: null };
}

export async function deleteAdminCanonicalBook(
  _prev: AdminBookActionState | null,
  formData: FormData
): Promise<AdminBookActionState> {
  await requireAdmin();

  const bookId = formData.get("bookId")?.toString().trim();
  if (!bookId) {
    return { error: "도서 ID가 없습니다." };
  }

  const supabase = createSupabaseAdminClient();

  const { count: ownedCount, error: ownedErr } = await supabase
    .from("user_books")
    .select("*", { count: "exact", head: true })
    .eq("book_id", bookId)
    .eq("is_owned", true);

  if (ownedErr) {
    return { error: ownedErr.message };
  }
  if (ownedCount && ownedCount > 0) {
    return { error: "사용자 소장 서재에 포함된 도서는 삭제할 수 없습니다." };
  }

  const { count: anyCount, error: anyErr } = await supabase
    .from("user_books")
    .select("*", { count: "exact", head: true })
    .eq("book_id", bookId);

  if (anyErr) {
    return { error: anyErr.message };
  }
  if (anyCount && anyCount > 0) {
    return { error: "사용자 서재(읽는 중 등)에 연결된 도서는 삭제할 수 없습니다." };
  }

  const { error } = await supabase.from("books").delete().eq("id", bookId);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/admin/books");
  redirect("/dashboard/admin/books");
}

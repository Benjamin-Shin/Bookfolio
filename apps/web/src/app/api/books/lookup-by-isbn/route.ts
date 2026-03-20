import { NextRequest, NextResponse } from "next/server";

import type { BookLookupResult } from "@bookfolio/shared";

import { lookupBookByIsbn, normalizeIsbn } from "@/lib/books/lookup";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { DbCanonicalBook } from "@/lib/books/repository";
import { findCanonicalBookByIsbn } from "@/lib/books/repository";

function canonicalToLookup(row: DbCanonicalBook): BookLookupResult | null {
  const isbn = row.isbn?.trim();
  if (!isbn) {
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
    originalLanguage: row.original_language ?? null
  };
}

export async function POST(request: NextRequest) {
  try {
    const { isbn } = (await request.json()) as { isbn?: string };
    if (!isbn) {
      return NextResponse.json({ error: "ISBN is required" }, { status: 400 });
    }

    const normalized = normalizeIsbn(isbn);
    if (!normalized) {
      return NextResponse.json({ error: "ISBN is required" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const local = await findCanonicalBookByIsbn(supabase, normalized);
    const fromCatalog = local ? canonicalToLookup(local) : null;
    if (fromCatalog) {
      return NextResponse.json(fromCatalog);
    }

    const result = await lookupBookByIsbn(isbn);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lookup failed" },
      { status: 500 }
    );
  }
}

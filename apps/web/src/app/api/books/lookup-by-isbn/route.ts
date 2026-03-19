import { NextRequest, NextResponse } from "next/server";

import { lookupBookByIsbn } from "@/lib/books/lookup";

export async function POST(request: NextRequest) {
  try {
    const { isbn } = (await request.json()) as { isbn?: string };
    if (!isbn) {
      return NextResponse.json({ error: "ISBN is required" }, { status: 400 });
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


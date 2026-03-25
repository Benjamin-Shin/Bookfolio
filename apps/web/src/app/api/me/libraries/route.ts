import { LIBRARY_KINDS } from "@bookfolio/shared";
import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import { createLibrary, listLibrariesForUser } from "@/lib/libraries/repository";
import { SharedLibraryCreateLimitReachedError } from "@/lib/libraries/shared-library-policy";

function isLibraryKind(v: unknown): v is (typeof LIBRARY_KINDS)[number] {
  return typeof v === "string" && (LIBRARY_KINDS as readonly string[]).includes(v);
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    const items = await listLibrariesForUser(userId, { userId, useAdmin: true });
    return NextResponse.json(items);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list libraries";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

/**
 * @history
 * - 2026-03-25: `SharedLibraryCreateLimitReachedError` → 403
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    const body = (await request.json()) as {
      name?: string;
      description?: string | null;
      kind?: string;
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "이름을 입력해 주세요." }, { status: 400 });
    }
    if (!isLibraryKind(body.kind)) {
      return NextResponse.json({ error: "kind는 family 또는 club 이어야 합니다." }, { status: 400 });
    }

    const created = await createLibrary(
      {
        name: body.name,
        description: body.description ?? null,
        kind: body.kind
      },
      userId,
      { userId, useAdmin: true }
    );

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof SharedLibraryCreateLimitReachedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    const message = error instanceof Error ? error.message : "Failed to create library";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

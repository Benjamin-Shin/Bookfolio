import { LIBRARY_KINDS } from "@bookfolio/shared";
import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import { deleteLibrary, getLibrary, updateLibrary } from "@/lib/libraries/repository";

function isLibraryKind(v: unknown): v is (typeof LIBRARY_KINDS)[number] {
  return typeof v === "string" && (LIBRARY_KINDS as readonly string[]).includes(v);
}

function statusForMessage(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message.includes("권한") || message.includes("소유자")) return 403;
  if (message === "Not found") return 404;
  return 500;
}

type RouteContext = { params: Promise<{ libraryId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getRequestUserId(request);
    const { libraryId } = await context.params;
    const lib = await getLibrary(libraryId, userId, { userId, useAdmin: true });
    if (!lib) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(lib);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: statusForMessage(message) });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getRequestUserId(request);
    const { libraryId } = await context.params;
    const body = (await request.json()) as {
      name?: string;
      description?: string | null;
      kind?: string;
    };

    const patch: { name?: string; description?: string | null; kind?: (typeof LIBRARY_KINDS)[number] } = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.description !== undefined) patch.description = body.description;
    if (body.kind !== undefined) {
      if (!isLibraryKind(body.kind)) {
        return NextResponse.json({ error: "kind는 family 또는 club 이어야 합니다." }, { status: 400 });
      }
      patch.kind = body.kind;
    }

    const updated = await updateLibrary(libraryId, patch, userId, { userId, useAdmin: true });
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: statusForMessage(message) });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getRequestUserId(request);
    const { libraryId } = await context.params;
    await deleteLibrary(libraryId, userId, { userId, useAdmin: true });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: statusForMessage(message) });
  }
}

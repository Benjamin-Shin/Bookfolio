import { NextRequest, NextResponse } from "next/server";

import { getAppProfile, upsertAppProfileRow } from "@/lib/auth/app-profiles";
import { getRequestUserId } from "@/lib/auth/request-user";

export async function GET(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    const profile = await getAppProfile(userId);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    return NextResponse.json(profile);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load profile";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    const body = (await request.json()) as {
      displayName?: string | null;
      avatarUrl?: string | null;
    };

    await upsertAppProfileRow(userId, {
      displayName: body.displayName,
      avatarUrl: body.avatarUrl
    });

    const profile = await getAppProfile(userId);
    return NextResponse.json(profile);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

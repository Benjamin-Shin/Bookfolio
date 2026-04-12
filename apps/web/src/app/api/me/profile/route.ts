import { NextRequest, NextResponse } from "next/server";

import { getAppProfile, upsertAppProfileRow } from "@/lib/auth/app-profiles";
import { getRequestUserId } from "@/lib/auth/request-user";

/**
 * @history
 * - 2026-04-06: `onboardingCompleted` — 온보딩 완료 시각 기록
 * - 2026-04-06: `annualReadingGoal` — 연간 완독 목표 권수
 * - 2026-04-02: `POST` + `action: "update"` — 웹 API 메서드 규약(`GET`/`POST`만). 인구통계 필드.
 */
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

export async function POST(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    const body = (await request.json()) as {
      action?: string;
      displayName?: string | null;
      avatarUrl?: string | null;
      gender?: string | null;
      birthDate?: string | null;
      genderPublic?: boolean;
      birthDatePublic?: boolean;
      annualReadingGoal?: number | null;
      onboardingCompleted?: boolean;
    };

    const action = typeof body.action === "string" ? body.action.trim().toLowerCase() : "";
    if (action !== "update") {
      return NextResponse.json({ error: "action은 update 여야 합니다." }, { status: 400 });
    }

    await upsertAppProfileRow(userId, {
      displayName: body.displayName,
      avatarUrl: body.avatarUrl,
      gender: body.gender,
      birthDate: body.birthDate,
      genderPublic: body.genderPublic,
      birthDatePublic: body.birthDatePublic,
      annualReadingGoal: Object.prototype.hasOwnProperty.call(body, "annualReadingGoal")
        ? body.annualReadingGoal
        : undefined,
      onboardingCompleted: body.onboardingCompleted === true ? true : undefined
    });

    const profile = await getAppProfile(userId);
    return NextResponse.json(profile);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : 500 }
    );
  }
}

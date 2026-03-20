import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/server";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      name?: string;
    };

    const emailRaw = body.email;
    const password = body.password;
    if (!emailRaw || typeof emailRaw !== "string" || !password || typeof password !== "string") {
      return NextResponse.json({ error: "이메일과 비밀번호가 필요합니다." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "비밀번호는 8자 이상이어야 합니다." }, { status: 400 });
    }

    const email = normalizeEmail(emailRaw);
    const supabase = createSupabaseAdminClient();
    const passwordHash = await hash(password, 12);

    const displayName = body.name?.trim() || null;
    const { data: created, error } = await supabase
      .from("app_users")
      .insert({
        email,
        password_hash: passwordHash,
        name: displayName
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "이미 가입된 이메일입니다." }, { status: 409 });
      }
      console.error(error);
      return NextResponse.json({ error: "가입 처리에 실패했습니다." }, { status: 500 });
    }

    if (created?.id) {
      const { error: profileError } = await supabase.from("app_profiles").insert({
        id: created.id,
        display_name: displayName,
        avatar_url: null
      });
      if (profileError) {
        console.error(profileError);
      }
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
  }
}

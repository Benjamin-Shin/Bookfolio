import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import type { UploadApiOptions, UploadApiResponse } from "cloudinary";

import { getRequestUserId } from "@/lib/auth/request-user";

const COVER_FOLDER = "bookfolio-covers";
const AVATAR_FOLDER = "bookfolio-avatars";

const coverUploadOptions: UploadApiOptions = {
  folder: COVER_FOLDER,
  transformation: [
    { width: 800, height: 1200, crop: "limit" },
    { quality: "auto:good" }
  ]
};

/** 프로필 아바타 — 정사각 한도 내 리사이즈 후 Cloudinary 저장 */
const avatarUploadOptions: UploadApiOptions = {
  folder: AVATAR_FOLDER,
  transformation: [{ width: 512, height: 512, crop: "limit" }, { quality: "auto:good" }]
};

type UploadKind = "cover" | "avatar";

function getUploadOptions(kind: UploadKind): UploadApiOptions {
  return kind === "avatar" ? avatarUploadOptions : coverUploadOptions;
}

function parseUploadKind(raw: unknown): UploadKind {
  return raw === "avatar" ? "avatar" : "cover";
}

function readCloudinaryConfig(): { cloud_name: string; api_key: string; api_secret: string } | null {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const api_key = process.env.CLOUDINARY_API_KEY?.trim();
  const api_secret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloud_name || !api_key || !api_secret) {
    return null;
  }
  return { cloud_name, api_key, api_secret };
}

/**
 * Cloudinary Node SDK는 콜백에 `Error` 대신 `{ message, http_code, … }` 객체를 넘기는 경우가 많음.
 *
 * @history
 * - 2026-03-26: `[object Object]` 대신 실제 메시지·JSON 폴백
 */
function formatCloudinaryUploadError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (error == null) {
    return "알 수 없는 오류";
  }
  if (typeof error === "string") {
    return error;
  }
  if (typeof error === "object") {
    const o = error as Record<string, unknown>;
    const top = o.message;
    if (typeof top === "string" && top.trim()) {
      return top.trim();
    }
    const named = o.error;
    if (typeof named === "string" && named.trim()) {
      return named.trim();
    }
    if (named && typeof named === "object") {
      const m = (named as Record<string, unknown>).message;
      if (typeof m === "string" && m.trim()) {
        return m.trim();
      }
    }
    const http = o.http_code;
    if (typeof http === "number") {
      try {
        return `${JSON.stringify(error)} (http ${http})`;
      } catch {
        return `Cloudinary 오류 (http ${http})`;
      }
    }
    try {
      return JSON.stringify(error);
    } catch {
      return "Cloudinary 업로드 오류";
    }
  }
  return String(error);
}

/**
 * Cloudinary 업로드(파일 data URI 또는 원격 http(s) URL).
 *
 * @history
 * - 2026-03-26: `kind` `avatar` — `bookfolio-avatars`, 512² limit
 * - 2026-03-25: 인증·JSON `imageUrl` 지원·서버 전용 env·타입 정리·폴더명 `bookfolio-covers`
 */
function uploadToCloudinary(source: string, kind: UploadKind): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      source,
      getUploadOptions(kind),
      (error: unknown, result?: UploadApiResponse) => {
        if (error) {
          reject(new Error(formatCloudinaryUploadError(error)));
          return;
        }
        if (!result?.secure_url) {
          reject(new Error("Cloudinary 응답에 secure_url이 없습니다."));
          return;
        }
        resolve(result);
      }
    );
  });
}

/**
 * 이미지를 Cloudinary에 업로드합니다. JSON `imageUrl` 또는 `multipart/form-data` `file`.
 * `kind`: `avatar`(기본값 아님 — 생략 시 표지) → `bookfolio-avatars`·512² limit.
 *
 * @history
 * - 2026-03-26: 본문·폼 `kind`(`avatar` | `cover` 기본)로 업로드 옵션 분기
 */
export async function POST(request: NextRequest) {
  try {
    await getRequestUserId(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cfg = readCloudinaryConfig();
  if (!cfg) {
    return NextResponse.json(
      {
        error:
          "Cloudinary가 설정되지 않았습니다. CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET을 확인하세요."
      },
      { status: 503 }
    );
  }
  cloudinary.config(cfg);

  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { imageUrl?: unknown; kind?: unknown };
      const kind = parseUploadKind(body.kind);
      const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
      if (!imageUrl) {
        return NextResponse.json({ error: "imageUrl이 필요합니다." }, { status: 400 });
      }
      let parsed: URL;
      try {
        parsed = new URL(imageUrl);
      } catch {
        return NextResponse.json({ error: "유효한 URL이 아닙니다." }, { status: 400 });
      }
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return NextResponse.json({ error: "http(s) URL만 허용됩니다." }, { status: 400 });
      }

      const result = await uploadToCloudinary(imageUrl, kind);
      return NextResponse.json({
        url: result.secure_url,
        public_id: result.public_id
      });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const kind = parseUploadKind(formData.get("kind"));

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file 필드에 이미지를 첨부해 주세요." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "이미지 파일만 업로드할 수 있습니다." }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "파일 크기는 5MB 이하여야 합니다." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64String = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await uploadToCloudinary(base64String, kind);

    return NextResponse.json({
      url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error) {
    console.error("이미지 업로드 오류:", error);
    const message = formatCloudinaryUploadError(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import type { UploadApiOptions, UploadApiResponse } from "cloudinary";

import { getRequestUserId } from "@/lib/auth/request-user";

const COVER_FOLDER = "bookfolio-covers";

const coverUploadOptions: UploadApiOptions = {
  folder: COVER_FOLDER,
  transformation: [
    { width: 800, height: 1200, crop: "limit" },
    { quality: "auto:good" }
  ]
};

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
 * Cloudinary 업로드(파일 data URI 또는 원격 http(s) URL).
 *
 * @history
 * - 2026-03-25: 인증·JSON `imageUrl` 지원·서버 전용 env·타입 정리·폴더명 `bookfolio-covers`
 */
function uploadToCloudinary(source: string): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      source,
      coverUploadOptions,
      (error: unknown, result?: UploadApiResponse) => {
        if (error) {
          reject(error instanceof Error ? error : new Error(String(error)));
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
      const body = (await request.json()) as { imageUrl?: unknown };
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

      const result = await uploadToCloudinary(imageUrl);
      return NextResponse.json({
        url: result.secure_url,
        public_id: result.public_id
      });
    }

    const formData = await request.formData();
    const file = formData.get("file");

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

    const result = await uploadToCloudinary(base64String);

    return NextResponse.json({
      url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error) {
    console.error("이미지 업로드 오류:", error);
    const message = error instanceof Error ? error.message : "업로드에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

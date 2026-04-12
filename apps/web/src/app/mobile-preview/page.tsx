import type { Metadata } from "next";
import { headers } from "next/headers";

import { env } from "@/lib/env";

import { MobileDevicePreview } from "./mobile-device-preview.client";

export const metadata: Metadata = {
  title: "모바일 웹 미리보기",
  description:
    "휴대폰 뷰포트·햄버거 메뉴와 동일 경로(공동서재, 집계, 베스트셀러, 초이스 신간, 내 서재 등)로 서가담 웹을 프레임 안에서 미리 봅니다."
};

async function getRequestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto") ?? "http";
    return `${proto}://${host}`;
  }
  return env.appUrl.replace(/\/$/, "");
}

/**
 * 모바일 뷰포트 미리보기(기기 프레임 + iframe).
 *
 * @history
 * - 2026-03-29: 메타 설명 보강(햄버거 동일 경로 안내).
 * - 2026-03-29: 신규(`/mobile-preview`, 요청 Host 기준 origin 전달).
 */
export default async function MobilePreviewPage() {
  const origin = await getRequestOrigin();
  return <MobileDevicePreview origin={origin} />;
}

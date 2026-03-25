import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * `process.cwd()`가 모노레포 루트일 때 Next 기본 로더가 `apps/web/.env`를 놓치는 경우가 있어,
 * `next.config.mjs`가 있는 디렉터리(앱 루트)를 고정으로 로드합니다.
 *
 * @history
 * - 2026-03-25: `loadEnvConfig(appDir)` — `ALADIN_BESTSELLER_API_BASE_URL` 등 서버 전용 변수 보장
 */
const appDir = path.dirname(fileURLToPath(import.meta.url));
const requireConfig = createRequire(import.meta.url);
const nextServerEntry = requireConfig.resolve("next/dist/server/next.js");
const requireNext = createRequire(nextServerEntry);
const { loadEnvConfig } = requireNext("@next/env");
loadEnvConfig(appDir);

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@bookfolio/shared"],
  typedRoutes: true
};

export default nextConfig;

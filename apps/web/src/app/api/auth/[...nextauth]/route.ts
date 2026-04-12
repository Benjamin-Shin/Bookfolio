/**
 * NextAuth(App Router) HTTP 진입점. 로직은 `@/auth`·`@/auth.config`에 두고 여기서는 `handlers`만 노출합니다.
 * 이메일·비밀번호(Credentials)는 `auth.config` `authorize` → `verifyAppUserCredentials`(이메일 전체 또는 @ 앞 로컬)입니다.
 *
 * @history
 * - 2026-04-05: 진입점 역할·Credentials 해석 위치 주석
 */
import { handlers } from "@/auth";

export const { GET, POST } = handlers;

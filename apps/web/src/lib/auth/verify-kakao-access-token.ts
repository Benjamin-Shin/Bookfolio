type KakaoAccountProfile = {
  email: string;
  name?: string;
  picture?: string;
};

type KakaoMeResponse = {
  id?: number;
  kakao_account?: {
    email?: string;
    is_email_verified?: boolean;
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
  };
  properties?: {
    nickname?: string;
    profile_image?: string;
  };
};

/**
 * 카카오 액세스 토큰을 `v2/user/me`로 검증하고 앱 계정 연결용 프로필을 반환합니다.
 *
 * @history
 * - 2026-04-24: 모바일 카카오 로그인 서버 검증 헬퍼 추가
 */
export async function verifyKakaoAccessTokenForMobile(
  accessToken: string
): Promise<KakaoAccountProfile> {
  const token = accessToken.trim();
  if (!token) {
    throw new Error("KAKAO_TOKEN_EMPTY");
  }

  const response = await fetch("https://kapi.kakao.com/v2/user/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("KAKAO_TOKEN_INVALID");
  }

  const payload = (await response.json()) as KakaoMeResponse;
  const account = payload.kakao_account;
  const email = typeof account?.email === "string" ? account.email.trim().toLowerCase() : "";
  if (!email) {
    throw new Error("KAKAO_EMAIL_SCOPE_REQUIRED");
  }
  if (account?.is_email_verified !== true) {
    throw new Error("KAKAO_EMAIL_NOT_VERIFIED");
  }

  const name =
    typeof account?.profile?.nickname === "string" && account.profile.nickname.trim()
      ? account.profile.nickname.trim()
      : typeof payload.properties?.nickname === "string" && payload.properties.nickname.trim()
        ? payload.properties.nickname.trim()
        : undefined;

  const picture =
    typeof account?.profile?.profile_image_url === "string" &&
    account.profile.profile_image_url.trim()
      ? account.profile.profile_image_url.trim()
      : typeof payload.properties?.profile_image === "string" && payload.properties.profile_image.trim()
        ? payload.properties.profile_image.trim()
        : undefined;

  return {
    email,
    ...(name ? { name } : {}),
    ...(picture ? { picture } : {})
  };
}

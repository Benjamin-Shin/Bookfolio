# Kakao 모바일 로그인

모바일은 Kakao SDK로 액세스 토큰을 받고, 서버가 `https://kapi.kakao.com/v2/user/me`로 토큰을 검증한 뒤 Bookfolio 모바일 JWT를 발급합니다.

## 서버 설정

- `AUTH_KAKAO_ID`: Kakao REST API 키
- `AUTH_KAKAO_SECRET`: Kakao Client Secret (콘솔에서 사용 시)

웹 NextAuth 카카오 로그인도 동일 값을 사용합니다.

## 모바일 설정

- `KAKAO_NATIVE_APP_KEY`: Kakao Native App Key (`--dart-define`)
- Android/iOS 스킴/매니페스트 설정은 Kakao Flutter SDK 가이드에 맞춰 추가

## 모바일 API

- `POST /api/auth/mobile/kakao`
- 요청 본문: `{ "accessToken": "<kakao_access_token>" }`
- 응답: `{ "accessToken": "<bookfolio_mobile_jwt>" }`

## 트러블슈팅

- `카카오 계정 이메일 동의가 필요합니다. (account_email)`
  - 카카오 앱 권한에서 `account_email` 동의 항목을 활성화하고 재로그인
- `카카오 토큰 검증에 실패했습니다.`
  - 만료 토큰/잘못된 토큰인지 확인 후 재시도

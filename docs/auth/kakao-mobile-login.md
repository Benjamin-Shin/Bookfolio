# Kakao 모바일 로그인

모바일은 Kakao SDK로 액세스 토큰을 받고, 서버가 `https://kapi.kakao.com/v2/user/me`로 토큰을 검증한 뒤 Bookfolio 모바일 JWT를 발급합니다.

## 서버 설정

- `AUTH_KAKAO_ID`: Kakao REST API 키
- `AUTH_KAKAO_SECRET`: Kakao Client Secret (콘솔에서 사용 시)

웹 NextAuth 카카오 로그인도 동일 값을 사용합니다.

## 모바일 설정

- `KAKAO_NATIVE_APP_KEY`: Kakao Native App Key (`--dart-define`)
- Android: `AndroidManifest.xml`에 `kakao{NATIVE_APP_KEY}://oauth` 콜백 인텐트 필터 필요
- iOS: `Info.plist`에 아래 항목 필요
  - `CFBundleURLTypes` → `kakao{NATIVE_APP_KEY}` 스킴 등록
  - `LSApplicationQueriesSchemes` → `kakaokompassauth`, `kakaolink`
  - 현재 프로젝트는 `apps/mobile/ios/Runner/Info.plist`에 스킴이 반영되어 있으므로, Native App Key가 바뀌면 같은 파일의 `kakao...` 값을 함께 갱신해야 함

## 모바일 API

- `POST /api/auth/mobile/kakao`
- 요청 본문: `{ "accessToken": "<kakao_access_token>" }`
- 응답: `{ "accessToken": "<bookfolio_mobile_jwt>" }`

## 트러블슈팅

- `카카오 계정 이메일 동의가 필요합니다. (account_email)`
  - 카카오 앱 권한에서 `account_email` 동의 항목을 활성화하고 재로그인
- `카카오 토큰 검증에 실패했습니다.`
  - 만료 토큰/잘못된 토큰인지 확인 후 재시도

# 모바일 네트워크 필수 진입점 (초안)

Stitch1 통합 계획의 **네트워크 필수 진입점 표·가드**용 기준표.

**구현:** 루트 `NetworkGate` + `OfflineMessageScreen`(`network_gate.dart`) — 비로그인은 `SignInScreen` 위에, 온보딩 완료 후 메인은 `MainShellScreen` 위에 적용(`auth_gate.dart`). 인터페이스 단절(`connectivity_plus`) 기준이며, Wi-Fi 연결만 있고 인터넷이 안 되는 경우는 별도 감지하지 않습니다. 푸시된 하위 화면은 루트 가드 밖에서 열리므로, 오프라인 UX를 더 촘촘히 하려면 향후 `Navigator` 래핑 또는 전역 오버레이를 검토합니다.

| 화면·진입        | 경로(대표)                           | 네트워크          | 비고                                    |
| ---------------- | ------------------------------------ | ----------------- | --------------------------------------- |
| 로그인·회원가입  | `SignInScreen`                       | 필수              | 세션·OAuth                              |
| 인증 게이트      | `AuthGate`                           | 필수(복원 시 API) |                                         |
| 메인 쉘          | `MainShellScreen`                    | 필수(탭 데이터)   | 오프라인 동기 도입 후 일부 탭 완화 가능 |
| 홈               | `BookfolioHomeScreen`                | 필수              | 집계·추천 API                           |
| 내 서가          | `LibraryScreen`                      | 필수              | 목록·캘린더 API                         |
| 발견             | `DiscoverScreen`                     | 필수              | 알라딘·커뮤니티 목록 API                |
| 비소장 캐논 상세 | `CanonBookDetailScreen`              | 필수              | `canon-books` 구매·한줄평 API           |
| 서가·내 책       | `LibraryBrowseTab`                   | 필수              | 내 서가 검색·목록                       |
| 통계·집계        | `LibraryAnalysisScreen` 등           | 필수              |                                         |
| 프로필           | `ProfileScreen`                      | 필수              |                                         |
| 프로필 편집      | `ProfileEditScreen`                  | 필수              |                                         |
| 도서 상세·폼     | `BookDetailScreen`, `BookFormScreen` | 필수              |                                         |
| 공동서가         | `SharedLibrariesScreen` 등           | 필수              |                                         |
| 바코드·ISBN      | 스캔·조회 플로우                     | 필수              |                                         |

**History**

- 2026-04-08: `CanonBookDetailScreen` 행
- 2026-04-06: `NetworkGate`·루트 가드 설명 반영
- 2026-04-05: 초안 작성(오프라인 SQLite 도입 전 기준).

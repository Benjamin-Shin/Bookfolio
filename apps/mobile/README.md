# Bookfolio Mobile

Flutter MVP app for:

- Email auth (NextAuth와 동일한 `app_users` 자격 증명, `/api/auth/mobile/login`)
- Personal shelf list and detail management
- Manual book registration
- Barcode-based ISBN lookup

## Required env

웹 API 베이스 URL만 필요합니다 (예: `https://your-app.vercel.app`).

- `BOOKFOLIO_API_BASE_URL`

`--dart-define` 로 **컴파일 타임**에 박힙니다. `.env` 파일을 읽지 않습니다.

```bash
flutter run --dart-define=BOOKFOLIO_API_BASE_URL=https://your-app.example.com
```

개발 서버 포트가 30082 등이면 URL 만 그에 맞게 바꿉니다.

### 어디에 넣나요?

| 실행 방식 | 설정 위치 |
|-----------|-----------|
| **터미널** | `flutter run --dart-define=BOOKFOLIO_API_BASE_URL=http://localhost:<포트>` |
| **VS Code / Cursor** | 저장소 루트 `.vscode/launch.json` 의 `toolArgs` |
| **Android Studio** | Run → Edit Configurations → Additional run args 에 동일한 `--dart-define=...` |
| **루트 릴리스 빌드** | `.env.mobile.example` → `.env.mobile` 복사 후 `pnpm build:mobile:apk-split` 등 (`scripts/build-mobile.sh`) |

### 배포용 APK 용량 (Supabase Storage 등)

Supabase 무료/기본 구간은 **파일당 약 50MB** 제한이 있는 경우가 많아, **fat APK**(`pnpm build:mobile:apk`, 모든 CPU ABI 한 파일)는 한도를 넘기기 쉽습니다.

**`pnpm build:mobile:apk-split`** (`flutter build apk --split-per-abi`)을 쓰면 `arm64-v8a`·`armeabi-v7a`·`x86_64`별로 APK가 나뉘어 각각 수십 MB 이하가 되는 경우가 대부분입니다.

- **삼성 갤럭시 등 최근 안드로이드 폰**: **`app-arm64-v8a-release-<버전>.apk`** — `x86_64` 는 PC 에뮬레이터·드문 인텔 안드로이드용이라 갤럭시에 깔면 안 맞을 수 있습니다.
- 빌드 후 `scripts/build-mobile.sh` 가 `apps/mobile/pubspec.yaml` 의 `version`(예: `0.1.0+1` → 파일명 `0.1.0-1`)을 붙여 `app-arm64-v8a-release-0.1.0-1.apk` 형태로 바꿉니다. (앱 버전은 Flutter 규약상 **package.json 이 아니라 pubspec.yaml** 입니다.)

### 로컬 Next.js (포트는 `pnpm dev` 출력에 맞출 것)

- **Flutter Web / Chrome**: PC 기준이므로 `http://localhost:<포트>` (예: 30082).
- **Android 에뮬레이터**: **`localhost` 는 에뮬 자기 자신**입니다. PC 의 개발 서버는 **`http://10.0.2.2:<포트>`** (예: `http://10.0.2.2:30082`). 포트만 바꾸고 `localhost` 를 쓰면 계속 `Failed to fetch` 가 납니다.
- **실제 Android 기기**: PC 의 LAN IP (예: `http://192.168.0.5:30082`), 방화벽에서 해당 포트 허용.
- **iOS 시뮬레이터**: 보통 `http://localhost:<포트>` 로 PC에 붙습니다.

`dart-define` 을 빼고 실행하면 API URL 이 비어 요청이 서버에 닿지 않아, Next 콘솔에 로그가 없을 수 있습니다.


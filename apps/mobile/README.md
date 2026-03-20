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

### 로컬 Next.js (포트는 `pnpm dev` 출력에 맞출 것)

- **Flutter Web / Chrome**: PC 기준이므로 `http://localhost:<포트>` (예: 30082).
- **Android 에뮬레이터**: **`localhost` 는 에뮬 자기 자신**입니다. PC 의 개발 서버는 **`http://10.0.2.2:<포트>`** (예: `http://10.0.2.2:30082`). 포트만 바꾸고 `localhost` 를 쓰면 계속 `Failed to fetch` 가 납니다.
- **실제 Android 기기**: PC 의 LAN IP (예: `http://192.168.0.5:30082`), 방화벽에서 해당 포트 허용.
- **iOS 시뮬레이터**: 보통 `http://localhost:<포트>` 로 PC에 붙습니다.

`dart-define` 을 빼고 실행하면 API URL 이 비어 요청이 서버에 닿지 않아, Next 콘솔에 로그가 없을 수 있습니다.


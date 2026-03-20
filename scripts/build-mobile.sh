#!/usr/bin/env bash
set -euo pipefail

# Flutter 릴리스 빌드 — BOOKFOLIO_API_BASE_URL, 선택적 GOOGLE_AUTH_CLIENT_ID 를 --dart-define 으로 넣습니다.
#
# 사용 예:
#   export BOOKFOLIO_API_BASE_URL=https://your-app.vercel.app
#   bash scripts/build-mobile.sh apk-split   # Supabase Storage 등 파일당 ~50MB 제한용 (권장)
#   bash scripts/build-mobile.sh apk         # 단일 fat APK (~모든 ABI, 용량 큼)
#
#   pnpm build:mobile:apk-split
#
# 환경 변수가 비어 있으면 저장소 루트의 .env.mobile 을 source 합니다 (.env.mobile.example 참고).
#
# APK 파일명에 버전을 붙일 때는 apps/mobile/pubspec.yaml 의 version 을 씁니다.
# (모노레포 루트 package.json 과는 별개 — Flutter 표준이 pubspec 입니다.)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MOBILE_DIR="$ROOT_DIR/apps/mobile"

# pubspec.yaml 의 version: 0.1.0+1 → 파일명용 0.1.0-1 (+ 는 경로/URL 에서 불편해 하이픈으로 치환)
read_mobile_version_slug() {
  local raw
  raw="$(grep -E '^version:' "$MOBILE_DIR/pubspec.yaml" | head -1 | sed -E 's/^version:[[:space:]]*//' | tr -d "'\"")"
  if [[ -z "$raw" ]]; then
    echo "pubspec.yaml 에서 version 을 읽지 못했습니다." >&2
    exit 1
  fi
  echo "${raw//+/-}"
}

rename_release_apks_with_version_suffix() {
  local out ver base f dest
  out="$MOBILE_DIR/build/app/outputs/flutter-apk"
  ver="$(read_mobile_version_slug)"
  [[ -d "$out" ]] || return 0

  for f in "$out"/app-*-release.apk; do
    [[ -e "$f" ]] || continue
    base="$(basename "$f" .apk)"
    dest="$out/${base}-${ver}.apk"
    mv "$f" "$dest"
    echo "  → $(basename "$dest")"
  done

  if [[ -f "$out/app-release.apk" ]]; then
    dest="$out/app-release-${ver}.apk"
    mv "$out/app-release.apk" "$dest"
    echo "  → $(basename "$dest")"
  fi
}

cd "$ROOT_DIR"

if [[ -z "${BOOKFOLIO_API_BASE_URL:-}" ]] && [[ -f "$ROOT_DIR/.env.mobile" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env.mobile"
  set +a
fi

if [[ -z "${BOOKFOLIO_API_BASE_URL:-}" ]]; then
  echo "BOOKFOLIO_API_BASE_URL 이 비어 있습니다."
  echo "  export BOOKFOLIO_API_BASE_URL=https://your-app.vercel.app"
  echo "  또는 루트에 .env.mobile 를 만들고 예시(.env.mobile.example)처럼 설정하세요."
  exit 1
fi

TARGET="${1:-apk-split}"
DART_DEF=(--dart-define="BOOKFOLIO_API_BASE_URL=$BOOKFOLIO_API_BASE_URL")
if [[ -n "${GOOGLE_AUTH_CLIENT_ID:-}" ]]; then
  DART_DEF+=(--dart-define="GOOGLE_AUTH_CLIENT_ID=$GOOGLE_AUTH_CLIENT_ID")
fi

cd "$MOBILE_DIR"

case "$TARGET" in
  apk-split|split)
    flutter build apk --release --split-per-abi "${DART_DEF[@]}"
    ;;
  apk)
    flutter build apk --release "${DART_DEF[@]}"
    ;;
  appbundle|bundle|aab)
    flutter build appbundle --release "${DART_DEF[@]}"
    ;;
  ipa)
    flutter build ipa --release "${DART_DEF[@]}"
    ;;
  ios)
    flutter build ios --release "${DART_DEF[@]}"
    ;;
  *)
    echo "사용법: $0 [apk-split|apk|appbundle|ipa|ios]"
    echo "  apk-split  — ABI별 APK 여러 개 (용량 작음, Supabase Storage 등 업로드에 유리)"
    echo "  apk        — 단일 fat APK (모든 ABI 포함, 용량 큼)"
    echo "  appbundle  — Android App Bundle (Play 스토어)"
    echo "  ipa        — iOS App Store 패키지 (macOS + Xcode)"
    echo "  ios        — iOS Release 빌드 (macOS + Xcode)"
    exit 1
    ;;
esac

case "$TARGET" in
  apk-split|split|apk)
    echo ""
    echo "버전 접미사를 붙인 APK 이름:"
    rename_release_apks_with_version_suffix
    ;;
esac

echo ""
echo "빌드 출력: $MOBILE_DIR/build/app/outputs/flutter-apk/"
echo "  갤럭시 등 일반 폰: app-arm64-v8a-release-<버전>.apk (x86_64 는 에뮬/일부 인텔 기기용)"

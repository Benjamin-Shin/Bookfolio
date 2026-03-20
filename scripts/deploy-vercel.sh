#!/usr/bin/env bash
set -e

# Vercel 배포 스크립트 - apps/web만 배포
# 사용법 (pnpm deploy 는 내장 명령이라 스크립트와 충돌함 — 아래만 사용):
#   pnpm vercel:preview      # Preview 배포
#   pnpm vercel:prod         # Production 배포

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

# apps/web만 배포 (Root Directory는 Vercel 프로젝트 설정에서 apps/web으로 지정 필요)
# vercel.json은 apps/web에 있습니다. vercel link 후 대시보드에서 Root Directory를 apps/web으로 설정하세요.
if [[ "$1" == "prod" ]] || [[ "$1" == "--prod" ]]; then
  echo "🚀 Production 배포 중 (apps/web)..."
  npx vercel --prod
else
  echo "🚀 Preview 배포 중 (apps/web)..."
  npx vercel
fi

#!/usr/bin/env bash
set -e

# Vercel 배포 스크립트 - apps/web만 배포
# 사용법:
#   pnpm run deploy          # Preview 배포
#   pnpm run deploy:prod     # Production 배포

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

# apps/web만 배포 (Root Directory는 Vercel 프로젝트 설정에서 apps/web으로 지정 필요)
# vercel link로 프로젝트 연결 후, 대시보드에서 Root Directory를 apps/web으로 설정하세요.
if [[ "$1" == "prod" ]] || [[ "$1" == "--prod" ]]; then
  echo "🚀 Production 배포 중 (apps/web)..."
  pnpm exec vercel --prod
else
  echo "🚀 Preview 배포 중 (apps/web)..."
  pnpm exec vercel
fi

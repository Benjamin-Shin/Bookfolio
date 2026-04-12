#!/usr/bin/env python3
"""Resize #Resources brand PNGs into Android mipmaps, iOS AppIcon set, and Flutter web icons.

@history
- 2026-04-07: Seogadam 런처·PWA 아이콘 일괄 생성 (소스: Seogadam_logo.png, favicon은 별도 복사)
"""

from __future__ import annotations

import re
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent.parent
SRC_LOGO = REPO / "#Resources" / "Seogadam_logo.png"
FAV_PNG = REPO / "#Resources" / "Seogadam_favicon.png"
FAV_ICO = REPO / "#Resources" / "Seogadam_favicon.ico"

IOS_NAME = re.compile(r"Icon-App-([\d.]+)x([\d.]+)@(\d+)x\.png$")


def main() -> None:
    if not SRC_LOGO.is_file():
        raise SystemExit(f"missing {SRC_LOGO}")
    img = Image.open(SRC_LOGO).convert("RGBA")

    res = ROOT / "android/app/src/main/res"
    for folder, size in (
        ("mipmap-mdpi", 48),
        ("mipmap-hdpi", 72),
        ("mipmap-xhdpi", 96),
        ("mipmap-xxhdpi", 144),
        ("mipmap-xxxhdpi", 192),
    ):
        out = res / folder / "ic_launcher.png"
        _save_square(img, size, out)

    icdir = ROOT / "ios/Runner/Assets.xcassets/AppIcon.appiconset"
    for f in sorted(icdir.glob("Icon-App-*.png")):
        m = IOS_NAME.match(f.name)
        if not m:
            continue
        base = float(m.group(1))
        scale = int(m.group(3))
        px = int(round(base * scale))
        _save_square(img, px, f)

    web = ROOT / "web"
    for rel, size in (
        ("icons/Icon-192.png", 192),
        ("icons/Icon-512.png", 512),
        ("icons/Icon-maskable-192.png", 192),
        ("icons/Icon-maskable-512.png", 512),
    ):
        _save_square(img, size, web / rel)

    if not FAV_PNG.is_file() or not FAV_ICO.is_file():
        raise SystemExit(f"missing favicon assets under {FAV_PNG.parent}")
    shutil.copy2(FAV_PNG, web / "favicon.png")
    shutil.copy2(FAV_ICO, web / "favicon.ico")
    # 웹에서 참조할 수 있는 브랜드 로고 원본(512)
    shutil.copy2(SRC_LOGO, web / "icons" / "seogadam_logo.png")


def _save_square(src: Image.Image, px: int, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    thumb = src.resize((px, px), Image.Resampling.LANCZOS)
    thumb.save(path, "PNG")
    print(path.relative_to(ROOT))


if __name__ == "__main__":
    main()

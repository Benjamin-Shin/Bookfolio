import { AndroidAppIcon } from "@/components/layout/android-app-icon";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";

/**
 * Play Console 비공개 테스트 링크.
 *
 * @history
 * - 2026-05-24: 헤더 Android 아이콘 — Play 비공개 테스트 URL
 */
export function HeaderAndroidAppLink() {
  const href = env.playStoreTestingUrl;
  if (!href) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="shrink-0 text-[#5c6560] hover:text-[#1A3C2F]"
      asChild
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Android 앱 (비공개 테스트)"
        title="Android 앱 (비공개 테스트)"
      >
        <AndroidAppIcon className="size-5" />
      </a>
    </Button>
  );
}

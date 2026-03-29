"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { RefreshCwIcon, SmartphoneIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type PreviewTarget = {
  label: string;
  path: string;
};

type PresetGroup = {
  title: string;
  description?: string;
  items: PreviewTarget[];
};

/** 빠른 이동 — `SiteHeaderMobileNav` 햄버거 메뉴 순서·경로와 맞춤. */
const PRESET_GROUPS: PresetGroup[] = [
  {
    title: "시작",
    items: [
      { label: "홈", path: "/" },
      { label: "로그인", path: "/login" },
    ],
  },
  {
    title: "앱 메뉴와 동일",
    description:
      "iframe 너비가 모바일이라 상단 오른쪽 햄버거(≡)도 실제와 같이 보입니다. 아래 버튼은 그 메뉴·항목과 같은 주소입니다.",
    items: [
      { label: "공동서재", path: "/dashboard/libraries" },
      { label: "북폴리오 집계", path: "/dashboard/bookfolio-aggregate" },
      { label: "베스트셀러", path: "/dashboard/bestsellers" },
      { label: "초이스 신간", path: "/dashboard/choice-new" },
      { label: "내 서재", path: "/dashboard" },
    ],
  },
  {
    title: "법적 고지 (메뉴 하단)",
    items: [
      { label: "개인정보", path: "/privacy" },
      { label: "약관", path: "/terms" },
      { label: "쿠키", path: "/cookies" },
    ],
  },
];

const IFRAME_WIDTH = 390;
const IFRAME_HEIGHT = 844;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function trimId(value: string): string {
  return value.trim();
}

function isUuidLike(value: string): boolean {
  return UUID_RE.test(trimId(value));
}

interface MobileDevicePreviewProps {
  origin: string;
}

/**
 * 휴대폰 형태 프레임 안에 동일 출처 웹을 iframe으로 띄워 모바일 뷰포트를 흉내 냅니다.
 *
 * @history
 * - 2026-03-29: 햄버거(`SiteHeaderMobileNav`)와 동일 프리셋·법적 고지·내/공동 상세·공동서재 서재 홈(UUID).
 * - 2026-03-29: 초기 구현(프리셋 경로·갱신·안내 카드).
 */
export function MobileDevicePreview({ origin }: MobileDevicePreviewProps) {
  const base = useMemo(() => origin.replace(/\/$/, ""), [origin]);
  const initialPath = PRESET_GROUPS[0].items[0].path;
  const [path, setPath] = useState(initialPath);
  const [iframeNonce, setIframeNonce] = useState(0);
  const [myBookId, setMyBookId] = useState("");
  const [sharedLibraryId, setSharedLibraryId] = useState("");
  const [sharedBookId, setSharedBookId] = useState("");
  const [detailError, setDetailError] = useState<string | null>(null);

  const src = `${base}${path === "/" ? "/" : path}`;
  const iframeSrc =
    iframeNonce === 0
      ? src
      : `${src}${src.includes("?") ? "&" : "?"}_pv=${iframeNonce}`;

  const reload = useCallback(() => {
    setIframeNonce((n) => n + 1);
  }, []);

  const openMyBookDetail = useCallback(() => {
    const id = trimId(myBookId);
    if (!id) {
      setDetailError("내 서재 소장 ID를 입력하세요.");
      return;
    }
    if (!isUuidLike(id)) {
      setDetailError("내 서재 소장 ID는 UUID 형식이어야 합니다.");
      return;
    }
    setDetailError(null);
    setPath(`/dashboard/books/${id}`);
    setIframeNonce((n) => n + 1);
  }, [myBookId]);

  const openSharedLibraryHome = useCallback(() => {
    const lib = trimId(sharedLibraryId);
    if (!lib) {
      setDetailError("공동서재 ID를 입력하세요.");
      return;
    }
    if (!isUuidLike(lib)) {
      setDetailError("공동서재 ID는 UUID 형식이어야 합니다.");
      return;
    }
    setDetailError(null);
    setPath(`/dashboard/libraries/${lib}`);
    setIframeNonce((n) => n + 1);
  }, [sharedLibraryId]);

  const openSharedBookDetail = useCallback(() => {
    const lib = trimId(sharedLibraryId);
    const book = trimId(sharedBookId);
    if (!lib || !book) {
      setDetailError("공동서재 ID와 도서 ID를 모두 입력하세요.");
      return;
    }
    if (!isUuidLike(lib) || !isUuidLike(book)) {
      setDetailError("공동서재·도서 ID는 UUID 형식이어야 합니다.");
      return;
    }
    setDetailError(null);
    setPath(`/dashboard/libraries/${lib}/books/${book}`);
    setIframeNonce((n) => n + 1);
  }, [sharedLibraryId, sharedBookId]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <div className="mb-8 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-muted">
            <SmartphoneIcon className="size-5 text-muted-foreground" aria-hidden />
          </span>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            모바일 웹 미리보기
          </h1>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground text-pretty md:text-base">
          가로 {IFRAME_WIDTH}px·세로 {IFRAME_HEIGHT}px iframe으로 같은 사이트를 불러 옵니다.
          Flutter 앱 UI와는 다를 수 있고, 로그인 쿠키는 브라우저와 공유됩니다. 상단
          햄버거 메뉴는 모바일 뷰에서만 쓰이므로 이 프레임 안에서도 앱과 같이 표시됩니다.
        </p>
      </div>

      <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
        <div className="flex min-w-0 flex-1 flex-col items-center gap-6">
          <div
            className="flex w-full max-w-2xl flex-col gap-5"
            aria-label="미리보기 화면 경로 선택"
          >
            {PRESET_GROUPS.map((group) => (
              <div key={group.title} className="space-y-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.title}
                  </p>
                  {group.description ? (
                    <p className="mt-1 text-xs text-muted-foreground text-pretty">
                      {group.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((t) => (
                    <Button
                      key={t.path}
                      type="button"
                      size="sm"
                      variant={path === t.path ? "default" : "outline"}
                      onClick={() => {
                        setDetailError(null);
                        setPath(t.path);
                      }}
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
              </div>
            ))}

            <div className="space-y-3 rounded-lg border border-border/80 bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                상세 화면 (ID)
              </p>
              <p className="text-xs text-muted-foreground text-pretty">
                목록에서 책을 누르면 되지만, URL의 UUID를 알 때는 여기서 바로 열 수
                있습니다. 내 서재는{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
                  /dashboard/books/…
                </code>
                , 공동서재 서재 홈은{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
                  /dashboard/libraries/…
                </code>
                , 그 안 도서 상세는{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
                  …/books/…
                </code>
                입니다.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pv-my-book" className="text-xs">
                    내 서재 — 소장 책 ID
                  </Label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <Input
                      id="pv-my-book"
                      value={myBookId}
                      onChange={(e) => setMyBookId(e.target.value)}
                      placeholder="user_books UUID"
                      className="font-mono text-xs sm:flex-1"
                      autoComplete="off"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="shrink-0"
                      onClick={openMyBookDetail}
                    >
                      열기
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">공동서재 — 서재 ID</Label>
                  <Input
                    value={sharedLibraryId}
                    onChange={(e) => setSharedLibraryId(e.target.value)}
                    placeholder="library UUID"
                    className="font-mono text-xs"
                    autoComplete="off"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={openSharedLibraryHome}
                    >
                      서재 홈
                    </Button>
                  </div>
                  <Label className="text-xs text-muted-foreground">
                    공동서재 도서 상세 — 캐논 도서 ID
                  </Label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <Input
                      value={sharedBookId}
                      onChange={(e) => setSharedBookId(e.target.value)}
                      placeholder="book UUID"
                      className="font-mono text-xs sm:flex-1"
                      autoComplete="off"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="shrink-0"
                      onClick={openSharedBookDetail}
                    >
                      도서 상세
                    </Button>
                  </div>
                </div>
              </div>
              {detailError ? (
                <p className="text-xs text-destructive" role="status">
                  {detailError}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={reload}
                className="gap-1.5"
              >
                <RefreshCwIcon className="size-4" aria-hidden />
                새로 고침
              </Button>
              <span className="text-center text-[11px] text-muted-foreground">
                현재 경로:{" "}
                <code className="rounded bg-muted px-1 py-0.5 break-all">
                  {path}
                </code>
              </span>
            </div>
          </div>

          <div className="flex w-full max-w-full flex-col items-center gap-3">
            <div
              className={cn(
                "rounded-[2.75rem] border border-zinc-700/90 bg-gradient-to-b from-zinc-700 to-zinc-900 p-3 shadow-2xl",
                "max-w-full"
              )}
            >
              <div className="relative overflow-hidden rounded-[2.1rem] bg-black shadow-inner ring-1 ring-white/10">
                <div
                  className="flex h-7 items-center justify-between px-5 text-[10px] font-medium text-white/80"
                  aria-hidden
                >
                  <span>9:41</span>
                  <div className="absolute left-1/2 top-1.5 h-5 w-[4.5rem] -translate-x-1/2 rounded-full bg-black/80" />
                  <span className="tabular-nums">100%</span>
                </div>
                <iframe
                  title="Bookfolio 모바일 뷰포트 미리보기"
                  src={iframeSrc}
                  className="block bg-background"
                  style={{
                    width: IFRAME_WIDTH,
                    height: IFRAME_HEIGHT,
                    maxWidth: "100%",
                  }}
                />
                <div
                  className="mx-auto mb-2 mt-1 h-1 w-24 rounded-full bg-white/25"
                  aria-hidden
                />
              </div>
            </div>
          </div>

          <p className="max-w-md text-center text-xs text-muted-foreground">
            iframe 안에서 링크로 이동하거나, 상단 햄버거로 메뉴를 열어 공동서재·집계 등으로
            갈 수 있습니다. 프리셋 버튼은 밖에서 경로를 바꿀 때만 씁니다.
          </p>
        </div>

        <Card className="w-full shrink-0 border-border/80 shadow-sm lg:max-w-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">이 페이지에 대해</CardTitle>
            <CardDescription className="text-pretty">
              데스크톱에서 모바일 레이아웃을 확인할 때 쓰는 보조 화면입니다. 실제 앱 스토어
              빌드와는 별개입니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p className="text-pretty">
              빠른 이동 버튼은 전역 헤더의 모바일 햄버거(
              <code className="rounded bg-muted px-1 text-xs">SiteHeaderMobileNav</code>
              )와 같은 링크 묶음입니다.
            </p>
            <p className="text-pretty">
              <Link
                href="/"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                랜딩 홈
              </Link>
              으로 돌아가거나, 휴대폰 브라우저에서 같은 주소를 여는 것이 가장 정확합니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

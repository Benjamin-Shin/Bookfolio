"use client";

/**
 * 관리자 공유 서지(`books`) 등록·수정 폼.
 *
 * @history
 * - 2026-03-24: 옮긴이(`translatorsCsv`), API소스(`apiSource`) 입력; ISBN 조회 시 API소스 칸이 비어 있으면 조회 `source`로 채움
 */

import type { BookLookupResult } from "@bookfolio/shared";
import type { RefObject } from "react";
import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  createAdminCanonicalBook,
  updateAdminCanonicalBook,
  type AdminBookActionState
} from "./actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "처리 중…" : label}
    </Button>
  );
}

function setInputIfEmpty(el: HTMLInputElement | HTMLTextAreaElement | null, value: string) {
  if (!el || value === "") return;
  if (el.value.trim() === "") {
    el.value = value;
  }
}

function applyLookupToFormFields(
  book: BookLookupResult,
  refs: {
    title: RefObject<HTMLInputElement | null>;
    authorsCsv: RefObject<HTMLInputElement | null>;
    isbn: RefObject<HTMLInputElement | null>;
    publisher: RefObject<HTMLInputElement | null>;
    publishedDate: RefObject<HTMLInputElement | null>;
    coverUrl: RefObject<HTMLInputElement | null>;
    priceKrw: RefObject<HTMLInputElement | null>;
    genreSlugs: RefObject<HTMLInputElement | null>;
    literatureRegion: RefObject<HTMLInputElement | null>;
    originalLanguage: RefObject<HTMLInputElement | null>;
    description: RefObject<HTMLTextAreaElement | null>;
    apiSource: RefObject<HTMLInputElement | null>;
  },
  mode: "create" | "edit"
) {
  const fillEmptyOnly = mode === "edit";

  const assign = (el: HTMLInputElement | HTMLTextAreaElement | null, value: string) => {
    if (!el) return;
    if (fillEmptyOnly) {
      setInputIfEmpty(el, value);
    } else {
      el.value = value;
    }
  };

  assign(refs.title.current, book.title);
  assign(
    refs.authorsCsv.current,
    book.authors.length > 0 ? book.authors.join(", ") : ""
  );
  if (refs.isbn.current) {
    refs.isbn.current.value = book.isbn;
  }
  assign(refs.publisher.current, book.publisher ?? "");
  assign(refs.publishedDate.current, book.publishedDate ?? "");
  assign(refs.coverUrl.current, book.coverUrl ?? "");
  assign(refs.description.current, book.description ?? "");
  if (book.priceKrw != null) {
    assign(refs.priceKrw.current, String(book.priceKrw));
  }
  const genres = book.genreSlugs?.length ? book.genreSlugs.join(", ") : "";
  assign(refs.genreSlugs.current, genres);
  assign(refs.literatureRegion.current, book.literatureRegion ?? "");
  assign(refs.originalLanguage.current, book.originalLanguage ?? "");
  assign(refs.apiSource.current, book.source ?? "");
}

export type AdminCanonicalBookFormValues = {
  title: string;
  authorsCsv: string;
  translatorsCsv: string;
  isbn: string;
  publisher: string;
  publishedDate: string;
  coverUrl: string;
  description: string;
  priceKrw: string;
  genreSlugs: string;
  literatureRegion: string;
  originalLanguage: string;
  apiSource: string;
};

const emptyValues: AdminCanonicalBookFormValues = {
  title: "",
  authorsCsv: "",
  translatorsCsv: "",
  isbn: "",
  publisher: "",
  publishedDate: "",
  coverUrl: "",
  description: "",
  priceKrw: "",
  genreSlugs: "",
  literatureRegion: "",
  originalLanguage: "",
  apiSource: ""
};

type AdminCanonicalBookFormProps = {
  mode: "create" | "edit";
  bookId?: string;
  defaultValues?: Partial<AdminCanonicalBookFormValues>;
};

function kyoboSearchUrl(keyword: string) {
  const q = keyword.trim();
  if (!q) return null;
  const params = new URLSearchParams({ keyword: q, gbCode: "TOT", target: "total" });
  return `https://search.kyobobook.co.kr/search?${params.toString()}`;
}

export function AdminCanonicalBookForm({ mode, bookId, defaultValues }: AdminCanonicalBookFormProps) {
  const initial = { ...emptyValues, ...defaultValues };
  const action = mode === "create" ? createAdminCanonicalBook : updateAdminCanonicalBook;
  const [state, formAction] = useActionState(action, null as AdminBookActionState | null);

  const [lookupIsbn, setLookupIsbn] = useState(() =>
    mode === "edit" ? (defaultValues?.isbn ?? "").trim() : ""
  );
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupOk, setLookupOk] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);
  const authorsCsvRef = useRef<HTMLInputElement>(null);
  const isbnRef = useRef<HTMLInputElement>(null);
  const publisherRef = useRef<HTMLInputElement>(null);
  const publishedDateRef = useRef<HTMLInputElement>(null);
  const coverUrlRef = useRef<HTMLInputElement>(null);
  const priceKrwRef = useRef<HTMLInputElement>(null);
  const genreSlugsRef = useRef<HTMLInputElement>(null);
  const literatureRegionRef = useRef<HTMLInputElement>(null);
  const originalLanguageRef = useRef<HTMLInputElement>(null);
  const apiSourceRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  const [locationPreset, setLocationPreset] = useState<"집" | "회사" | null>(null);

  function applyLocationPreset(label: "집" | "회사") {
    const el = locationInputRef.current;
    if (el) {
      el.value = label;
    }
    setLocationPreset(label);
  }

  function syncLocationPresetFromInput() {
    const el = locationInputRef.current;
    const v = el?.value.trim() ?? "";
    if (v === "집") setLocationPreset("집");
    else if (v === "회사") setLocationPreset("회사");
    else setLocationPreset(null);
  }

  function kyoboSearchKeyword() {
    const fromLookup = lookupIsbn.trim();
    const fallback = (initial.isbn ?? "").trim();
    return fromLookup || fallback;
  }

  function openKyoboSearchInNewWindow() {
    const url = kyoboSearchUrl(kyoboSearchKeyword());
    if (!url) return;
    const win = window.open(url, "_blank");
    if (win) win.opener = null;
  }

  async function handleIsbnLookup() {
    const raw = lookupIsbn.trim();
    setLookupError(null);
    setLookupOk(false);
    setCoverPreview(null);

    if (!raw) {
      setLookupError("ISBN을 입력해 주세요.");
      return;
    }

    setLookupLoading(true);
    try {
      const res = await fetch("/api/books/lookup-by-isbn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isbn: raw })
      });

      const data = (await res.json()) as BookLookupResult | { error?: string };

      if (!res.ok) {
        const message =
          "error" in data && typeof data.error === "string"
            ? data.error
            : "도서 정보를 가져오지 못했습니다.";
        setLookupError(message);
        return;
      }

      const book = data as BookLookupResult;
      applyLookupToFormFields(
        book,
        {
          title: titleRef,
          authorsCsv: authorsCsvRef,
          isbn: isbnRef,
          publisher: publisherRef,
          publishedDate: publishedDateRef,
          coverUrl: coverUrlRef,
          priceKrw: priceKrwRef,
          genreSlugs: genreSlugsRef,
          literatureRegion: literatureRegionRef,
          originalLanguage: originalLanguageRef,
          description: descriptionRef,
          apiSource: apiSourceRef
        },
        mode
      );
      setCoverPreview(book.coverUrl ?? null);
      setLookupOk(true);
    } catch {
      setLookupError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLookupLoading(false);
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {bookId ? <input type="hidden" name="bookId" value={bookId} /> : null}

      {state?.error ? (
        <Alert variant="destructive">
          <AlertTitle>오류</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-3 rounded-lg border border-border/80 bg-muted/30 p-4">
        <div className="space-y-1">
          <Label htmlFor="admin-isbn-lookup">ISBN으로 검색</Label>
          <p className="text-xs text-muted-foreground">
            국립중앙도서관 → 네이버 → Google Books 순으로 시도합니다.{" "}
            {mode === "edit"
              ? "수정 모드에서는 비어 있는 필드만 채웁니다. 조회한 ISBN은 항상 ISBN 칸에 반영됩니다."
              : "신규 등록 시에는 조회 결과로 폼을 채웁니다."}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <Input
              id="admin-isbn-lookup"
              inputMode="numeric"
              autoComplete="off"
              placeholder="예: 9788936434267"
              value={lookupIsbn}
              onChange={(e) => {
                setLookupIsbn(e.target.value);
                setLookupOk(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleIsbnLookup();
                }
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2 sm:shrink-0">
            <Button type="button" variant="secondary" disabled={lookupLoading} onClick={() => void handleIsbnLookup()}>
              {lookupLoading ? "검색 중…" : "검색"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={kyoboSearchKeyword() === ""}
              onClick={openKyoboSearchInNewWindow}
            >
              교보문고 새 창
            </Button>
          </div>
        </div>
        {lookupError ? (
          <Alert variant="destructive">
            <AlertTitle>검색 실패</AlertTitle>
            <AlertDescription>{lookupError}</AlertDescription>
          </Alert>
        ) : null}
        {lookupOk ? (
          <p className="text-sm text-muted-foreground">
            {mode === "edit" ? "비어 있던 항목을 채웠습니다." : "폼에 반영했습니다."} 필요하면 수정한 뒤 저장하세요.
          </p>
        ) : null}
        {coverPreview ? (
          <div className="flex justify-center pt-1">
            <img
              src={coverPreview}
              alt="표지 미리보기"
              className="max-h-48 max-w-[10rem] rounded-md border border-border object-contain shadow-sm"
            />
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">제목</Label>
        <Input
          ref={titleRef}
          id="title"
          name="title"
          required
          placeholder="책 제목"
          defaultValue={initial.title}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="authorsCsv">저자</Label>
        <Input
          ref={authorsCsvRef}
          id="authorsCsv"
          name="authorsCsv"
          placeholder="쉼표로 구분 (예: 김영하, 한강)"
          defaultValue={initial.authorsCsv}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="translatorsCsv">옮긴이</Label>
        <Input
          id="translatorsCsv"
          name="translatorsCsv"
          placeholder="쉼표로 구분 (복수 가능)"
          defaultValue={initial.translatorsCsv}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="apiSource">API소스</Label>
        <p className="text-xs text-muted-foreground">
          외부 메타 조회 출처 식별자(예: nl.go.kr, naver, googlebooks). ISBN 검색으로 채울 때 비어 있는 칸만 갱신됩니다.
        </p>
        <Input
          ref={apiSourceRef}
          id="apiSource"
          name="apiSource"
          placeholder="비우면 저장 시 NULL"
          defaultValue={initial.apiSource}
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="isbn">ISBN</Label>
        <Input
          ref={isbnRef}
          id="isbn"
          name="isbn"
          placeholder="비우면 없음"
          defaultValue={initial.isbn}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="publisher">출판사</Label>
          <Input ref={publisherRef} id="publisher" name="publisher" defaultValue={initial.publisher} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="publishedDate">출판일</Label>
          <Input
            ref={publishedDateRef}
            id="publishedDate"
            name="publishedDate"
            placeholder="자유 형식"
            defaultValue={initial.publishedDate}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="coverUrl">표지 URL</Label>
        <Input
          ref={coverUrlRef}
          id="coverUrl"
          name="coverUrl"
          type="url"
          placeholder="https://…"
          defaultValue={initial.coverUrl}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="priceKrw">가격 (원)</Label>
        <Input
          ref={priceKrwRef}
          id="priceKrw"
          name="priceKrw"
          type="number"
          min={0}
          step={1}
          placeholder="비우면 없음"
          defaultValue={initial.priceKrw}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="genreSlugs">장르 슬러그</Label>
        <p className="text-xs text-muted-foreground">쉼표로 구분합니다. 앱 허용 목록과 맞추면 필터에 유리합니다.</p>
        <Input
          ref={genreSlugsRef}
          id="genreSlugs"
          name="genreSlugs"
          placeholder="예: fiction, essay"
          defaultValue={initial.genreSlugs}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="literatureRegion">문학권·지역</Label>
          <Input
            ref={literatureRegionRef}
            id="literatureRegion"
            name="literatureRegion"
            placeholder="예: korean"
            defaultValue={initial.literatureRegion}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="originalLanguage">원작 언어 (BCP 47)</Label>
          <Input
            ref={originalLanguageRef}
            id="originalLanguage"
            name="originalLanguage"
            placeholder="예: ko, en"
            defaultValue={initial.originalLanguage}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">책 소개</Label>
        <Textarea
          ref={descriptionRef}
          id="description"
          name="description"
          rows={6}
          defaultValue={initial.description}
        />
      </div>

      {mode === "create" ? (
        <div className="space-y-2">
          <Label htmlFor="location">위치 (선택)</Label>
          <p className="text-xs text-muted-foreground">
            입력하면 관리자 계정의 내 서재에 이 도서가 함께 등록되고, 아래 위치가 저장됩니다. 비우면 공유 서지만 추가됩니다.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyLocationPreset("집")}
              className={cn(
                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                locationPreset === "집"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted/80"
              )}
            >
              집
            </button>
            <button
              type="button"
              onClick={() => applyLocationPreset("회사")}
              className={cn(
                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                locationPreset === "회사"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted/80"
              )}
            >
              회사
            </button>
          </div>
          <Input
            ref={locationInputRef}
            id="location"
            name="location"
            placeholder="집·회사 외 직접 입력"
            autoComplete="off"
            onChange={() => syncLocationPresetFromInput()}
          />
        </div>
      ) : null}

      <SubmitButton label={mode === "create" ? "도서 추가" : "저장"} />
    </form>
  );
}

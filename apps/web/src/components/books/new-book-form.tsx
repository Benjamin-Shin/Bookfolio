"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import type { BookLookupResult, UserBookDetail } from "@bookfolio/shared";
import { BOOK_FORMATS, READING_STATUSES } from "@bookfolio/shared";

import { BookCoverUploadField } from "@/components/books/book-cover-upload-field";
import {
  BookFormatChoiceFieldset,
  RatingChoiceFieldset,
  ReadingStatusChoiceFieldset
} from "@/components/books/shelf-choice-fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * @history
 * - 2026-03-28: ISBN 조회 안내 문구에서 Google Books 제거(네이버→국립 순).
 * - 2026-03-25: Cloudinary 표지 업로드 필드(`BookCoverUploadField`) 연동
 */
export function NewBookForm() {
  const router = useRouter();
  const [lookupIsbn, setLookupIsbn] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupOk, setLookupOk] = useState(false);
  /** ISBN 검색 후 리렌더되어도 POST에 실리도록 hidden은 state로 둡니다(defaultValue + ref만 쓰면 리렌더 시 비워질 수 있음). */
  const [metaFromLookup, setMetaFromLookup] = useState({
    isbn: "",
    coverUrl: "",
    publisher: "",
    publishedDate: ""
  });
  const [priceKrwInput, setPriceKrwInput] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const authorsRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  async function handleIsbnLookup() {
    const raw = lookupIsbn.trim();
    setLookupError(null);
    setLookupOk(false);

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
        setMetaFromLookup((prev) => ({ ...prev, coverUrl: "" }));
        setPriceKrwInput("");
        return;
      }

      const book = data as BookLookupResult;

      if (titleRef.current) titleRef.current.value = book.title;
      if (authorsRef.current) {
        authorsRef.current.value = book.authors.length > 0 ? book.authors.join(", ") : "";
      }
      setMetaFromLookup({
        isbn: book.isbn,
        coverUrl: book.coverUrl ?? "",
        publisher: book.publisher ?? "",
        publishedDate: book.publishedDate ?? ""
      });
      setPriceKrwInput(book.priceKrw != null ? String(book.priceKrw) : "");

      if (descriptionRef.current) descriptionRef.current.value = book.description ?? "";

      setLookupOk(true);
    } catch {
      setLookupError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      setMetaFromLookup((prev) => ({ ...prev, coverUrl: "" }));
      setPriceKrwInput("");
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    if (!form.reportValidity()) {
      return;
    }
    e.preventDefault();
    setSubmitError(null);

    const fd = new FormData(form);
    const title = String(fd.get("title") ?? "").trim();
    const authors = String(fd.get("authorsCsv") ?? "")
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
    const ratingRaw = String(fd.get("rating") ?? "").trim();
    const priceRaw = String(fd.get("priceKrw") ?? "").trim();
    let priceKrw: number | null = null;
    if (priceRaw) {
      const n = Number(priceRaw);
      if (Number.isFinite(n) && n >= 0) {
        priceKrw = Math.round(Math.min(n, 2_000_000_000));
      }
    }

    const payload = {
      title,
      authors,
      format: String(fd.get("format") ?? "paper") as "paper" | "ebook",
      readingStatus: String(fd.get("readingStatus") ?? "unread") as
        | "unread"
        | "reading"
        | "completed"
        | "paused"
        | "dropped",
      rating: ratingRaw ? Number(ratingRaw) : null,
      isbn: String(fd.get("isbn") ?? "").trim() || null,
      coverUrl: String(fd.get("coverUrl") ?? "").trim() || null,
      publisher: String(fd.get("publisher") ?? "").trim() || null,
      publishedDate: String(fd.get("publishedDate") ?? "").trim() || null,
      description: (() => {
        const d = String(fd.get("description") ?? "").trim();
        return d ? d : null;
      })(),
      priceKrw,
      location: (() => {
        const loc = String(fd.get("location") ?? "").trim();
        return loc ? loc : null;
      })()
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/me/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await res.json()) as UserBookDetail | { error?: string };
      if (!res.ok) {
        const msg =
          "error" in data && typeof data.error === "string" ? data.error : "등록하지 못했습니다.";
        setSubmitError(msg);
        return;
      }
      const created = data as UserBookDetail;
      router.push(`/dashboard/books/${created.id}` as Route);
      router.refresh();
    } catch {
      setSubmitError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={(e) => void handleSubmit(e)}>
      <div className="space-y-3 rounded-lg border border-border/80 bg-muted/30 p-4">
        <div className="space-y-1">
          <Label htmlFor="isbn-lookup">ISBN으로 검색</Label>
          <p className="text-xs text-muted-foreground">
            네이버 책검색 → 국립중앙도서관 순으로 시도합니다. 환경 변수로 켜 둔 제공자만 사용됩니다.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <Input
              id="isbn-lookup"
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
          <Button type="button" variant="secondary" disabled={lookupLoading} onClick={() => void handleIsbnLookup()}>
            {lookupLoading ? "검색 중…" : "검색"}
          </Button>
        </div>
        {lookupError ? (
          <Alert variant="destructive">
            <AlertTitle>검색 실패</AlertTitle>
            <AlertDescription>{lookupError}</AlertDescription>
          </Alert>
        ) : null}
        {lookupOk ? (
          <p className="text-sm text-muted-foreground">메타데이터를 폼에 반영했습니다. 필요하면 수정한 뒤 등록하세요.</p>
        ) : null}
      </div>

      <BookCoverUploadField
        coverUrl={metaFromLookup.coverUrl}
        onCoverUrlChange={(url) => setMetaFromLookup((prev) => ({ ...prev, coverUrl: url }))}
        disabled={submitting}
      />

      <input type="hidden" name="isbn" value={metaFromLookup.isbn} />
      <input type="hidden" name="publisher" value={metaFromLookup.publisher} />
      <input type="hidden" name="publishedDate" value={metaFromLookup.publishedDate} />

      <div className="space-y-2">
        <Label htmlFor="priceKrw">가격 (원)</Label>
        <p className="text-xs text-muted-foreground">
          ISBN 검색 시 제공자가 알려준 가격이 채워집니다(참고용). 직접 수정·비울 수 있습니다.
        </p>
        <Input
          id="priceKrw"
          name="priceKrw"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          placeholder="예: 16000"
          value={priceKrwInput}
          onChange={(e) => setPriceKrwInput(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">제목</Label>
        <Input ref={titleRef} id="title" name="title" required placeholder="책 제목" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="authorsCsv">저자</Label>
        <Input ref={authorsRef} id="authorsCsv" name="authorsCsv" required placeholder="예: 김영하, 한강" />
      </div>
      <BookFormatChoiceFieldset defaultFormat={BOOK_FORMATS[0]} />
      <ReadingStatusChoiceFieldset defaultStatus={READING_STATUSES[0]} />
      <RatingChoiceFieldset defaultRating={null} />
      <div className="space-y-2">
        <Label htmlFor="location">위치 (선택)</Label>
        <p className="text-xs text-muted-foreground">집·회사·빌려준 곳 등 이 권이 있는 곳을 적어 두면 나중에 찾기 쉽습니다.</p>
        <Input id="location" name="location" placeholder="예: 집 / 회사 책장" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">책 소개</Label>
        <Textarea
          ref={descriptionRef}
          id="description"
          name="description"
          rows={4}
          placeholder="ISBN 검색 시 자동으로 채워질 수 있습니다."
        />
      </div>

      {submitError ? (
        <Alert variant="destructive">
          <AlertTitle>등록할 수 없습니다</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={submitting}>
        {submitting ? "등록 중…" : "등록하기"}
      </Button>
    </form>
  );
}

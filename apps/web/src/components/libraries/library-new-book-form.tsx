"use client";

import type { BookLookupResult } from "@bookfolio/shared";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  libraryId: string;
};

export function LibraryNewBookForm({ libraryId }: Props) {
  const router = useRouter();
  const [lookupIsbn, setLookupIsbn] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupOk, setLookupOk] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [metaFromLookup, setMetaFromLookup] = useState({
    isbn: "",
    coverUrl: "",
    publisher: "",
    publishedDate: "",
  });
  const [priceKrwInput, setPriceKrwInput] = useState("");
  const [title, setTitle] = useState("");
  const [authorsCsv, setAuthorsCsv] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
        body: JSON.stringify({ isbn: raw }),
      });

      const data = (await res.json()) as BookLookupResult | { error?: string };

      if (!res.ok) {
        const message =
          "error" in data && typeof data.error === "string"
            ? data.error
            : "도서 정보를 가져오지 못했습니다.";
        setLookupError(message);
        setCoverPreview(null);
        setPriceKrwInput("");
        return;
      }

      const book = data as BookLookupResult;

      setTitle(book.title);
      setAuthorsCsv(book.authors.length > 0 ? book.authors.join(", ") : "");
      setMetaFromLookup({
        isbn: book.isbn,
        coverUrl: book.coverUrl ?? "",
        publisher: book.publisher ?? "",
        publishedDate: book.publishedDate ?? "",
      });
      setPriceKrwInput(book.priceKrw != null ? String(book.priceKrw) : "");
      setDescription(book.description ?? "");
      setCoverPreview(book.coverUrl);
      setLookupOk(true);
    } catch {
      setLookupError(
        "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      );
      setCoverPreview(null);
      setPriceKrwInput("");
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const t = title.trim() || titleRef.current?.value.trim() || "";
    const authors =
      authorsCsv.trim() ||
      authorsRef.current?.value
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean)
        .join(", ") ||
      "";
    const authorList = authors
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    if (!t) {
      setFormError("제목을 입력해 주세요.");
      return;
    }
    if (authorList.length === 0) {
      setFormError("저자를 한 명 이상 입력해 주세요.");
      return;
    }

    const priceRaw = priceKrwInput.trim();
    const priceKrw =
      priceRaw === ""
        ? null
        : Number.isFinite(Number(priceRaw))
          ? Math.round(Number(priceRaw))
          : null;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/me/libraries/${libraryId}/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isbn: metaFromLookup.isbn || null,
          title: t,
          authors: authorList,
          publisher: metaFromLookup.publisher || null,
          publishedDate: metaFromLookup.publishedDate || null,
          coverUrl: metaFromLookup.coverUrl || null,
          description: description.trim() || null,
          priceKrw,
          location: location.trim() || null,
          memo: memo.trim() || null,
        }),
      });
      const data = (await res.json()) as { bookId?: string; error?: string };
      if (!res.ok) {
        setFormError(data.error ?? "등록하지 못했습니다.");
        return;
      }
      if (data.bookId) {
        router.push(
          `/dashboard/libraries/${libraryId}/books/${data.bookId}` as Route,
        );
        router.refresh();
      }
    } catch {
      setFormError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={(e) => void handleSubmit(e)}>
      <div className="space-y-3 rounded-lg border border-border/80 bg-muted/30 p-4">
        <div className="space-y-1">
          <Label htmlFor="lib-isbn-lookup">ISBN으로 검색</Label>
          <p className="text-xs text-muted-foreground">
            개인 서가와 동일한 출처로 메타데이터를 가져옵니다.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <Input
              id="lib-isbn-lookup"
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
          <Button
            type="button"
            variant="secondary"
            disabled={lookupLoading}
            onClick={() => void handleIsbnLookup()}
          >
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
          <p className="text-sm text-muted-foreground">
            메타데이터를 폼에 반영했습니다. 필요하면 수정한 뒤 등록하세요.
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

      {formError ? (
        <p className="text-sm text-destructive">{formError}</p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="lib-price">가격 (원, 선택)</Label>
        <Input
          id="lib-price"
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
        <Label htmlFor="lib-title">제목</Label>
        <Input
          ref={titleRef}
          id="lib-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="책 제목"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lib-authors">저자</Label>
        <Input
          ref={authorsRef}
          id="lib-authors"
          value={authorsCsv}
          onChange={(e) => setAuthorsCsv(e.target.value)}
          required
          placeholder="예: 김영하, 한강"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lib-loc">위치 (선택)</Label>
        <p className="text-xs text-muted-foreground">
          개인 소장(user_books)에 저장되며, 멤버에게 함께 표시됩니다.
        </p>
        <Input
          id="lib-loc"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="예: 거실 책장"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lib-memo">메모 (선택)</Label>
        <Textarea
          id="lib-memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lib-desc">책 소개</Label>
        <Textarea
          ref={descriptionRef}
          id="lib-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? "등록 중…" : "모임서가에 추가"}
      </Button>
    </form>
  );
}

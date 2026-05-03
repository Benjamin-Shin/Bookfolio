"use client";

import type { BookOneLinerRow } from "@bookfolio/shared";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * 공유 서지(`books`)에 연결된 공개 한줄평 — 캐논 정보 패널 안에 삽입.
 *
 * @history
 * - 2026-05-04: `userBookId` 빈 문자열이면 `POST /api/me/canon-books/:bookId/my-one-liner`(내 서가 비소장)
 * - 2026-05-04: `canManage` — 비소장·열람만일 때 입력 UI 숨김
 * - 2026-05-03: `BookDetailSidecars`에서 분리·캐논 패널로 이전
 */
export function BookOneLinersInCanonPanel(props: {
  /** 비어 있으면 캐논 `bookId`만으로 저장 API 사용 */
  userBookId: string;
  bookId: string;
  /** false면 목록만(내 `user_books`가 없을 때). 기본 true */
  canManage?: boolean;
}) {
  const { userBookId, bookId, canManage = true } = props;
  const writeByUserBook = userBookId.trim().length > 0;
  const [oneLiners, setOneLiners] = useState<BookOneLinerRow[]>([]);
  const [myOneLiner, setMyOneLiner] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadOneLiners = useCallback(async () => {
    const bid = bookId.trim();
    if (!bid) {
      setOneLiners([]);
      return;
    }
    const res = await fetch(`/api/books/${bid}/one-liners`, {
      credentials: "include",
    });
    if (!res.ok) {
      throw new Error(
        (await res.json().catch(() => ({}))).error ??
          "한줄평을 불러오지 못했습니다.",
      );
    }
    setOneLiners((await res.json()) as BookOneLinerRow[]);
  }, [bookId]);

  useEffect(() => {
    void loadOneLiners().catch((e) =>
      setErr(e instanceof Error ? e.message : "불러오기 실패"),
    );
  }, [loadOneLiners]);

  const postJson = async (url: string, body: unknown) => {
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(typeof j.error === "string" ? j.error : "요청 실패");
    }
    return res;
  };

  const oneLinerWriteUrl = writeByUserBook
    ? `/api/me/books/${encodeURIComponent(userBookId.trim())}/one-liner`
    : `/api/me/canon-books/${encodeURIComponent(bookId.trim())}/my-one-liner`;

  const saveOneLiner = async () => {
    setBusy(true);
    setErr(null);
    try {
      await postJson(oneLinerWriteUrl, {
        action: "upsert",
        body: myOneLiner,
      });
      setMyOneLiner("");
      await loadOneLiners();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  };

  const clearOneLiner = async () => {
    setBusy(true);
    setErr(null);
    try {
      await postJson(oneLinerWriteUrl, {
        action: "clear",
      });
      await loadOneLiners();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "삭제 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#1A3C2F]/12 bg-[#F8F9FA]/80 p-5 md:p-6">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-serif text-lg font-medium text-[#1A3C2F]">
            공개 한줄평
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-[#675d53]">
            이 책(`books`)에 붙는 짧은 감상입니다. 저장하면 같은 도서를 본 다른
            회원도 볼 수 있습니다.
          </p>
        </div>
      </div>

      {err ? (
        <p className="mb-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </p>
      ) : null}

      {canManage ? (
        <div className="space-y-3">
          <Label htmlFor="my-one-liner-canon" className="text-[#434843]">
            내 한줄평 (500자)
          </Label>
          <Textarea
            id="my-one-liner-canon"
            rows={2}
            value={myOneLiner}
            onChange={(e) => setMyOneLiner(e.target.value)}
            disabled={busy}
            placeholder="짧게 남겨 보세요."
            className="resize-none border-[#1A3C2F]/15 bg-white"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={busy}
              className="bg-[#1A3C2F] text-white hover:bg-[#1A3C2F]/90"
              onClick={() => void saveOneLiner()}
            >
              저장
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              className="border-[#1A3C2F]/25 bg-white text-[#1A3C2F]"
              onClick={() => void clearOneLiner()}
            >
              삭제
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-[#675d53]">
          내 서가에 이 도서를 추가하면 한줄평을 남길 수 있습니다.
        </p>
      )}

      <ul className={`space-y-3 ${canManage ? "mt-6" : "mt-4"}`}>
        {oneLiners.length === 0 ? (
          <li className="rounded-lg border border-dashed border-[#1A3C2F]/20 bg-white/60 px-4 py-6 text-center text-sm text-[#675d53]">
            아직 한줄평이 없습니다.
          </li>
        ) : (
          oneLiners.map((o) => (
            <li
              key={`${o.userId}-${o.updatedAt}`}
              className="rounded-lg border border-[#1A3C2F]/10 bg-white px-4 py-3 shadow-sm"
            >
              <p className="text-sm font-medium text-[#1A3C2F]">
                {o.displayName ?? "사용자"}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-[#434843]">
                {o.body}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

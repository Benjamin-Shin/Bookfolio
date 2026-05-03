import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireAdmin } from "@/lib/auth/require-admin";
import { listAllSiteAnnouncementsAdmin } from "@/lib/site/announcements-repository";

import {
  createAnnouncementFromForm,
  deleteAnnouncementFromForm,
  updateAnnouncementFromForm,
} from "./actions";

function isoToDatetimeLocalValue(iso: string | null): string {
  if (!iso) {
    return "";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 관리자 — 전역 공지 작성·목록.
 *
 * @history
 * - 2026-05-04: 개인 알림 발송 UI 제거(사용자 관리로 이동)
 */
export default async function AdminAnnouncementsPage() {
  await requireAdmin();

  let rows: Awaited<ReturnType<typeof listAllSiteAnnouncementsAdmin>> = [];
  let loadError: string | null = null;
  try {
    rows = await listAllSiteAnnouncementsAdmin();
  } catch (e) {
    loadError = e instanceof Error ? e.message : "목록을 불러오지 못했습니다.";
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">공지사항</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          헤더·
          <Link href="/announcements" className="underline underline-offset-4">
            공지 목록 페이지
          </Link>
          에 게시 중인 항목만 노출됩니다. 개인 알림은{" "}
          <Link href="/admin/users" className="underline underline-offset-4">
            사용자 관리
          </Link>
          에서 발송합니다. API:&nbsp;
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            GET /api/announcements
          </code>
          ,&nbsp;
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            GET·POST /api/admin/announcements
          </code>
          ,&nbsp;
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            POST /api/admin/user-notifications
          </code>
        </p>
      </div>

      <section className="rounded-lg border border-border/80 bg-muted/10 p-4 md:p-6">
        <h2 className="mb-4 text-base font-semibold">새 공지 작성 (전역)</h2>
        <form action={createAnnouncementFromForm} className="grid max-w-xl gap-4">
          <div className="grid gap-2">
            <Label htmlFor="new-title">제목</Label>
            <Input id="new-title" name="title" required placeholder="제목" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-body">본문</Label>
            <Textarea id="new-body" name="body" required rows={5} placeholder="본문" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="new-sort">표시 순서 (작을수록 앞)</Label>
              <Input id="new-sort" name="sortOrder" type="number" defaultValue={0} />
            </div>
            <div className="flex items-end gap-2 pb-0.5">
              <input
                id="new-published"
                name="isPublished"
                type="checkbox"
                className="size-4"
                suppressHydrationWarning
              />
              <Label htmlFor="new-published" className="font-normal">
                즉시 게시
              </Label>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="new-pub-at">게시 시작(선택, 미입력 시 즉시)</Label>
              <Input id="new-pub-at" name="publishedAt" type="datetime-local" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-exp">만료(선택)</Label>
              <Input id="new-exp" name="expiresAt" type="datetime-local" />
            </div>
          </div>
          <Button type="submit" className="w-fit">
            등록
          </Button>
        </form>
      </section>

      {loadError ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {loadError}
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-base font-semibold">전역 공지 목록</h2>
        {rows.length === 0 && !loadError ? (
          <p className="text-sm text-muted-foreground">등록된 공지가 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {rows.map((row) => (
              <article
                key={row.id}
                className="rounded-lg border border-border/80 bg-card p-4 shadow-sm"
              >
                <header className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className={
                      row.is_published
                        ? "rounded bg-emerald-500/15 px-2 py-0.5 font-medium text-emerald-800"
                        : "rounded bg-muted px-2 py-0.5 font-medium"
                    }
                  >
                    {row.is_published ? "게시" : "비공개"}
                  </span>
                  <span>순서 {row.sort_order}</span>
                  <span className="font-mono text-[11px]" title={row.id}>
                    id {row.id.slice(0, 8)}…
                  </span>
                </header>
                <form action={updateAnnouncementFromForm} className="grid gap-3">
                  <input type="hidden" name="id" value={row.id} />
                  <Input name="title" defaultValue={row.title} required />
                  <Textarea name="body" defaultValue={row.body} required rows={4} />
                  <div className="flex flex-wrap gap-3">
                    <div className="grid gap-1">
                      <Label className="text-xs text-muted-foreground">게시 상태</Label>
                      <select
                        name="isPublished"
                        defaultValue={row.is_published ? "true" : "false"}
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                        suppressHydrationWarning
                      >
                        <option value="true">게시</option>
                        <option value="false">비공개</option>
                      </select>
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs text-muted-foreground">순서</Label>
                      <Input
                        name="sortOrder"
                        type="number"
                        defaultValue={row.sort_order}
                        className="w-24"
                      />
                    </div>
                    <div className="grid min-w-[10rem] gap-1">
                      <Label className="text-xs text-muted-foreground">게시 시작</Label>
                      <Input
                        name="publishedAt"
                        type="datetime-local"
                        defaultValue={isoToDatetimeLocalValue(row.published_at)}
                      />
                    </div>
                    <div className="grid min-w-[10rem] gap-1">
                      <Label className="text-xs text-muted-foreground">만료</Label>
                      <Input
                        name="expiresAt"
                        type="datetime-local"
                        defaultValue={isoToDatetimeLocalValue(row.expires_at)}
                      />
                    </div>
                  </div>
                  <Button type="submit" size="sm" className="w-fit">
                    저장
                  </Button>
                </form>
                <form
                  action={deleteAnnouncementFromForm}
                  className="mt-3 border-t border-border/60 pt-3"
                >
                  <input type="hidden" name="id" value={row.id} />
                  <Button type="submit" variant="destructive" size="sm">
                    삭제
                  </Button>
                </form>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

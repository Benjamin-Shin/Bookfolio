import type { Route } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { MyLibraryBookReadingForm } from "@/components/libraries/my-library-book-reading-form";
import { UnshareFromLibraryButton } from "@/components/libraries/unshare-from-library-button";
import { READING_STATUS_LABELS } from "@/components/libraries/reading-status-labels";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLibraryAggregatedBook } from "@/lib/libraries/repository";

type PageProps = {
  params: Promise<{ libraryId: string; bookId: string }>;
};

export default async function SharedLibraryBookDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { libraryId, bookId } = await params;
  const ctx = { userId: session.user.id, useAdmin: true } as const;

  const book = await getLibraryAggregatedBook(libraryId, bookId, session.user.id, ctx);
  if (!book) {
    notFound();
  }

  const myOwner = book.owners.find((o) => o.userId === session.user.id);
  const myReadingStatus = myOwner?.readingStatus ?? "unread";
  const ownerLabels = book.owners.map((o) => o.name?.trim() || o.email).join(", ");

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
          <Link href={`/dashboard/libraries/${libraryId}` as Route}>← 서재로</Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative mx-auto h-48 w-32 shrink-0 overflow-hidden rounded-lg border bg-muted sm:mx-0">
            {book.coverUrl ? (
              <Image src={book.coverUrl} alt="" fill className="object-cover" sizes="128px" unoptimized />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold leading-snug">{book.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {book.authors.length > 0 ? book.authors.join(", ") : "저자 미상"}
            </p>
            {book.isbn ? <p className="mt-1 text-xs text-muted-foreground">ISBN {book.isbn}</p> : null}
            <p className="mt-2 text-sm">
              <span className="text-muted-foreground">소유자 </span>
              {ownerLabels}
            </p>
          </div>
        </div>
      </div>

      {myOwner ? (
        <Card className="mb-6 border-border/80">
          <CardHeader>
            <CardTitle className="text-lg">내 읽기 상태</CardTitle>
            <CardDescription>개인 서재에 저장된 읽기 상태를 바꿉니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <MyLibraryBookReadingForm
              libraryId={libraryId}
              bookId={bookId}
              initialStatus={myReadingStatus}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card className="mb-6 border-border/80">
        <CardHeader>
          <CardTitle className="text-lg">소유자별</CardTitle>
          <CardDescription>각자 개인 서재에 올린 한 권 기준입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">멤버</th>
                  <th className="pb-2 pr-4 font-medium">상태</th>
                  <th className="pb-2 font-medium">위치·메모</th>
                </tr>
              </thead>
              <tbody>
                {book.owners.map((o) => (
                  <tr key={o.userBookId} className="border-b border-border/60">
                    <td className="py-2 pr-4">
                      <span className="font-medium">{o.name?.trim() || o.email}</span>
                      {o.userId === session.user.id ? (
                        <span className="ml-2 text-xs text-muted-foreground">(나)</span>
                      ) : null}
                    </td>
                    <td className="py-2 pr-4">{READING_STATUS_LABELS[o.readingStatus]}</td>
                    <td className="py-2 text-muted-foreground">
                      {[o.location, o.memo].filter(Boolean).join(" · ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {myOwner ? (
        <UnshareFromLibraryButton libraryId={libraryId} bookId={bookId} />
      ) : null}
    </main>
  );
}

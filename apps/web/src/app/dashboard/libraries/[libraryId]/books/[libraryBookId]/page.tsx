import type { Route } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { MyLibraryBookReadingForm } from "@/components/libraries/my-library-book-reading-form";
import { READING_STATUS_LABELS } from "@/components/libraries/reading-status-labels";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLibraryBook } from "@/lib/libraries/repository";

type PageProps = {
  params: Promise<{ libraryId: string; libraryBookId: string }>;
};

export default async function LibraryBookDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { libraryId, libraryBookId } = await params;
  const ctx = { userId: session.user.id, useAdmin: true } as const;

  const book = await getLibraryBook(libraryBookId, session.user.id, ctx);
  if (!book || book.libraryId !== libraryId) {
    notFound();
  }

  const myState = book.memberStates.find((m) => m.userId === session.user.id);
  const myReadingStatus = myState?.readingStatus ?? "unread";

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
            {book.location ? <p className="mt-2 text-sm">위치: {book.location}</p> : null}
            {book.memo ? (
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{book.memo}</p>
            ) : null}
          </div>
        </div>
      </div>

      <Card className="mb-6 border-border/80">
        <CardHeader>
          <CardTitle className="text-lg">내 읽기 상태</CardTitle>
          <CardDescription>이 권에 대해 본인만의 상태를 저장합니다. 다른 멤버와 독립입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <MyLibraryBookReadingForm
            libraryId={libraryId}
            libraryBookId={libraryBookId}
            initialStatus={myReadingStatus}
          />
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-lg">멤버별 상태</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">멤버</th>
                  <th className="pb-2 font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {book.memberStates.map((m) => (
                  <tr key={m.userId} className="border-b border-border/60">
                    <td className="py-2 pr-4">
                      <span className="font-medium">{m.name?.trim() || m.email}</span>
                      {m.userId === session.user.id ? (
                        <span className="ml-2 text-xs text-muted-foreground">(나)</span>
                      ) : null}
                    </td>
                    <td className="py-2">{READING_STATUS_LABELS[m.readingStatus]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

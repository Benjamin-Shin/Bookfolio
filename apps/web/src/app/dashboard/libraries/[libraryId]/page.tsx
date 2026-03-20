import type { Route } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { DeleteLibraryButton } from "@/components/libraries/delete-library-button";
import { LibraryMembersPanel } from "@/components/libraries/library-members-panel";
import { LIBRARY_KIND_LABELS } from "@/components/libraries/reading-status-labels";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLibrary, listLibraryBooks, listLibraryMembers } from "@/lib/libraries/repository";

type PageProps = {
  params: Promise<{ libraryId: string }>;
};

export default async function LibraryDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { libraryId } = await params;
  const ctx = { userId: session.user.id, useAdmin: true } as const;

  const lib = await getLibrary(libraryId, session.user.id, ctx);
  if (!lib) {
    notFound();
  }

  const [members, books] = await Promise.all([
    listLibraryMembers(libraryId, session.user.id, ctx),
    listLibraryBooks(libraryId, session.user.id, ctx)
  ]);

  const isOwner = lib.myRole === "owner";

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {LIBRARY_KIND_LABELS[lib.kind]}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{lib.name}</h1>
          {lib.description ? <p className="mt-1 text-sm text-muted-foreground">{lib.description}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={"/dashboard/libraries" as Route}>목록</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/dashboard/libraries/${libraryId}/books/new` as Route}>책 추가</Link>
          </Button>
          {isOwner ? <DeleteLibraryButton libraryId={libraryId} /> : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-lg">멤버</CardTitle>
            <CardDescription>소유자만 이메일로 멤버를 추가할 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <LibraryMembersPanel
              libraryId={libraryId}
              initialMembers={members}
              currentUserId={session.user.id}
              isOwner={isOwner}
            />
          </CardContent>
        </Card>

        <Card className="border-border/80 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">책</CardTitle>
            <CardDescription>
              같은 책은 한 줄로 묶이며, 소유자 이름이 표시됩니다. 올린 책만 보입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {books.length === 0 ? (
              <p className="text-sm text-muted-foreground">아직 책이 없습니다.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {books.map((b) => {
                  const ownerNames = b.owners.map((o) => o.name?.trim() || o.email).join(", ");
                  return (
                    <li key={b.bookId}>
                      <Link
                        href={`/dashboard/libraries/${libraryId}/books/${b.bookId}` as Route}
                        className="flex gap-3 rounded-lg border border-border/80 p-3 transition-colors hover:bg-muted/40"
                      >
                        <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded bg-muted">
                          {b.coverUrl ? (
                            <Image src={b.coverUrl} alt="" fill className="object-cover" sizes="56px" unoptimized />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 font-medium leading-snug">{b.title}</p>
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {b.authors.length > 0 ? b.authors.join(", ") : "저자 미상"}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">소유자: {ownerNames}</p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

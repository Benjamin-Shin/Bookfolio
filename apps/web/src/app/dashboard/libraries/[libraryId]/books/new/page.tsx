import type { Route } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { LibraryNewBookForm } from "@/components/libraries/library-new-book-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getLibrary } from "@/lib/libraries/repository";

type PageProps = {
  params: Promise<{ libraryId: string }>;
};

export default async function LibraryNewBookPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { libraryId } = await params;
  const lib = await getLibrary(libraryId, session.user.id, {
    userId: session.user.id,
    useAdmin: true,
  });
  if (!lib) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 md:py-12">
      <Card className="border-border/80">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>모임서가에 책 추가</CardTitle>
            <CardDescription>
              「{lib.name}」에 물리적 한 권을 등록합니다.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/libraries/${libraryId}` as Route}>
              서가로
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <LibraryNewBookForm libraryId={libraryId} />
        </CardContent>
      </Card>
    </main>
  );
}

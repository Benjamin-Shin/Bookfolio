import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getMergedAppUserPoliciesForUser } from "@/lib/auth/app-user-policies";
import { countLibrariesCreatedByUser } from "@/lib/libraries/repository";
import { NewLibraryForm } from "@/components/libraries/new-library-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * @history
 * - 2026-03-25: 공동서가 생성 상한(`policies_json`) 반영해 폼에 전달
 */
export default async function NewLibraryPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const ctx = { userId: session.user.id, useAdmin: true } as const;
  const [policies, createdCount] = await Promise.all([
    getMergedAppUserPoliciesForUser(session.user.id),
    countLibrariesCreatedByUser(session.user.id, ctx),
  ]);
  const canCreateMore = createdCount < policies.sharedLibraryCreateLimit;

  return (
    <main className="mx-auto max-w-lg px-4 py-8 md:py-12">
      <Card className="border-border/80">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>새 공동서가</CardTitle>
            <CardDescription>
              이름과 종류를 정한 뒤 멤버를 이메일로 초대할 수 있습니다.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href={"/dashboard/libraries" as Route}>목록</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <NewLibraryForm
            canCreateMore={canCreateMore}
            createLimit={policies.sharedLibraryCreateLimit}
            createdCount={createdCount}
          />
        </CardContent>
      </Card>
    </main>
  );
}

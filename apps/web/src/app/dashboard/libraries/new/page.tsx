import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { NewLibraryForm } from "@/components/libraries/new-library-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewLibraryPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8 md:py-12">
      <Card className="border-border/80">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>새 공동서재</CardTitle>
            <CardDescription>이름과 종류를 정한 뒤 멤버를 이메일로 초대할 수 있습니다.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href={"/dashboard/libraries" as Route}>목록</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <NewLibraryForm />
        </CardContent>
      </Card>
    </main>
  );
}

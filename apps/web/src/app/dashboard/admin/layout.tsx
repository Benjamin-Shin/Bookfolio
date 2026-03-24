import Link from "next/link";
import type { Route } from "next";

import { requireAdmin } from "@/lib/auth/require-admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
      <nav className="mb-8 flex flex-wrap gap-2 border-b border-border/60 pb-4 text-sm">
        <Link
          href="/dashboard/admin"
          className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          관리 홈
        </Link>
        <Link
          href="/dashboard/admin/users"
          className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          사용자 관리
        </Link>
        <Link
          href="/dashboard/admin/books"
          className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          도서 관리
        </Link>
        <Link
          href={"/dashboard/admin/authors" as Route}
          className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          저자 관리
        </Link>
        <Link
          href="/dashboard"
          className="ml-auto rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          내 서재로
        </Link>
      </nav>
      {children}
    </div>
  );
}

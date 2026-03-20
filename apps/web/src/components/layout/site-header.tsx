import Link from "next/link";

import { auth } from "@/auth";
import { AdminHeaderMenu } from "@/components/layout/admin-header-menu";
import { HeaderAccount } from "@/components/layout/header-account";
import { Button } from "@/components/ui/button";
import { getAppProfile } from "@/lib/auth/app-profiles";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;

  const profile = user?.id ? await getAppProfile(user.id) : null;
  const displayLabel =
    profile?.displayName?.trim() || user?.name?.trim() || user?.email?.trim() || "사용자";

  return (
    <header className="border-b border-border/60 bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-foreground">
          Bookfolio
        </Link>
        <nav className="flex min-w-0 items-center gap-2">
          {user?.id && user.email ? (
            <>
              {user.role === "ADMIN" ? <AdminHeaderMenu /> : null}
              <HeaderAccount email={user.email} displayLabel={displayLabel} initialProfile={profile} />
              <form action="/auth/signout" method="post">
                <Button type="submit" variant="ghost" size="sm">
                  로그아웃
                </Button>
              </form>
            </>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">로그인</Link>
            </Button>
          )}
          <Button size="sm" asChild>
            <Link href="/dashboard">내 서재</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

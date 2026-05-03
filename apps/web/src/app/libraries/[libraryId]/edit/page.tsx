import { redirect, notFound } from "next/navigation";

import { auth } from "@/auth";
import { getLibrary } from "@/lib/libraries/repository";

type PageProps = {
  params: Promise<{ libraryId: string }>;
};

/**
 * 예전 「모임서가 수정」전용 URL — 상세의 팝업으로 통일되어 상세로만 보냅니다.
 *
 * @history
 * - 2026-05-04: `/libraries/:id` 리다이렉트 — `LibraryEditDialog`로 대체
 * - 2026-05-04: 신규
 */
export default async function LibraryEditPage({ params }: PageProps) {
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

  redirect(`/libraries/${libraryId}`);
}

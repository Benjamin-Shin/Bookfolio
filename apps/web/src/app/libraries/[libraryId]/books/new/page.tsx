import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getLibrary } from "@/lib/libraries/repository";

type PageProps = {
  params: Promise<{ libraryId: string }>;
};

/**
 * 모임서가에는 직접 도서를 추가하지 않습니다. 내 서가에서 등록·연결된 소장만 합쳐집니다.
 *
 * @history
 * - 2026-05-04: 내 서가 연결 모델에 맞춰 상세로만 리다이렉트
 */
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
    redirect("/libraries");
  }

  redirect(`/libraries/${libraryId}`);
}

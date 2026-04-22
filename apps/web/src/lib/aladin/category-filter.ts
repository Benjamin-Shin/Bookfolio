import type { AladinCategoryOption } from "@/lib/aladin/categories";

export type AladinCategoryFilterSelections = {
  mall?: string;
  depth1?: string;
  depth2?: string;
  depth3?: string;
};

export type AladinCategoryFilterOptions = {
  malls: string[];
  depth1: string[];
  depth2: string[];
  depth3: string[];
  categoryId: number;
};

function uniqueNonEmpty(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

function pickCategoryId(
  list: AladinCategoryOption[],
  selections: AladinCategoryFilterSelections
): number {
  const mall = selections.mall?.trim() || "";
  const depth1 = selections.depth1?.trim() || "";
  const depth2 = selections.depth2?.trim() || "";
  const depth3 = selections.depth3?.trim() || "";
  if (!mall) {
    return 0;
  }

  const byMall = list.filter((c) => c.mall === mall);
  if (!byMall.length) {
    return 0;
  }
  if (!depth1) {
    return byMall.find((c) => !c.depth1)?.categoryId ?? byMall[0]!.categoryId;
  }

  const byDepth1 = byMall.filter((c) => c.depth1 === depth1);
  if (!byDepth1.length) {
    return byMall[0]!.categoryId;
  }
  if (!depth2) {
    return byDepth1.find((c) => !c.depth2)?.categoryId ?? byDepth1[0]!.categoryId;
  }

  const byDepth2 = byDepth1.filter((c) => c.depth2 === depth2);
  if (!byDepth2.length) {
    return byDepth1[0]!.categoryId;
  }
  if (!depth3) {
    return byDepth2.find((c) => !c.depth3)?.categoryId ?? byDepth2[0]!.categoryId;
  }

  return byDepth2.find((c) => c.depth3 === depth3)?.categoryId ?? byDepth2[0]!.categoryId;
}

/**
 * 알라딘 카테고리의 4단계(몰/1/2/3Depth) 선택 옵션과 최종 `categoryId`를 계산합니다.
 *
 * @history
 * - 2026-04-22: 단계형 카테고리 필터 유틸 추가
 */
export function buildAladinCategoryFilterOptions(
  all: AladinCategoryOption[],
  selections: AladinCategoryFilterSelections
): AladinCategoryFilterOptions {
  const categories = all.filter((c) => c.categoryId !== 0);
  const malls = uniqueNonEmpty(categories.map((c) => c.mall));
  const mall = selections.mall?.trim() || "";
  const byMall = mall ? categories.filter((c) => c.mall === mall) : [];

  const depth1 = uniqueNonEmpty(byMall.map((c) => c.depth1));
  const selectedDepth1 = selections.depth1?.trim() || "";
  const byDepth1 = selectedDepth1 ? byMall.filter((c) => c.depth1 === selectedDepth1) : [];

  const depth2 = uniqueNonEmpty(byDepth1.map((c) => c.depth2));
  const selectedDepth2 = selections.depth2?.trim() || "";
  const byDepth2 = selectedDepth2 ? byDepth1.filter((c) => c.depth2 === selectedDepth2) : [];

  const depth3 = uniqueNonEmpty(byDepth2.map((c) => c.depth3));
  const categoryId = pickCategoryId(categories, selections);

  return {
    malls,
    depth1,
    depth2,
    depth3,
    categoryId
  };
}


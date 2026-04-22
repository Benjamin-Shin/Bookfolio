"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  actionPath: string;
  malls: string[];
  depth1: string[];
  depth2: string[];
  depth3: string[];
  selectedMall: string;
  selectedDepth1: string;
  selectedDepth2: string;
  selectedDepth3: string;
};

/**
 * 알라딘 4단계 카테고리 필터(선택 즉시 쿼리 반영).
 *
 * @history
 * - 2026-04-22: 적용 버튼 없이 선택 즉시 라우팅되도록 추가
 */
export function AladinCategoryCascadeFilter({
  actionPath,
  malls,
  depth1,
  depth2,
  depth3,
  selectedMall,
  selectedDepth1,
  selectedDepth2,
  selectedDepth3
}: Props) {
  const router = useRouter();
  const [mall, setMall] = useState(selectedMall);
  const [d1, setD1] = useState(selectedDepth1);
  const [d2, setD2] = useState(selectedDepth2);
  const [d3, setD3] = useState(selectedDepth3);

  useEffect(() => {
    setMall(selectedMall);
    setD1(selectedDepth1);
    setD2(selectedDepth2);
    setD3(selectedDepth3);
  }, [selectedMall, selectedDepth1, selectedDepth2, selectedDepth3]);

  const push = (next: {
    mall?: string;
    depth1?: string;
    depth2?: string;
    depth3?: string;
  }) => {
    const params = new URLSearchParams();
    if (next.mall) params.set("mall", next.mall);
    if (next.depth1) params.set("depth1", next.depth1);
    if (next.depth2) params.set("depth2", next.depth2);
    if (next.depth3) params.set("depth3", next.depth3);
    const q = params.toString();
    router.push((q ? `${actionPath}?${q}` : actionPath) as any);
  };

  return (
    <div className="flex items-center gap-2" suppressHydrationWarning>
      <select
        name="mall"
        value={mall}
        className="h-9 w-[120px] rounded-md border bg-background px-2 text-sm"
        onChange={(e) => {
          const nextMall = e.currentTarget.value;
          setMall(nextMall);
          setD1("");
          setD2("");
          setD3("");
          push({ mall: nextMall || undefined });
        }}
        suppressHydrationWarning
      >
        <option value="">카테고리</option>
        {malls.map((mall) => (
          <option key={mall} value={mall}>
            {mall}
          </option>
        ))}
      </select>
      <select
        name="depth1"
        value={d1}
        className="h-9 w-[120px] rounded-md border bg-background px-2 text-sm"
        onChange={(e) => {
          const nextDepth1 = e.currentTarget.value;
          setD1(nextDepth1);
          setD2("");
          setD3("");
          push({
            mall: mall || undefined,
            depth1: nextDepth1 || undefined
          });
        }}
        suppressHydrationWarning
      >
        <option value="">카테고리</option>
        {depth1.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
      <select
        name="depth2"
        value={d2}
        className="h-9 w-[120px] rounded-md border bg-background px-2 text-sm"
        onChange={(e) => {
          const nextDepth2 = e.currentTarget.value;
          setD2(nextDepth2);
          setD3("");
          push({
            mall: mall || undefined,
            depth1: d1 || undefined,
            depth2: nextDepth2 || undefined
          });
        }}
        suppressHydrationWarning
      >
        <option value="">카테고리</option>
        {depth2.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
      <select
        name="depth3"
        value={d3}
        className="h-9 w-[120px] rounded-md border bg-background px-2 text-sm"
        onChange={(e) => {
          const nextDepth3 = e.currentTarget.value;
          setD3(nextDepth3);
          push({
            mall: mall || undefined,
            depth1: d1 || undefined,
            depth2: d2 || undefined,
            depth3: nextDepth3 || undefined
          });
        }}
        suppressHydrationWarning
      >
        <option value="">카테고리</option>
        {depth3.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </div>
  );
}


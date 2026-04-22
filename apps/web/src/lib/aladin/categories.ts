import { readFileSync } from "node:fs";
import path from "node:path";

export type AladinCategoryOption = {
  categoryId: number;
  mall: string;
  depth1: string;
  depth2: string;
  depth3: string;
  label: string;
};

const CATEGORY_CSV_PATH = path.join(
  process.cwd(),
  "public",
  "assets",
  "aladin_Category_CID_20210927.csv"
);

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuote = !inQuote;
      }
      continue;
    }
    if (!inQuote && ch === ",") {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function parseCsvToOptions(csv: string): AladinCategoryOption[] {
  const lines = csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const options: AladinCategoryOption[] = [
    {
      categoryId: 0,
      mall: "전체",
      depth1: "",
      depth2: "",
      depth3: "",
      label: "전체"
    }
  ];
  const keySet = new Set<string>(["0"]);

  for (const line of lines) {
    if (!/^\d+,/.test(line)) {
      continue;
    }
    const [cidRaw, _categoryName, mallRaw, d1Raw, d2Raw, d3Raw] = parseCsvLine(line);
    const categoryId = Number.parseInt(cidRaw, 10);
    if (!Number.isFinite(categoryId)) {
      continue;
    }
    const mall = (mallRaw || "").trim();
    const depth1 = (d1Raw || "").trim();
    const depth2 = (d2Raw || "").trim();
    const depth3 = (d3Raw || "").trim();
    const pathLabel = [mall, depth1, depth2, depth3].filter(Boolean).join(" > ");
    if (!pathLabel) {
      continue;
    }
    const uniqueKey = `${categoryId}:${mall}:${depth1}:${depth2}:${depth3}`;
    if (keySet.has(uniqueKey)) {
      continue;
    }
    keySet.add(uniqueKey);
    options.push({
      categoryId,
      mall,
      depth1,
      depth2,
      depth3,
      label: pathLabel
    });
  }

  return options;
}

/**
 * 알라딘 카테고리 CSV를 3Depth까지 파싱한 옵션 목록입니다.
 *
 * @history
 * - 2026-04-22: `aladin_Category_CID_20210927.csv` 기반 상수화
 */
export const ALADIN_CATEGORY_OPTIONS: AladinCategoryOption[] = parseCsvToOptions(
  readFileSync(CATEGORY_CSV_PATH, "utf8")
);

export function parseCategoryId(input: string | null | undefined): number {
  if (!input) {
    return 0;
  }
  const n = Number.parseInt(input, 10);
  if (!Number.isFinite(n) || n < 0) {
    return 0;
  }
  return n;
}


/**
 * 알라딘 TTB ItemLookUp(ISBN) — JSONP 응답 파싱.
 *
 * @history
 * - 2026-04-08: 비소장 구매 링크·판매가 힌트
 */
export type AladinItemLookupHit = {
  productUrl: string | null;
  priceSalesKrw: number | null;
};

function parseAladinJsonpBody(text: string): unknown {
  const trimmed = text.trim();
  const m = trimmed.match(/^[$\w]+\s*\(([\s\S]*)\)\s*;?\s*$/);
  const jsonText = m ? m[1]! : trimmed;
  return JSON.parse(jsonText) as unknown;
}

function readFirstItem(payload: Record<string, unknown>): Record<string, unknown> | null {
  const items = payload.item;
  if (Array.isArray(items) && items.length > 0 && typeof items[0] === "object" && items[0] !== null) {
    return items[0] as Record<string, unknown>;
  }
  if (items && typeof items === "object" && !Array.isArray(items)) {
    return items as Record<string, unknown>;
  }
  return null;
}

export async function aladinItemLookupByIsbn(
  isbnDigits: string,
  ttbKey: string
): Promise<AladinItemLookupHit | null> {
  const clean = isbnDigits.replace(/[^0-9X]/gi, "");
  if (clean.length < 10) {
    return null;
  }
  const url = new URL("https://www.aladin.co.kr/ttb/api/ItemLookUp.aspx");
  url.searchParams.set("ttbkey", ttbKey);
  url.searchParams.set("itemIdType", "ISBN");
  url.searchParams.set("ItemId", clean);
  url.searchParams.set("output", "js");
  url.searchParams.set("Version", "20131101");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    return null;
  }
  const text = await res.text();
  let payload: unknown;
  try {
    payload = parseAladinJsonpBody(text);
  } catch {
    return null;
  }
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const item = readFirstItem(payload as Record<string, unknown>);
  if (!item) {
    return null;
  }
  const link = typeof item.link === "string" ? item.link.trim() : null;
  const ps = item.priceSales;
  let priceSalesKrw: number | null = null;
  if (typeof ps === "number" && Number.isFinite(ps)) {
    priceSalesKrw = Math.max(0, Math.trunc(ps));
  } else if (typeof ps === "string") {
    const n = parseInt(ps.replace(/,/g, ""), 10);
    priceSalesKrw = Number.isFinite(n) && n >= 0 ? n : null;
  }
  return {
    productUrl: link && link.length > 0 ? link : null,
    priceSalesKrw
  };
}

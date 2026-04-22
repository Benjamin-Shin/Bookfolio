import { XMLParser } from "fast-xml-parser";

/**
 * 알라딘 TTB ItemList 응답에서 꺼낸 한 권 메타.
 */
export type AladinFeedItem = {
  itemId: string;
  title: string;
  author: string;
  link: string;
  isbn: string;
  isbn13: string;
  pubDate: string;
  cover: string;
  publisher: string;
  priceSales: number | null;
  priceStandard: number | null;
  categoryName: string;
  salesPoint: number | null;
  /** 알라딘 `itemPage`·`subInfo` 등에서 추출한 총 페이지(쪽). 없으면 null. */
  pageCount: number | null;
};

/**
 * 파싱된 목록 피드(표지·구매 링크 등).
 */
export type AladinFeedResult = {
  feedTitle: string;
  feedLink: string;
  query: string;
  items: AladinFeedItem[];
};

/**
 * 알라딘 XML/JSON에 남는 `&lt;`, `&amp;` 등을 반복 해석합니다 (`&amp;lt;` → `<`).
 *
 * @history
 * - 2026-03-25: 제목·분류 등 표시용 문자열 복원
 */
function decodeXmlEntitiesOnce(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function decodeXmlEntities(s: string): string {
  let cur = s;
  for (let i = 0; i < 12; i++) {
    const next = decodeXmlEntitiesOnce(cur);
    if (next === cur) {
      break;
    }
    cur = next;
  }
  return cur;
}

function str(v: unknown): string {
  if (v === undefined || v === null) {
    return "";
  }
  if (typeof v === "string") {
    return decodeXmlEntities(v.trim());
  }
  if (typeof v === "number" || typeof v === "boolean") {
    return String(v);
  }
  return "";
}

function optInt(v: unknown): number | null {
  const s = str(v);
  if (!s) {
    return null;
  }
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

const MAX_PAGE_COUNT = 50_000;

/**
 * 알라딘 ItemList 항목에서 쪽수를 뽑습니다 (`itemPage`, `subInfo`의 `NNN쪽` 패턴).
 *
 * @history
 * - 2026-03-26: 관리자 프리필·일괄 등록용 `pageCount`
 */
function pageCountFromAladinRaw(raw: Record<string, unknown>): number | null {
  const direct = optInt(raw.itemPage);
  if (direct != null && direct >= 1) {
    return Math.min(direct, MAX_PAGE_COUNT);
  }
  const sub = str(raw.subInfo);
  if (sub) {
    const m = sub.match(/(\d{1,5})\s*쪽/);
    if (m) {
      const n = parseInt(m[1]!, 10);
      if (n >= 1) {
        return Math.min(n, MAX_PAGE_COUNT);
      }
    }
  }
  return null;
}

function ensureItemArray(raw: unknown): Record<string, unknown>[] {
  if (raw === undefined || raw === null) {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw.filter((x): x is Record<string, unknown> => x !== null && typeof x === "object");
  }
  if (typeof raw === "object") {
    return [raw as Record<string, unknown>];
  }
  return [];
}

function pickObjectRoot(parsed: Record<string, unknown>): Record<string, unknown> | null {
  const objectNode = parsed.object ?? parsed["object"];
  if (objectNode && typeof objectNode === "object" && !Array.isArray(objectNode)) {
    return objectNode as Record<string, unknown>;
  }
  const keys = Object.keys(parsed);
  if (keys.length === 1 && parsed[keys[0]] && typeof parsed[keys[0]] === "object") {
    const inner = parsed[keys[0]] as Record<string, unknown>;
    if ("item" in inner || "title" in inner) {
      return inner;
    }
  }
  return null;
}

function mapRawItem(raw: Record<string, unknown>): AladinFeedItem {
  const itemId = str(raw["@_itemId"]) || str(raw.itemId);
  return {
    itemId,
    title: str(raw.title),
    author: str(raw.author),
    link: str(raw.link),
    isbn: str(raw.isbn),
    isbn13: str(raw.isbn13),
    pubDate: str(raw.pubDate),
    cover: str(raw.cover),
    publisher: str(raw.publisher),
    priceSales: optInt(raw.priceSales),
    priceStandard: optInt(raw.priceStandard),
    categoryName: str(raw.categoryName),
    salesPoint: optInt(raw.salesPoint),
    pageCount: pageCountFromAladinRaw(raw)
  };
}

/**
 * 알라딘 ItemList JSON 본문을 `AladinFeedResult`로 변환합니다.
 *
 * @history
 * - 2026-03-25: `str()` 경유 필드에 XML 엔티티 디코딩 적용
 * - 2026-03-25: 웹·모바일 공통 피드용 JSON 분기 추가
 */
export function parseAladinItemListJson(body: string): AladinFeedResult {
  const parsed = JSON.parse(body) as Record<string, unknown>;
  const root = pickObjectRoot(parsed) ?? parsed;
  const itemsRaw = ensureItemArray(root.item);
  return {
    feedTitle: str(root.title),
    feedLink: str(root.link),
    query: str(root.query),
    items: itemsRaw.map(mapRawItem)
  };
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  trimValues: true
});

/**
 * 알라딘 ItemList XML 본문을 `AladinFeedResult`로 변환합니다.
 *
 * @history
 * - 2026-03-25: `str()` 경유 필드에 XML 엔티티 디코딩 적용
 * - 2026-03-25: TTB `object`/`item` 구조 파싱
 */
export function parseAladinItemListXml(body: string): AladinFeedResult {
  const parsed = xmlParser.parse(body) as Record<string, unknown>;
  const root = pickObjectRoot(parsed);
  if (!root) {
    return { feedTitle: "", feedLink: "", query: "", items: [] };
  }
  const itemsRaw = ensureItemArray(root.item);
  return {
    feedTitle: str(root.title),
    feedLink: str(root.link),
    query: str(root.query),
    items: itemsRaw.map(mapRawItem)
  };
}

/**
 * 본문이 JSON인지 XML인지에 따라 파싱합니다.
 *
 * @history
 * - 2026-03-25: `output=json`·`output=xml` 혼용 대비
 */
export function parseAladinItemListBody(body: string): AladinFeedResult {
  const t = body.trimStart();
  if (t.startsWith("{") || t.startsWith("[")) {
    return parseAladinItemListJson(body);
  }
  return parseAladinItemListXml(body);
}

/**
 * 조합된 알라딘 ItemList URL로 목록을 가져와 파싱합니다.
 *
 * @history
 * - 2026-04-22: 함수명 일반화(`fetchAladinItemListFeed`)
 * - 2026-03-25: 서버 전용 env·5분 캐시
 */
export async function fetchAladinItemListFeed(url: string): Promise<AladinFeedResult> {
  const res = await fetch(url, {
    next: { revalidate: 300 }
  });
  if (!res.ok) {
    throw new Error(`Aladin API HTTP ${res.status}`);
  }
  const text = await res.text();
  return parseAladinItemListBody(text);
}

/**
 * @deprecated `fetchAladinItemListFeed`를 사용하세요.
 */
export const fetchAladinBestsellerFeed = fetchAladinItemListFeed;

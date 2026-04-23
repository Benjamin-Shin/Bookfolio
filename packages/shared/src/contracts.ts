/**
 * 카탈로그(`books`)·서가 표시용 매체 구분. 캐논 서지 1행(ISBN)당 하나.
 *
 * @history
 * - 2026-03-26: `audiobook`, `unknown` 추가 — DB `0021`·캐논 포맷 정렬
 */
export const BOOK_FORMATS = ["paper", "ebook", "audiobook", "unknown"] as const;
export type BookFormat = (typeof BOOK_FORMATS)[number];

export const READING_STATUSES = [
  "unread",
  "reading",
  "completed",
  "paused",
  "dropped",
] as const;
export type ReadingStatus = (typeof READING_STATUSES)[number];

/** 웹·앱 UI용 한글 표기 (값은 그대로 `paper` 등 영문). */
export const BOOK_FORMAT_LABEL_KO = {
  paper: "종이책",
  ebook: "전자책",
  audiobook: "오디오북",
  unknown: "형식 미상",
} as const satisfies Record<BookFormat, string>;

export const READING_STATUS_LABEL_KO = {
  unread: "읽기 전",
  reading: "읽는 중",
  completed: "완독",
  paused: "일시중단",
  dropped: "하차",
} as const satisfies Record<ReadingStatus, string>;

export type EnvironmentName = "local" | "staging" | "production";

export interface Profile {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

/**
 * ISBN·제목 등으로 외부/로컬에서 가져온 도서 메타 스냅샷.
 *
 * @history
 * - 2026-03-28: `pageCount` 주석에서 Google Books 언급 제거.
 * - 2026-03-26: `pageCount`(총 페이지) 선택 필드
 */
export interface BookLookupResult {
  isbn: string;
  title: string;
  authors: string[];
  publisher: string | null;
  publishedDate: string | null;
  coverUrl: string | null;
  description: string | null;
  /** 제공자가 알려준 가격(원). 네이버는 판매가 우선, 없으면 정가. */
  priceKrw: number | null;
  source: string;
  /** 로컬 catalog(`books`)에만 채워질 수 있음. 외부 ISBN 조회에는 보통 없음. */
  genreSlugs?: string[];
  literatureRegion?: string | null;
  originalLanguage?: string | null;
  /** 제공자가 알려준 총 페이지(쪽). 네이버·국립 등 일부만 제공. */
  pageCount?: number | null;
}

export interface UserBookSummary {
  id: string;
  userId: string;
  bookId: string;
  isbn: string | null;
  title: string;
  authors: string[];
  format: BookFormat;
  readingStatus: ReadingStatus;
  rating: number | null;
  coverUrl: string | null;
  /**
   * 공유 서지 `books.page_count`. 진행률 분모는 `readingTotalPages ?? pageCount`.
   *
   * @history
   * - 2026-04-06: `0030` — 목록·상세 API가 조인해 채움
   */
  pageCount?: number | null;
  /**
   * 현재까지 읽은 쪽(1-based 권장). NULL이면 미입력.
   *
   * @history
   * - 2026-04-06: `user_books.current_page`
   */
  currentPage?: number | null;
  /**
   * 총 쪽 수 사용자 재정의. NULL이면 `pageCount`만 사용.
   *
   * @history
   * - 2026-04-06: `user_books.reading_total_pages`
   */
  readingTotalPages?: number | null;
  /** 참고·집계용 가격(원). */
  priceKrw: number | null;
  isOwned: boolean;
  /** 집·회사·빌려줌 대상 등 물리적 위치(자유 입력). */
  location: string | null;
  createdAt: string;
  updatedAt: string;
  /**
   * 같은 `books` 행에 대해 다른 회원들의 `user_books.rating` 평균(소수 둘째 자리까지).
   *
   * @history
   * - 2026-04-02: 신규 — 목록/상세 API가 집계해 채움
   */
  communityRatingAvg?: number | null;
  /**
   * 평균에 포함된 평점 개수.
   *
   * @history
   * - 2026-04-02: 신규
   */
  communityRatingCount?: number;
}

export interface UserBookDetail extends UserBookSummary {
  publisher: string | null;
  publishedDate: string | null;
  description: string | null;
  /** 연결된 `books` 행 출처(상세 조회 시). */
  catalogSource?: string | null;
  genreSlugs?: string[];
  literatureRegion?: string | null;
  originalLanguage?: string | null;
}

export interface CreateUserBookInput {
  isbn?: string | null;
  title: string;
  authors: string[];
  format: BookFormat;
  readingStatus?: ReadingStatus;
  rating?: number | null;
  coverUrl?: string | null;
  publisher?: string | null;
  publishedDate?: string | null;
  description?: string | null;
  priceKrw?: number | null;
  isOwned?: boolean;
  location?: string | null;
  /** @history 2026-04-06: `user_books` 독서 진행 */
  currentPage?: number | null;
  readingTotalPages?: number | null;
}

export interface UpdateUserBookInput {
  /** 공유 서지(`books`) 갱신. 같은 book_id를 쓰는 모든 사용자에게 반영됩니다. */
  title?: string;
  authors?: string[];
  coverUrl?: string | null;
  publisher?: string | null;
  publishedDate?: string | null;
  description?: string | null;
  priceKrw?: number | null;
  format?: BookFormat;
  readingStatus?: ReadingStatus;
  rating?: number | null;
  isOwned?: boolean;
  location?: string | null;
  /** @history 2026-04-06: `user_books` 독서 진행 */
  currentPage?: number | null;
  readingTotalPages?: number | null;
}

/** 진행률 분모. 둘 다 없으면 null(진행률 미표시). */
export function effectiveReadingTotalPages(summary: {
  pageCount?: number | null;
  readingTotalPages?: number | null;
}): number | null {
  const o = summary.readingTotalPages;
  if (typeof o === "number" && Number.isFinite(o) && o >= 1) {
    return Math.floor(o);
  }
  const c = summary.pageCount;
  if (typeof c === "number" && Number.isFinite(c) && c >= 1) {
    return Math.floor(c);
  }
  return null;
}

export const READING_EVENT_TYPES = [
  "read_start",
  "progress",
  "read_pause",
  "read_complete",
  "dropped",
] as const;
export type ReadingEventType = (typeof READING_EVENT_TYPES)[number];

export interface UserBookMemoRow {
  id: string;
  userBookId: string;
  bodyMd: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookOneLinerRow {
  userId: string;
  displayName: string | null;
  body: string;
  updatedAt: string;
}

export interface ReadingEventRow {
  id: string;
  userBookId: string;
  eventType: ReadingEventType;
  payload: Record<string, unknown>;
  occurredAt: string;
  createdAt: string;
}

export interface ReadingLeaderboardEntry {
  userId: string;
  displayName: string | null;
  count: number;
}

export interface ReadingLeaderboardResponse {
  top: ReadingLeaderboardEntry[];
  me: {
    rank: number | null;
    count: number;
    totalRankedUsers: number;
  };
}

/** DB `app_users.policies_json`과 맞춘 확장 가능 정책(알 수 없는 키는 무시). */
export interface AppUserPolicies {
  /** 내가 소유자로 새로 만든 공동서가(`libraries.created_by`) 최대 개수 */
  sharedLibraryCreateLimit: number;
}

export const DEFAULT_APP_USER_POLICIES: AppUserPolicies = {
  sharedLibraryCreateLimit: 1,
};

/**
 * DB·API에서 온 JSON과 기본값을 병합합니다.
 *
 * @history
 * - 2026-03-25: `sharedLibraryCreateLimit` (기본 1, 0~10000)
 */
export function mergeAppUserPolicies(raw: unknown): AppUserPolicies {
  const out: AppUserPolicies = { ...DEFAULT_APP_USER_POLICIES };
  if (
    raw === null ||
    raw === undefined ||
    typeof raw !== "object" ||
    Array.isArray(raw)
  ) {
    return out;
  }
  const o = raw as Record<string, unknown>;
  const lim = o.sharedLibraryCreateLimit;
  if (typeof lim === "number" && Number.isFinite(lim)) {
    const n = Math.floor(lim);
    if (n >= 0 && n <= 10_000) {
      out.sharedLibraryCreateLimit = n;
    }
  }
  return out;
}

export interface ApiErrorPayload {
  error: string;
  code?: string;
}

export interface BooksQuery {
  search?: string;
  format?: BookFormat | "all";
  readingStatus?: ReadingStatus | "all";
}

export const LIBRARY_KINDS = ["family", "club"] as const;
export type LibraryKind = (typeof LIBRARY_KINDS)[number];

export const LIBRARY_MEMBER_ROLES = ["owner", "member"] as const;
export type LibraryMemberRole = (typeof LIBRARY_MEMBER_ROLES)[number];

export interface LibrarySummary {
  id: string;
  name: string;
  description: string | null;
  kind: LibraryKind;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  /** 현재 사용자의 역할 */
  myRole: LibraryMemberRole;
}

/**
 * 공동서가 멤버 한 줄.
 *
 * @history
 * - 2026-04-12: `image` — `app_users.image`(OAuth 아바타 등) 목록 표시용
 */
export interface LibraryMemberRow {
  userId: string;
  email: string;
  name: string | null;
  /** 프로필 이미지 URL(`app_users.image`). 없으면 null */
  image: string | null;
  role: LibraryMemberRole;
  joinedAt: string;
}

/**
 * 공동서가 집계 한 줄에 포함되는 소유자(개인 user_books 1행).
 *
 * @history
 * - 2026-04-12: `rating` — Hall of Fame(완독·개인 평점 4+) 판별용
 */
export interface LibrarySharedOwnerRow {
  userId: string;
  email: string;
  name: string | null;
  userBookId: string;
  readingStatus: ReadingStatus;
  /** 개인 평점(1–5). 없으면 null */
  rating: number | null;
  location: string | null;
  /** 최신 개인 메모(`user_book_memos`) 앞부분(서고 목록용). */
  memoPreview: string | null;
  linkedAt: string;
}

/** book_id 기준으로 합친 공동서가 책 한 줄. */
export interface LibraryAggregatedBookRow {
  libraryId: string;
  bookId: string;
  isbn: string | null;
  title: string;
  authors: string[];
  coverUrl: string | null;
  /** 공유 서지 `books.genre_slugs` (없으면 생략). */
  genreSlugs?: string[];
  owners: LibrarySharedOwnerRow[];
  /** 목록 정렬용(소유자 연결 시각 중 최댓값). */
  updatedAt: string;
}

export interface CreateLibraryInput {
  name: string;
  description?: string | null;
  kind: LibraryKind;
}

export interface UpdateLibraryInput {
  name?: string;
  description?: string | null;
  kind?: LibraryKind;
}

/**
 * 공동서가에 개인 소장을 연결.
 * - userBookId: 이미 있는 내 user_books 행만 서가에 올림.
 * - bookId: 내 서가에 해당 books.id가 있으면 연결(없으면 400).
 * - 그 외: 개인 서가 등록과 동일 필드로 user_books 생성 후 연결(format 생략 시 paper).
 */
export type ShareToLibraryInput =
  | { userBookId: string }
  | { bookId: string; location?: string | null; memo?: string | null }
  | ({
      userBookId?: undefined;
      bookId?: undefined;
    } & Pick<
      CreateUserBookInput,
      | "isbn"
      | "title"
      | "authors"
      | "publisher"
      | "publishedDate"
      | "coverUrl"
      | "description"
      | "priceKrw"
    > & {
        format?: BookFormat;
        location?: string | null;
        memo?: string | null;
      });

export interface SharedLibraryMyReadingInput {
  readingStatus: ReadingStatus;
}

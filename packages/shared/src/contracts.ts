export const BOOK_FORMATS = ["paper", "ebook"] as const;
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
  ebook: "전자책"
} as const satisfies Record<BookFormat, string>;

export const READING_STATUS_LABEL_KO = {
  unread: "읽기 전",
  reading: "읽는 중",
  completed: "완독",
  paused: "일시중단",
  dropped: "하차"
} as const satisfies Record<ReadingStatus, string>;

export type EnvironmentName = "local" | "staging" | "production";

export interface Profile {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

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
  memo: string | null;
  coverUrl: string | null;
  /** 참고·집계용 가격(원). */
  priceKrw: number | null;
  isOwned: boolean;
  /** 집·회사·빌려줌 대상 등 물리적 위치(자유 입력). */
  location: string | null;
  createdAt: string;
  updatedAt: string;
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
  memo?: string | null;
  coverUrl?: string | null;
  publisher?: string | null;
  publishedDate?: string | null;
  description?: string | null;
  priceKrw?: number | null;
  isOwned?: boolean;
  location?: string | null;
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
  memo?: string | null;
  isOwned?: boolean;
  location?: string | null;
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

export interface LibraryMemberRow {
  userId: string;
  email: string;
  name: string | null;
  role: LibraryMemberRole;
  joinedAt: string;
}

/** 공동서재 집계 한 줄에 포함되는 소유자(개인 user_books 1행). */
export interface LibrarySharedOwnerRow {
  userId: string;
  email: string;
  name: string | null;
  userBookId: string;
  readingStatus: ReadingStatus;
  location: string | null;
  memo: string | null;
  linkedAt: string;
}

/** book_id 기준으로 합친 공동서재 책 한 줄. */
export interface LibraryAggregatedBookRow {
  libraryId: string;
  bookId: string;
  isbn: string | null;
  title: string;
  authors: string[];
  coverUrl: string | null;
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
 * 공동서재에 개인 소장을 연결.
 * - userBookId: 이미 있는 내 user_books 행만 서재에 올림.
 * - bookId: 내 서재에 해당 books.id가 있으면 연결(없으면 400).
 * - 그 외: 개인 서재 등록과 동일 필드로 user_books 생성 후 연결(format 생략 시 paper).
 */
export type ShareToLibraryInput =
  | { userBookId: string }
  | { bookId: string; location?: string | null; memo?: string | null }
  | ({
      userBookId?: undefined;
      bookId?: undefined;
    } & Pick<
      CreateUserBookInput,
      "isbn" | "title" | "authors" | "publisher" | "publishedDate" | "coverUrl" | "description" | "priceKrw"
    > & { format?: BookFormat; location?: string | null; memo?: string | null });

export interface SharedLibraryMyReadingInput {
  readingStatus: ReadingStatus;
}


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

export interface LibraryBookMemberStateRow {
  userId: string;
  email: string;
  name: string | null;
  readingStatus: ReadingStatus;
  updatedAt: string;
}

export interface LibraryBookSummary {
  id: string;
  libraryId: string;
  bookId: string;
  isbn: string | null;
  title: string;
  authors: string[];
  coverUrl: string | null;
  location: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryBookDetail extends LibraryBookSummary {
  memberStates: LibraryBookMemberStateRow[];
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

/** 공동서재에 책 추가: 기존 카탈로그 ID 또는 신규 서지(개인 서재 등록과 동일 필드). */
export type CreateLibraryBookInput =
  | { bookId: string; location?: string | null; memo?: string | null }
  | ({
      bookId?: undefined;
      location?: string | null;
      memo?: string | null;
    } & Pick<
      CreateUserBookInput,
      "isbn" | "title" | "authors" | "publisher" | "publishedDate" | "coverUrl" | "description" | "priceKrw"
    >);

export interface UpdateLibraryBookInput {
  location?: string | null;
  memo?: string | null;
}

export interface UpdateLibraryBookMemberStateInput {
  readingStatus: ReadingStatus;
}


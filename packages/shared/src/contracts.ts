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


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
  source: string;
}

export interface UserBookSummary {
  id: string;
  userId: string;
  bookId: string | null;
  isbn: string | null;
  title: string;
  authors: string[];
  format: BookFormat;
  readingStatus: ReadingStatus;
  rating: number | null;
  memo: string | null;
  coverUrl: string | null;
  isOwned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserBookDetail extends UserBookSummary {
  publisher: string | null;
  publishedDate: string | null;
  description: string | null;
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
  isOwned?: boolean;
}

export interface UpdateUserBookInput {
  title?: string;
  authors?: string[];
  format?: BookFormat;
  readingStatus?: ReadingStatus;
  rating?: number | null;
  memo?: string | null;
  coverUrl?: string | null;
  publisher?: string | null;
  publishedDate?: string | null;
  description?: string | null;
  isOwned?: boolean;
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


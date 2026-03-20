import type { ReadingStatus } from "@bookfolio/shared";

export const READING_STATUS_LABELS: Record<ReadingStatus, string> = {
  unread: "읽기 전",
  reading: "읽는 중",
  completed: "완독",
  paused: "잠시 멈춤",
  dropped: "하차"
};

export const LIBRARY_KIND_LABELS = {
  family: "가족",
  club: "모임"
} as const;

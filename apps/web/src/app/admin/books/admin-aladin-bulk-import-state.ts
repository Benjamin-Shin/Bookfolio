/**
 * 알라딘 일괄 등록 `useActionState`용 — `"use server"` 모듈에서는 객체를 export할 수 없음.
 *
 * @history
 * - 2026-03-26: `actions.ts`와 클라이언트 공유용 분리
 */
export type AladinBulkImportState = {
  error: string | null;
  message: string | null;
  inserted: number;
  skippedExisting: number;
  skippedNoIsbn: number;
  skippedInvalid: number;
  feedErrors: string[];
};

export const initialAladinBulkImportState: AladinBulkImportState = {
  error: null,
  message: null,
  inserted: 0,
  skippedExisting: 0,
  skippedNoIsbn: 0,
  skippedInvalid: 0,
  feedErrors: []
};

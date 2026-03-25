/**
 * 공동서재 생성 상한 위반.
 *
 * @history
 * - 2026-03-25: `policies_json.sharedLibraryCreateLimit` 검증용
 */
export class SharedLibraryCreateLimitReachedError extends Error {
  constructor(
    public readonly limit: number,
    public readonly createdCount: number
  ) {
    super(
      `공동서재는 최대 ${limit}개까지 만들 수 있습니다. (현재 ${createdCount}개 소유 중)`
    );
    this.name = "SharedLibraryCreateLimitReachedError";
  }
}

/**
 * 공동서가 생성 상한 위반.
 *
 * @history
 * - 2026-03-25: `policies_json.sharedLibraryCreateLimit` 검증용
 */
export class SharedLibraryCreateLimitReachedError extends Error {
  constructor(
    public readonly limit: number,
    public readonly createdCount: number,
  ) {
    super(
      `공동서가는 최대 ${limit}개까지 만들 수 있습니다. (현재 ${createdCount}개 소유 중)`,
    );
    this.name = "SharedLibraryCreateLimitReachedError";
  }
}

/**
 * VIP 플랜의 공동서가 소유 상한.
 *
 * @history
 * - 2026-03-28: 신규
 */
export class SharedLibraryVipOwnedCapError extends Error {
  constructor(
    public readonly maxOwned: number,
    public readonly createdCount: number,
  ) {
    super(
      `VIP 플랜에서 공동서가는 최대 ${maxOwned}개까지 만들 수 있습니다. (현재 ${createdCount}개 소유 중)`,
    );
    this.name = "SharedLibraryVipOwnedCapError";
  }
}

/**
 * 포인트 부족으로 추가 공동서가·초대를 진행할 수 없음.
 *
 * @history
 * - 2026-03-28: 신규
 */
export class SharedLibraryPointsRequiredError extends Error {
  constructor(
    message = "포인트가 부족합니다. 추가 공동서가 또는 초대에 포인트가 필요합니다.",
  ) {
    super(message);
    this.name = "SharedLibraryPointsRequiredError";
  }
}

/**
 * VIP 멤버 수 상한.
 *
 * @history
 * - 2026-03-28: 신규
 */
export class SharedLibraryMemberCapError extends Error {
  constructor(public readonly maxMembers: number) {
    super(`이 서가의 멤버는 최대 ${maxMembers}명까지입니다.`);
    this.name = "SharedLibraryMemberCapError";
  }
}

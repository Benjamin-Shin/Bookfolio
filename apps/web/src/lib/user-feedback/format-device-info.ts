export type DeviceInfoDisplayRow = {
  label: string;
  value: string;
  mono?: boolean;
  fullWidth?: boolean;
};

const DEVICE_INFO_LABELS: Record<string, string> = {
  appName: "앱 이름",
  appVersion: "앱 버전",
  buildNumber: "빌드 번호",
  osName: "OS",
  osVersion: "OS 버전",
  deviceModel: "기기 모델",
  deviceManufacturer: "제조사",
  deviceBrand: "브랜드",
  sdkInt: "Android SDK",
  iosModel: "iOS 모델",
  systemName: "시스템",
  systemVersion: "시스템 버전",
  browserName: "브라우저",
  userAgent: "User-Agent",
  locale: "로케일",
  platform: "플랫폼",
};

const PREFERRED_ORDER = [
  "appName",
  "appVersion",
  "buildNumber",
  "osName",
  "osVersion",
  "deviceManufacturer",
  "deviceBrand",
  "deviceModel",
  "iosModel",
  "systemName",
  "systemVersion",
  "sdkInt",
  "browserName",
  "locale",
  "platform",
  "userAgent",
] as const;

function stringifyValue(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  if (typeof value === "string") {
    const t = value.trim();
    return t.length > 0 ? t : null;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
}

/**
 * `device_info` JSON을 관리자 UI용 라벨·값 목록으로 변환합니다.
 *
 * @history
 * - 2026-05-18: 신규 — 관리자 피드백 카드에서 raw JSON 대신 표시
 */
export function formatDeviceInfoForDisplay(
  info: Record<string, unknown>,
): DeviceInfoDisplayRow[] {
  const seen = new Set<string>();
  const rows: DeviceInfoDisplayRow[] = [];

  const push = (key: string, value: unknown) => {
    if (seen.has(key)) {
      return;
    }
    const str = stringifyValue(value);
    if (str == null) {
      return;
    }
    seen.add(key);
    rows.push({
      label: DEVICE_INFO_LABELS[key] ?? key,
      value: str,
      mono: key === "userAgent" || key === "buildNumber",
      fullWidth: key === "userAgent",
    });
  };

  for (const key of PREFERRED_ORDER) {
    if (key in info) {
      push(key, info[key]);
    }
  }

  for (const [key, value] of Object.entries(info)) {
    if (!seen.has(key)) {
      push(key, value);
    }
  }

  return rows;
}

/**
 * 플랫폼 코드 한글 표시.
 *
 * @history
 * - 2026-05-18: 신규
 */
export function formatFeedbackPlatformLabel(platform: string): string {
  switch (platform) {
    case "web":
      return "웹";
    case "mobile":
      return "모바일 앱";
    case "unknown":
      return "미상";
    default:
      return platform;
  }
}

import {
  formatDeviceInfoForDisplay,
  type DeviceInfoDisplayRow,
} from "@/lib/user-feedback/format-device-info";

type FeedbackDeviceInfoProps = {
  deviceInfo: Record<string, unknown>;
};

function InfoGrid({ rows }: { rows: DeviceInfoDisplayRow[] }) {
  return (
    <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
      {rows.map((row) => (
        <div
          key={row.label}
          className={row.fullWidth ? "sm:col-span-2" : undefined}
        >
          <dt className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
            {row.label}
          </dt>
          <dd
            className={
              row.mono
                ? "mt-0.5 break-all font-mono text-xs leading-relaxed text-foreground/90"
                : "mt-0.5 text-sm text-foreground"
            }
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * 피드백 접수 시 함께 온 기기·앱 환경 정보(라벨 그리드).
 *
 * @history
 * - 2026-05-18: 신규
 */
export function FeedbackDeviceInfo({ deviceInfo }: FeedbackDeviceInfoProps) {
  const rows = formatDeviceInfoForDisplay(deviceInfo);
  if (rows.length === 0) {
    return null;
  }

  const compact = rows.filter((r) => !r.fullWidth);
  const long = rows.filter((r) => r.fullWidth);

  return (
    <section className="rounded-lg border border-border/60 bg-background/60 p-3">
      <h3 className="mb-2 text-xs font-semibold text-foreground">접수 환경</h3>
      {compact.length > 0 ? <InfoGrid rows={compact} /> : null}
      {long.length > 0 ? (
        <details className="group mt-2">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
            상세 문자열 보기
          </summary>
          <div className="mt-2 border-t border-border/50 pt-2">
            <InfoGrid rows={long} />
          </div>
        </details>
      ) : null}
    </section>
  );
}

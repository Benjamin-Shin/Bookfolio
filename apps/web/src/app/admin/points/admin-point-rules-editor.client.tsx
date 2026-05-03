"use client";

import { useFormStatus } from "react-dom";

import type { AdminPointRuleRow, AdminPointRuleVersionRow } from "@/lib/points/admin-points";

import { createPointRuleFromForm, updatePointRuleFromForm } from "./actions";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { POINT_EVENT_CODE_DESCRIPTION_KO, POINT_EVENT_CODES } from "@/lib/points/event-codes";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="secondary" disabled={pending}>
      {pending ? "저장 중…" : label}
    </Button>
  );
}

const KNOWN_CODES = new Set<string>(Object.values(POINT_EVENT_CODES));

function eventHint(code: string): string | null {
  if (KNOWN_CODES.has(code)) {
    return POINT_EVENT_CODE_DESCRIPTION_KO[code] ?? null;
  }
  return null;
}

type Props = {
  versions: AdminPointRuleVersionRow[];
  rules: AdminPointRuleRow[];
  versionLabel: Record<string, string>;
};

/**
 * @history
 * - 2026-03-28: 규칙 점수 음수(차감) 입력·안내
 * - 2026-03-26: 규칙 행 편집·신규 이벤트 추가 폼
 */
export function AdminPointRulesEditor({ versions, rules, versionLabel }: Props) {
  const defaultVersionId = versions[0]?.id ?? "";

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-border/70 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">이벤트 코드 안내</p>
        <ul className="mt-1 list-inside list-disc space-y-0.5">
          <li>
            <code className="rounded bg-muted px-1">{POINT_EVENT_CODES.join_membership}</code> —{" "}
            {POINT_EVENT_CODE_DESCRIPTION_KO.join_membership}
          </li>
          <li>
            <code className="rounded bg-muted px-1">{POINT_EVENT_CODES.user_book_register}</code> —{" "}
            {POINT_EVENT_CODE_DESCRIPTION_KO.user_book_register}
          </li>
          <li>새 정책은 아래 폼에서 코드·점수·한도를 정한 뒤, 앱 코드에서 동일 코드로 지급을 호출합니다.</li>
          <li>
            점수는 <strong>양수=적립</strong>, <strong>음수=차감</strong>(0은 불가). 차감은 사용자 잔액이 부족하면 API에서
            거부됩니다. VIP는 차감 원장이 생기지 않습니다.
          </li>
        </ul>
      </div>

      {rules.length === 0 ? (
        <p className="text-sm text-muted-foreground">규칙이 없습니다. 아래에서 추가하세요.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border/80">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-border/60 bg-muted/40">
              <tr>
                <th className="px-3 py-2 font-medium">정책</th>
                <th className="px-3 py-2 font-medium">이벤트</th>
                <th className="px-3 py-2 font-medium" colSpan={4}>
                  점수 · 일·월 한도(건) · 저장
                </th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="border-b border-border/40 align-top last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{versionLabel[r.rule_version_id] ?? "—"}</td>
                  <td className="px-3 py-2">
                    <code className="text-xs">{r.event_code}</code>
                    {eventHint(r.event_code) ? (
                      <p className="mt-1 max-w-[220px] text-xs text-muted-foreground">{eventHint(r.event_code)}</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2" colSpan={4}>
                    <form action={updatePointRuleFromForm} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="ruleId" value={r.id} />
                      <label className="flex flex-col gap-0.5 text-xs">
                        <span className="text-muted-foreground">점수(±)</span>
                        <Input
                          name="points"
                          type="number"
                          step={1}
                          defaultValue={r.points}
                          className="h-8 w-24"
                          required
                        />
                      </label>
                      <label className="flex flex-col gap-0.5 text-xs">
                        <span className="text-muted-foreground">일 한도(건)</span>
                        <Input
                          name="dailyCap"
                          type="number"
                          min={0}
                          step={1}
                          defaultValue={r.daily_cap_per_user ?? ""}
                          placeholder="없음"
                          className="h-8 w-24"
                        />
                      </label>
                      <label className="flex flex-col gap-0.5 text-xs">
                        <span className="text-muted-foreground">월 한도(건)</span>
                        <Input
                          name="monthlyCap"
                          type="number"
                          min={0}
                          step={1}
                          defaultValue={r.monthly_cap_per_user ?? ""}
                          placeholder="없음"
                          className="h-8 w-24"
                        />
                      </label>
                      <SubmitButton label="저장" />
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="space-y-2 rounded-lg border border-dashed border-border/80 p-4">
        <h3 className="text-sm font-semibold">새 이벤트 규칙 추가</h3>
        <p className="text-xs text-muted-foreground">
          예: <code className="rounded bg-muted px-1">review_approved</code> — 앱에서 지급 호출 시 동일 문자열을
          사용합니다.
        </p>
        <form action={createPointRuleFromForm} className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-0.5 text-xs">
            <span className="text-muted-foreground">정책 버전</span>
            <FormSelect
              name="ruleVersionId"
              required
              defaultValue={defaultVersionId}
              className="h-8 min-w-[8rem] text-xs"
              aria-label="정책 버전"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.version}
                </option>
              ))}
            </FormSelect>
          </label>
          <label className="flex min-w-[10rem] flex-col gap-0.5 text-xs">
            <span className="text-muted-foreground">이벤트 코드</span>
            <Input name="eventCode" className="h-8 font-mono text-xs" placeholder="my_event_code" required />
          </label>
          <label className="flex flex-col gap-0.5 text-xs">
            <span className="text-muted-foreground">점수(±)</span>
            <Input name="points" type="number" step={1} defaultValue={10} className="h-8 w-24" required />
          </label>
          <label className="flex flex-col gap-0.5 text-xs">
            <span className="text-muted-foreground">일 한도(건)</span>
            <Input name="dailyCap" type="number" min={0} step={1} className="h-8 w-24" placeholder="없음" />
          </label>
          <label className="flex flex-col gap-0.5 text-xs">
            <span className="text-muted-foreground">월 한도(건)</span>
            <Input name="monthlyCap" type="number" min={0} step={1} className="h-8 w-24" placeholder="없음" />
          </label>
          <SubmitButton label="추가" />
        </form>
      </div>
    </div>
  );
}

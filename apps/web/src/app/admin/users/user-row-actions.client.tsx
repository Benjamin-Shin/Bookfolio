"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BellIcon, CrownIcon } from "lucide-react";

import {
  adminRevokeUserVipFromForm,
  sendPersonalNotificationToUserAction,
  type AdminUserNotificationFormState,
} from "@/app/admin/actions";
import { adminAssignUserSubscription } from "@/app/admin/users/vip-subscription-action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type PlanOption = { plan_key: string; display_name: string | null };

type UserRowActionsProps = {
  userId: string;
  email: string;
  vipActive: boolean;
  subscriptionPlans: PlanOption[];
};

const notifyInitial: AdminUserNotificationFormState = { status: "idle" };

function defaultPeriodEndLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 관리자 사용자 행 — 개인 알림 다이얼로그·VIP 부여·VIP 해제.
 *
 * @history
 * - 2026-05-04: 신규
 */
export function UserRowActions({
  userId,
  email,
  vipActive,
  subscriptionPlans,
}: UserRowActionsProps) {
  const router = useRouter();
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyNonce, setNotifyNonce] = useState(0);
  const [vipOpen, setVipOpen] = useState(false);
  const [vipNonce, setVipNonce] = useState(0);
  const [assignPending, startAssignTransition] = useTransition();

  const periodDefault = useMemo(() => defaultPeriodEndLocal(), [vipOpen, vipNonce]);

  useEffect(() => {
    if (notifyOpen) {
      setNotifyNonce((n) => n + 1);
    }
  }, [notifyOpen]);

  useEffect(() => {
    if (vipOpen) {
      setVipNonce((n) => n + 1);
    }
  }, [vipOpen]);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Dialog open={notifyOpen} onOpenChange={setNotifyOpen}>
        <DialogTrigger asChild>
          <Button type="button" size="sm" variant="outline" className="gap-1">
            <BellIcon className="size-3.5 opacity-80" aria-hidden />
            알림
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <SendNotificationDialogBody
            key={notifyNonce}
            userId={userId}
            email={email}
            onClose={() => setNotifyOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {!vipActive && subscriptionPlans.length > 0 ? (
        <Dialog open={vipOpen} onOpenChange={setVipOpen}>
          <DialogTrigger asChild>
            <Button type="button" size="sm" variant="outline" className="gap-1">
              <CrownIcon className="size-3.5 opacity-80" aria-hidden />
              VIP 부여
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>VIP 구독 부여</DialogTitle>
              <DialogDescription className="font-mono text-xs">{email}</DialogDescription>
            </DialogHeader>
            <form
              key={vipNonce}
              className="grid gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                startAssignTransition(async () => {
                  await adminAssignUserSubscription(fd);
                  router.refresh();
                  setVipOpen(false);
                });
              }}
            >
              <input type="hidden" name="targetUserId" value={userId} />
              <div className="grid gap-2">
                <Label htmlFor={`plan-${userId}`}>플랜</Label>
                <select
                  id={`plan-${userId}`}
                  name="planKey"
                  required
                  suppressHydrationWarning
                  className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {subscriptionPlans.map((pl) => (
                    <option key={pl.plan_key} value={pl.plan_key}>
                      {pl.display_name?.trim() ? pl.display_name : pl.plan_key} ({pl.plan_key})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`end-${userId}`}>종료 일시 (로컬)</Label>
                <Input
                  id={`end-${userId}`}
                  type="datetime-local"
                  name="currentPeriodEnd"
                  required
                  defaultValue={periodDefault}
                  className="text-sm"
                />
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="submit" size="sm" disabled={assignPending}>
                  {assignPending ? "처리 중…" : "부여"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}

      {vipActive ? (
        <form
          action={adminRevokeUserVipFromForm}
          className="inline"
          onSubmit={(e) => {
            if (!window.confirm("이 사용자의 활성 VIP 구독을 해제(취소 처리)할까요?")) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="targetUserId" value={userId} />
          <Button type="submit" size="sm" variant="outline">
            VIP 해제
          </Button>
        </form>
      ) : null}
    </div>
  );
}

function SendNotificationDialogBody({
  userId,
  email,
  onClose,
}: {
  userId: string;
  email: string;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    sendPersonalNotificationToUserAction,
    notifyInitial,
  );

  useEffect(() => {
    if (state.status === "success") {
      const t = window.setTimeout(() => onClose(), 1200);
      return () => window.clearTimeout(t);
    }
  }, [state.status, onClose]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>개인 알림 보내기</DialogTitle>
        <DialogDescription className="font-mono text-xs">
          {email} — 헤더 종 아이콘으로만 전달되며 공지 목록에는 포함되지 않습니다.
        </DialogDescription>
      </DialogHeader>
      <form action={formAction} className="grid gap-3">
        <input type="hidden" name="userId" value={userId} />
        <div className="grid gap-2">
          <Label htmlFor={`pn-title-${userId}`}>제목</Label>
          <Input id={`pn-title-${userId}`} name="title" required placeholder="제목" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`pn-body-${userId}`}>본문</Label>
          <Textarea id={`pn-body-${userId}`} name="body" required rows={4} placeholder="내용" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`pn-kind-${userId}`}>종류</Label>
          <select
            id={`pn-kind-${userId}`}
            name="kind"
            defaultValue="info"
            suppressHydrationWarning
            className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="info">안내 (info)</option>
            <option value="success">긍정 (success)</option>
            <option value="warning">주의 (warning)</option>
            <option value="system">시스템 (system)</option>
          </select>
        </div>
        {state.status === "error" ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {state.message}
          </p>
        ) : null}
        {state.status === "success" ? (
          <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-900 dark:text-emerald-100">
            {state.message}
          </p>
        ) : null}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="submit" disabled={pending}>
            {pending ? "전송 중…" : "보내기"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

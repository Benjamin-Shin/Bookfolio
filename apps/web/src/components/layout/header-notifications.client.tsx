"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type NotificationDto = {
  id: string;
  title: string;
  body: string;
  kind: string;
  read_at: string | null;
  created_at: string;
};

type HeaderNotificationsProps = {
  initialUnreadCount: number;
};

/**
 * 로그인 헤더 — 개인 알림 목록·읽음 처리.
 *
 * @history
 * - 2026-05-04: 신규
 */
export function HeaderNotifications({ initialUnreadCount }: HeaderNotificationsProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/me/notifications?limit=30", { method: "GET" });
      const data = (await res.json()) as { notifications?: NotificationDto[]; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "알림을 불러오지 못했습니다.");
      }
      setNotifications(data.notifications ?? []);
      const unread = (data.notifications ?? []).filter((n) => n.read_at == null).length;
      setUnreadCount(unread);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "알림을 불러오지 못했습니다.");
    }
  }, []);

  const onOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (next) {
        void refresh();
      }
    },
    [refresh],
  );

  const markRead = useCallback(
    async (id: string) => {
      try {
        const res = await fetch("/api/me/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "mark_read", id }),
        });
        const data = (await res.json()) as { notifications?: NotificationDto[]; error?: string };
        if (!res.ok) {
          throw new Error(data.error ?? "처리에 실패했습니다.");
        }
        setNotifications(data.notifications ?? []);
        const unread = (data.notifications ?? []).filter((n) => n.read_at == null).length;
        setUnreadCount(unread);
      } catch {
        /* ignore */
      }
    },
    [],
  );

  const markAllRead = useCallback(async () => {
    try {
      const res = await fetch("/api/me/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      const data = (await res.json()) as { notifications?: NotificationDto[]; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "처리에 실패했습니다.");
      }
      setNotifications(data.notifications ?? []);
      setUnreadCount(0);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative inline-flex text-[#1A3C2F]"
          aria-label="개인 알림"
        >
          <Bell className="size-5" />
          {unreadCount > 0 ? (
            <Badge
              variant="destructive"
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 justify-center px-1 text-[10px] leading-none"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <span className="text-sm font-semibold">알림</span>
          {notifications.some((n) => n.read_at == null) ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => void markAllRead()}
            >
              모두 읽음
            </Button>
          ) : null}
        </div>
        <DropdownMenuSeparator />
        {loadError ? (
          <p className="px-2 py-2 text-sm text-destructive">{loadError}</p>
        ) : null}
        <div className="max-h-72 overflow-y-auto">
          {notifications.length === 0 && !loadError ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              알림이 없습니다.
            </p>
          ) : (
            notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className={cn(
                  "flex cursor-pointer flex-col items-start gap-1 whitespace-normal py-3",
                  n.read_at == null && "bg-muted/40",
                )}
                onSelect={(e) => {
                  e.preventDefault();
                  if (n.read_at == null) {
                    void markRead(n.id);
                  }
                }}
              >
                <span className="font-medium leading-snug">{n.title}</span>
                <span className="text-xs leading-snug text-muted-foreground line-clamp-3">
                  {n.body}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(n.created_at).toLocaleString("ko-KR")}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="cursor-pointer text-muted-foreground">
            내 서가로
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

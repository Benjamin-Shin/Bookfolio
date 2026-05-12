"use client";

import { Camera, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { normalizeIsbn } from "@/lib/books/lookup";
import { cn } from "@/lib/utils";

type BarcodeDetectorLike = {
  detect: (image: ImageBitmapSource) => Promise<{ rawValue?: string }[]>;
};

type BarcodeDetectorCtor = new (opts?: { formats?: string[] }) => BarcodeDetectorLike;

function pickIsbnFromRaw(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 13) {
    return digits.slice(0, 13);
  }
  if (digits.length >= 10) {
    return digits.slice(0, 10);
  }
  return digits;
}

/**
 * ISBN 바코드 스캔 다이얼로그 — `BarcodeDetector`·카메라 스트림 또는 사진 촬영/선택.
 *
 * @history
 * - 2026-05-12: 신규 — 헤더 도서 검색용 ISBN 입력 보조
 */
export function IsbnBarcodeScannerDialog({
  open,
  onOpenChange,
  onDecoded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDecoded: (isbnDigits: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const stopStream = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  const finishDecode = useCallback(
    (raw: string) => {
      const picked = pickIsbnFromRaw(raw);
      const norm = normalizeIsbn(picked);
      if (norm.length < 10) {
        setHint("ISBN으로 인식할 수 있는 바코드가 아닙니다. 다시 시도해 주세요.");
        return;
      }
      onDecoded(norm);
      onOpenChange(false);
    },
    [onDecoded, onOpenChange],
  );

  const tryDetectOnVideo = useCallback(async () => {
    const BD = (typeof window !== "undefined"
      ? (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector
      : undefined) as BarcodeDetectorCtor | undefined;
    if (!BD) {
      return false;
    }
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      return false;
    }
    try {
      const detector = new BD({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
      });
      const codes = await detector.detect(video);
      const raw = codes.find((c) => c.rawValue?.trim())?.rawValue;
      if (raw) {
        finishDecode(raw);
        return true;
      }
    } catch {
      /* ignore frame errors */
    }
    return false;
  }, [finishDecode]);

  const loopDetect = useCallback(() => {
    void (async () => {
      const ok = await tryDetectOnVideo();
      if (!ok && open && streamRef.current) {
        rafRef.current = requestAnimationFrame(loopDetect);
      }
    })();
  }, [open, tryDetectOnVideo]);

  useEffect(() => {
    if (!open) {
      stopStream();
      setHint(null);
      return;
    }
    setHint(null);
    const BD = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
    if (!BD) {
      setHint(
        "이 브라우저는 바코드 자동 인식을 지원하지 않습니다. 아래 「사진으로 스캔」을 사용하거나 ISBN을 직접 입력해 주세요.",
      );
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          await v.play();
        }
        setScanning(true);
        rafRef.current = requestAnimationFrame(loopDetect);
      } catch {
        setHint("카메라를 사용할 수 없습니다. 권한을 허용하거나 「사진으로 스캔」을 이용해 주세요.");
      }
    })();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open, loopDetect, stopStream]);

  const onFile = useCallback(
    async (file: File | null) => {
      if (!file) {
        return;
      }
      setHint(null);
      const BD = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
      if (!BD) {
        setHint("이 브라우저는 이미지에서 바코드를 읽을 수 없습니다.");
        return;
      }
      try {
        const bitmap = await createImageBitmap(file);
        const detector = new BD({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
        });
        const codes = await detector.detect(bitmap);
        bitmap.close();
        const raw = codes.find((c) => c.rawValue?.trim())?.rawValue;
        if (raw) {
          finishDecode(raw);
          return;
        }
        setHint("이미지에서 바코드를 찾지 못했습니다. 밝기·초점을 조정해 다시 찍어 주세요.");
      } catch {
        setHint("이미지를 읽는 중 오류가 났습니다.");
      }
    },
    [finishDecode],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[100] max-w-md border-[#1A3C2F]/15 bg-[#F8F9FA] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-[#1A3C2F]">ISBN 바코드 스캔</DialogTitle>
          <DialogDescription className="text-[#5c6560]">
            책등 바코드를 프레임 안에 맞추면 자동으로 인식합니다. 인식이 어려우면 사진으로 시도할 수
            있습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div
            className={cn(
              "relative aspect-[4/3] overflow-hidden rounded-lg border border-[#1A3C2F]/15 bg-black/80",
              scanning && "ring-2 ring-[#1A3C2F]/40",
            )}
          >
            <video ref={videoRef} className="size-full object-cover" playsInline muted />
            {scanning ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
                <span className="rounded-full bg-black/50 px-3 py-1 text-xs text-white">
                  <Loader2 className="me-1 inline size-3 animate-spin" aria-hidden />
                  스캔 중…
                </span>
              </div>
            ) : null}
          </div>
          {hint ? <p className="text-sm text-[#675d53]">{hint}</p> : null}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              e.target.value = "";
              void onFile(f);
            }}
          />
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            variant="secondary"
            className="w-full border-[#1A3C2F]/20 bg-white text-[#1A3C2F]"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="me-2 size-4" aria-hidden />
            사진으로 스캔
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { parseSpotIdFromScan } from "@/lib/scan";

type Props = {
  open: boolean;
  onClose: () => void;
  onSpot: (spotId: string) => void;
};

const REGION_ID = "spot-qr-reader";

export function SpotScanner({ open, onClose, onSpot }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    handledRef.current = false;
    setError(null);
    let cancelled = false;

    const start = async () => {
      try {
        const scanner = new Html5Qrcode(REGION_ID);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 8, qrbox: { width: 220, height: 220 } },
          (decoded) => {
            if (handledRef.current || cancelled) return;
            const id = parseSpotIdFromScan(decoded);
            if (!id) {
              setError("위치 QR이 아닙니다. 칸 라벨을 스캔하세요.");
              return;
            }
            handledRef.current = true;
            onSpot(id);
            onClose();
          },
          () => undefined
        );
      } catch {
        if (!cancelled) {
          setError("카메라를 열 수 없습니다. 권한을 허용하거나 아래에서 직접 입력하세요.");
        }
      }
    };

    const t = window.setTimeout(() => void start(), 120);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s) {
        void s
          .stop()
          .then(() => s.clear())
          .catch(() => undefined);
      }
    };
  }, [open, onClose, onSpot]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-slate-900">QR 스캔</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-slate-500 px-2 py-1"
          >
            닫기
          </button>
        </div>
        <p className="text-xs text-slate-500">
          칸 라벨 QR을 비추면 해당 위치로 이동합니다
        </p>
        <div
          id={REGION_ID}
          className="overflow-hidden rounded-xl bg-slate-900 min-h-[220px]"
        />
        {error && <p className="text-xs text-amber-800">{error}</p>}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const id = parseSpotIdFromScan(manual);
            if (!id) {
              setError("올바른 위치 링크 또는 ID를 입력하세요");
              return;
            }
            onSpot(id);
            onClose();
          }}
        >
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="링크 붙여넣기"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-teal-800 px-3 py-2 text-sm text-white"
          >
            열기
          </button>
        </form>
      </div>
    </div>
  );
}

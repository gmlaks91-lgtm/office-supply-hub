"use client";

import { useState } from "react";
import { readActorName, writeActorName } from "@/lib/actor";
import type { InventoryItem } from "@/lib/types";

type Props = {
  item: InventoryItem;
  onConfirm: (actor: string, note: string | null) => void | Promise<void>;
  onClose: () => void;
};

export function UseItemDialog({ item, onConfirm, onClose }: Props) {
  const [actor, setActor] = useState(() => readActorName());
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      writeActorName(actor);
      await onConfirm(actor, note.trim() || null);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 space-y-3 shadow-xl">
        <h3 className="font-semibold text-slate-900">「{item.name}」 사용</h3>
        <p className="text-xs text-slate-500">1개 차감 · 사용 기록에 남깁니다</p>
        <label className="block text-xs text-slate-600">
          이름
          <input
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            placeholder="예: 김민수"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            autoFocus
          />
        </label>
        <label className="block text-xs text-slate-600">
          메모 (선택)
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="예: 회의실 A"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm"
            onClick={onClose}
            disabled={busy}
          >
            취소
          </button>
          <button
            type="button"
            className="flex-1 rounded-xl bg-teal-800 text-white py-2.5 text-sm font-medium disabled:opacity-50"
            onClick={() => void submit()}
            disabled={busy}
          >
            사용 확정
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { CoupangDeals } from "@/components/CoupangDeals";
import { readActorName, writeActorName } from "@/lib/actor";
import { CATEGORIES, seasonBannerForMonth } from "@/lib/defaults";
import { expiryLabel, isExpiredDoc, isExpiringSoon } from "@/lib/docs";
import { readSeasonPreviewMonth, readShowCoupang } from "@/lib/prefs";
import { spotPath } from "@/lib/storage";
import type { OfficeStore } from "@/lib/store";
import {
  levelBorder,
  levelColor,
  sortByUrgency,
  stockLabel,
  stockLevel,
} from "@/lib/stock";
import type { InventoryItem } from "@/lib/types";

type Props = {
  store: OfficeStore;
  onLocate?: (spotId: string) => void;
};

type FilterId = "all" | "reorder" | "requests" | "activity";

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function InventoryPanel({ store, onLocate }: Props) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [category, setCategory] = useState<string>("전체");
  const [useItem, setUseItem] = useState<InventoryItem | null>(null);
  const [useActor, setUseActor] = useState("");
  const [useNote, setUseNote] = useState("");
  const [reqItem, setReqItem] = useState<InventoryItem | null>(null);
  const [reqQty, setReqQty] = useState(1);
  const [reqNote, setReqNote] = useState("");
  const [editDoc, setEditDoc] = useState<InventoryItem | null>(null);
  const [docParty, setDocParty] = useState("");
  const [docExpiry, setDocExpiry] = useState("");

  const lowItems = useMemo(
    () => sortByUrgency(store.inventory.filter((i) => stockLevel(i) !== "ok")),
    [store.inventory]
  );

  const expiringDocs = useMemo(
    () =>
      store.inventory.filter(
        (i) => i.category === "서류" && (isExpiredDoc(i) || isExpiringSoon(i))
      ),
    [store.inventory]
  );

  const showCoupang = readShowCoupang();
  const seasonMonth = readSeasonPreviewMonth() ?? new Date().getMonth() + 1;
  const seasonMessage = seasonBannerForMonth(seasonMonth);

  const pending = useMemo(
    () => store.requests.filter((r) => r.status === "pending"),
    [store.requests]
  );

  const items = useMemo(() => {
    const sorted = sortByUrgency(store.inventory);
    const needle = q.trim().toLowerCase();
    let base =
      filter === "reorder"
        ? sorted.filter((i) => stockLevel(i) !== "ok")
        : sorted;
    if (category !== "전체") {
      base = base.filter((i) => i.category === category);
    }
    if (!needle) return base;
    return base.filter((item) => {
      const spot = item.storage_spot_id
        ? store.spots.find((s) => s.id === item.storage_spot_id)
        : null;
      const place = spot ? spotPath(spot, store.spots) : item.location;
      return (
        item.name.toLowerCase().includes(needle) ||
        item.category.toLowerCase().includes(needle) ||
        place.toLowerCase().includes(needle) ||
        (item.counterparty ?? "").toLowerCase().includes(needle)
      );
    });
  }, [category, filter, q, store.inventory, store.spots]);

  const placeLabel = (item: InventoryItem) => {
    if (item.storage_spot_id) {
      const spot = store.spots.find((s) => s.id === item.storage_spot_id);
      if (spot) return spotPath(spot, store.spots);
    }
    return item.location;
  };

  const openUse = (item: InventoryItem) => {
    setUseItem(item);
    setUseActor(readActorName());
    setUseNote("");
  };

  const confirmUse = async () => {
    if (!useItem) return;
    writeActorName(useActor);
    await store.adjustQuantity(useItem.id, -1, {
      actor: useActor,
      note: useNote.trim() || null,
    });
    setUseItem(null);
  };

  const openRequest = (item: InventoryItem) => {
    const need = Math.max(1, item.min_stock - item.quantity);
    setReqItem(item);
    setReqQty(need);
    setReqNote("");
  };

  const confirmRequest = async () => {
    if (!reqItem) return;
    await store.requestSupply({
      item_id: reqItem.id,
      item_name: reqItem.name,
      quantity: reqQty,
      note: reqNote.trim() || null,
    });
    setReqItem(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">재고 · 업무</h2>
        <p className="text-sm text-slate-500">
          부족 확인 · 사용 기록 · 주문 요청 · 누가 썼는지
        </p>
      </div>

      {seasonMessage && (
        <div className="w-full rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-left">
          <p className="text-sm font-medium text-teal-950">{seasonMessage}</p>
          <p className="mt-0.5 text-[11px] text-teal-800/70">
            {readSeasonPreviewMonth() != null
              ? `미리보기 · ${seasonMonth}월`
              : `${seasonMonth}월 안내`}
          </p>
        </div>
      )}

      {lowItems.length > 0 && filter === "all" && (
        <button
          type="button"
          onClick={() => setFilter("reorder")}
          className="w-full rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-left"
        >
          <p className="text-sm font-medium text-orange-950">
            부족·주문 필요 {lowItems.length}건
          </p>
          <p className="mt-0.5 text-xs text-orange-800/80">
            최소 재고 이하 품목을 모아 보고 채우거나 요청하세요
          </p>
        </button>
      )}

      {expiringDocs.length > 0 && filter === "all" && (
        <button
          type="button"
          onClick={() => setCategory("서류")}
          className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-left"
        >
          <p className="text-sm font-medium text-rose-950">
            서류 만료·임박 {expiringDocs.length}건
          </p>
          <p className="mt-0.5 text-xs text-rose-800/80">
            거래처·만료일을 확인하고 갱신하세요
          </p>
        </button>
      )}

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="예: 볼펜, 계약서, 창고…"
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm"
      />

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "all" as const, label: "전체" },
            {
              id: "reorder" as const,
              label: `부족·주문${lowItems.length ? ` ${lowItems.length}` : ""}`,
            },
            {
              id: "requests" as const,
              label: `요청${pending.length ? ` ${pending.length}` : ""}`,
            },
            { id: "activity" as const, label: "사용기록" },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              filter === f.id
                ? "bg-teal-800 text-white"
                : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {(filter === "all" || filter === "reorder") && (
        <div className="flex flex-wrap gap-1.5">
          {(["전체", ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                category === c
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {filter === "requests" ? (
        pending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 text-sm space-y-2">
            <p>대기 중인 요청이 없습니다.</p>
            <p className="text-xs text-slate-400">
              품목에서 「요청」을 누르면 담당자가 여기서 확인할 수 있습니다.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {pending.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border border-slate-200 bg-white p-3"
              >
                <p className="font-medium text-slate-900">
                  {r.item_name}{" "}
                  <span className="text-teal-800">×{r.quantity}</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {r.requester} · {formatTime(r.created_at)}
                  {r.note ? ` · ${r.note}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="text-xs rounded-lg bg-teal-700 text-white px-2.5 py-1"
                    onClick={() => void store.resolveRequest(r.id, "done", true)}
                  >
                    입고·완료
                  </button>
                  <button
                    type="button"
                    className="text-xs rounded-lg bg-white border border-slate-200 px-2.5 py-1"
                    onClick={() => void store.resolveRequest(r.id, "cancelled")}
                  >
                    취소
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : filter === "activity" ? (
        store.activity.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 text-sm space-y-2">
            <p>아직 사용 기록이 없습니다.</p>
            <p className="text-xs text-slate-400">
              재고에서 「사용」을 누르면 누가·언제 썼는지 남습니다. 설정에서 내 이름을
              먼저 넣으면 더 편합니다.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {store.activity.slice(0, 40).map((a) => (
              <li
                key={a.id}
                className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm"
              >
                <div className="flex justify-between gap-2">
                  <span className="font-medium text-slate-800">
                    {a.item_name}
                    {a.delta !== 0 && (
                      <span
                        className={
                          a.delta < 0 ? " text-red-600" : " text-emerald-700"
                        }
                      >
                        {" "}
                        {a.delta > 0 ? "+" : ""}
                        {a.delta}
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {formatTime(a.created_at)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {actionLabel(a.action)}
                  {a.actor ? ` · ${a.actor}` : ""}
                  {a.note ? ` · ${a.note}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 text-sm space-y-2">
          {q ? (
            <p>검색 결과가 없습니다.</p>
          ) : filter === "reorder" ? (
            <>
              <p>부족·임박 품목이 없습니다.</p>
              <p className="text-xs text-slate-400">
                품목마다 최소 재고를 두면 여기서 주문 후보가 모입니다.
              </p>
            </>
          ) : (
            <>
              <p>등록된 비품이 없습니다.</p>
              <p className="text-xs text-slate-400">
                위치 탭에서 칸을 열어 넣거나, 설정에서 CSV로 가져오세요.
              </p>
            </>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const level = stockLevel(item);
            return (
              <li
                key={item.id}
                className={`rounded-2xl border p-3 ${levelBorder(level)}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${levelColor(level)}`}
                      />
                      <p className="font-medium text-slate-900 truncate">
                        {item.name}
                      </p>
                    </div>
                    <p className="mt-2 text-sm font-medium text-teal-800 leading-snug">
                      {placeLabel(item)}
                    </p>
                    {(item.counterparty || item.expires_on) && (
                      <p className="mt-1 text-xs text-slate-600">
                        {item.counterparty ? `거래처 ${item.counterparty}` : ""}
                        {item.counterparty && item.expires_on ? " · " : ""}
                        {expiryLabel(item) && (
                          <span
                            className={
                              isExpiredDoc(item)
                                ? "text-rose-700 font-medium"
                                : isExpiringSoon(item)
                                  ? "text-amber-700 font-medium"
                                  : ""
                            }
                          >
                            {expiryLabel(item)}
                          </span>
                        )}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-slate-700">
                      {stockLabel(item)}
                      {item.min_stock > 0 && (
                        <span className="text-slate-400 text-xs">
                          {" "}
                          · 최소 {item.min_stock}
                          {item.unit}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="h-8 w-8 rounded-lg bg-white border border-slate-200"
                        aria-label="사용"
                        onClick={() => openUse(item)}
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="h-8 w-8 rounded-lg bg-white border border-slate-200"
                        aria-label="추가"
                        onClick={() => void store.adjustQuantity(item.id, 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="text-xs text-slate-400 hover:text-red-600"
                      onClick={() => {
                        if (confirm(`「${item.name}」 삭제?`)) {
                          void store.removeInventory(item.id);
                        }
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {level !== "ok" && (
                    <button
                      type="button"
                      className="text-xs rounded-lg bg-teal-700 text-white px-2.5 py-1"
                      onClick={() => void store.fillStock(item.id)}
                    >
                      채우기
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-xs rounded-lg bg-white border border-slate-200 px-2.5 py-1"
                    onClick={() => openRequest(item)}
                  >
                    요청
                  </button>
                  {item.storage_spot_id && onLocate && (
                    <button
                      type="button"
                      className="text-xs rounded-lg bg-white border border-slate-200 px-2.5 py-1"
                      onClick={() => onLocate(item.storage_spot_id!)}
                    >
                      위치에서 보기
                    </button>
                  )}
                  {item.category === "서류" && (
                    <button
                      type="button"
                      className="text-xs rounded-lg bg-white border border-slate-200 px-2.5 py-1"
                      onClick={() => {
                        setEditDoc(item);
                        setDocParty(item.counterparty ?? "");
                        setDocExpiry(item.expires_on?.slice(0, 10) ?? "");
                      }}
                    >
                      거래처·만료
                    </button>
                  )}
                </div>
                {showCoupang && level !== "ok" && item.category !== "서류" && (
                  <CoupangDeals keyword={item.name} />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {useItem && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 space-y-3 shadow-xl">
            <h3 className="font-semibold text-slate-900">
              「{useItem.name}」 사용
            </h3>
            <p className="text-xs text-slate-500">1개 차감 · 사용 기록에 남깁니다</p>
            <label className="block text-xs text-slate-600">
              이름
              <input
                value={useActor}
                onChange={(e) => setUseActor(e.target.value)}
                placeholder="예: 김민수"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs text-slate-600">
              메모 (선택)
              <input
                value={useNote}
                onChange={(e) => setUseNote(e.target.value)}
                placeholder="예: 회의실 A"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm"
                onClick={() => setUseItem(null)}
              >
                취소
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl bg-teal-800 text-white py-2.5 text-sm font-medium"
                onClick={() => void confirmUse()}
              >
                사용 확정
              </button>
            </div>
          </div>
        </div>
      )}

      {reqItem && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 space-y-3 shadow-xl">
            <h3 className="font-semibold text-slate-900">
              「{reqItem.name}」 요청
            </h3>
            <p className="text-xs text-slate-500">
              담당자 요청 목록에 올라갑니다 (현재{" "}
              {reqItem.quantity}
              {reqItem.unit})
            </p>
            <label className="block text-xs text-slate-600">
              수량
              <input
                type="number"
                min={1}
                value={reqQty}
                onChange={(e) => setReqQty(Math.max(1, Number(e.target.value) || 1))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs text-slate-600">
              메모 (선택)
              <input
                value={reqNote}
                onChange={(e) => setReqNote(e.target.value)}
                placeholder="예: 이번 주 중 필요"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm"
                onClick={() => setReqItem(null)}
              >
                취소
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl bg-teal-800 text-white py-2.5 text-sm font-medium"
                onClick={() => void confirmRequest()}
              >
                요청 보내기
              </button>
            </div>
          </div>
        </div>
      )}

      {editDoc && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 space-y-3 shadow-xl">
            <h3 className="font-semibold text-slate-900">
              「{editDoc.name}」 서류 정보
            </h3>
            <label className="block text-xs text-slate-600">
              거래처·업체
              <input
                value={docParty}
                onChange={(e) => setDocParty(e.target.value)}
                placeholder="예: 한빛솔루션"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs text-slate-600">
              만료일
              <input
                type="date"
                value={docExpiry}
                onChange={(e) => setDocExpiry(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm"
                onClick={() => setEditDoc(null)}
              >
                취소
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl bg-teal-800 text-white py-2.5 text-sm font-medium"
                onClick={() => {
                  void store
                    .updateInventory(editDoc.id, {
                      counterparty: docParty.trim() || null,
                      expires_on: docExpiry.trim() || null,
                    })
                    .then(() => setEditDoc(null));
                }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    use: "사용",
    add: "추가",
    fill: "채우기",
    request: "요청",
    fulfill: "입고완료",
    cancel: "요청취소",
    import: "CSV가져오기",
  };
  return map[action] ?? action;
}

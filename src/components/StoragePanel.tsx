"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { UseItemDialog } from "@/components/UseItemDialog";
import { QUICK_SUPPLIES } from "@/lib/defaults";
import { printSpotLabel } from "@/lib/labelPrint";
import {
  cardTitle,
  groupSpotsByParent,
  kindLabel,
  mapEntrances,
  mapFurniture,
  mapRooms,
  storageRoots,
  uniqueAreas,
} from "@/lib/storage";
import type { OfficeStore } from "@/lib/store";
import { levelColor, stockLabel, stockLevel } from "@/lib/stock";
import type { InventoryItem, StorageSpot } from "@/lib/types";

type Props = {
  store: OfficeStore;
  focusSpotId?: string | null;
};

export function StoragePanel({ store, focusSpotId }: Props) {
  const [q, setQ] = useState("");
  const [area, setArea] = useState<string>("전체");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [addName, setAddName] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [useItem, setUseItem] = useState<InventoryItem | null>(null);
  const detailRef = useRef<HTMLElement | null>(null);

  const scrollToDetail = () => {
    requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const selectFurniture = (spot: StorageSpot) => {
    setSelectedId(spot.id);
    setDrawerId(null);
    setArea(spot.area);
    scrollToDetail();
  };

  const { childrenOf } = useMemo(
    () => groupSpotsByParent(store.spots),
    [store.spots]
  );
  const roots = useMemo(() => storageRoots(store.spots), [store.spots]);
  const areas = useMemo(() => uniqueAreas(store.spots), [store.spots]);
  const rooms = useMemo(() => mapRooms(store.spots), [store.spots]);
  const entrances = useMemo(() => mapEntrances(store.spots), [store.spots]);
  const furniture = useMemo(() => mapFurniture(store.spots), [store.spots]);

  const itemsForRoot = (root: StorageSpot): InventoryItem[] => {
    const kids = childrenOf[root.id] ?? [];
    const ids = new Set([root.id, ...kids.map((k) => k.id)]);
    return store.inventory.filter(
      (i) => i.storage_spot_id && ids.has(i.storage_spot_id)
    );
  };

  const filteredRoots = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return roots.filter((root) => {
      if (area !== "전체" && root.area !== area) return false;
      if (!needle) return true;
      const title = cardTitle(root).toLowerCase();
      const items = itemsForRoot(root);
      const hitItem = items.some(
        (i) =>
          i.name.toLowerCase().includes(needle) ||
          i.category.toLowerCase().includes(needle) ||
          (i.counterparty ?? "").toLowerCase().includes(needle)
      );
      const hitDrawer = (childrenOf[root.id] ?? []).some((d) =>
        d.name.toLowerCase().includes(needle)
      );
      return title.includes(needle) || hitItem || hitDrawer;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- itemsForRoot uses store/childrenOf
  }, [area, q, roots, store.inventory, childrenOf]);

  const selected = store.spots.find((s) => s.id === selectedId) ?? null;
  const drawers = selected ? childrenOf[selected.id] ?? [] : [];

  const activeSpot = useMemo(() => {
    if (drawerId) return store.spots.find((s) => s.id === drawerId) ?? null;
    return selected;
  }, [drawerId, selected, store.spots]);

  const itemsHere = useMemo(() => {
    if (!activeSpot || !selected) return [];
    if (!drawerId && drawers.length > 0) {
      return itemsForRoot(selected);
    }
    return store.inventory.filter((i) => i.storage_spot_id === activeSpot.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSpot, drawerId, drawers.length, selected, store.inventory]);

  useEffect(() => {
    if (!focusSpotId) return;
    const spot = store.spots.find((s) => s.id === focusSpotId);
    if (!spot) return;
    if (spot.parent_id) {
      setSelectedId(spot.parent_id);
      setDrawerId(spot.id);
      const parent = store.spots.find((s) => s.id === spot.parent_id);
      if (parent) setArea(parent.area);
    } else {
      setSelectedId(spot.id);
      setDrawerId(null);
      if (spot.kind !== "room" && spot.kind !== "entrance") setArea(spot.area);
    }
    scrollToDetail();
  }, [focusSpotId, store.spots]);

  const addItem = async (
    name: string,
    qty = 1,
    unit = "개",
    category = "기타",
    minStock = 5
  ) => {
    if (!activeSpot) return;
    if (drawers.length > 0 && !drawerId) {
      setToast("서랍을 먼저 골라 주세요");
      return;
    }
    await store.addInventory({
      name,
      category,
      quantity: qty,
      min_stock: minStock,
      unit,
      location: activeSpot.area,
      storage_spot_id: activeSpot.id,
    });
    setAddName("");
    setToast(`「${name}」 넣었습니다`);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">위치 찾기</h2>
        <p className="text-sm text-slate-500">
          어디에 뭐가 있는지 카드로 바로 확인하세요
        </p>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="볼펜, 캐비닛, 창고…"
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm"
      />

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500">사무실 맵 · 부족 위치는 주황 테두리</p>
        <button
          type="button"
          onClick={() => setShowMiniMap((v) => !v)}
          className="text-xs font-medium text-teal-800 underline-offset-2 hover:underline"
        >
          {showMiniMap ? "맵 접기" : "맵 펼치기"}
        </button>
      </div>

      {showMiniMap && (
        <div className="relative w-full overflow-hidden rounded-2xl border-2 border-slate-300 bg-white shadow-sm">
          <div
            className="relative w-full bg-[#2a3544]"
            style={{
              aspectRatio: "1.15 / 1",
              minHeight: "280px",
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "12px 12px",
            }}
          >
            {rooms.map((room) => (
              <div
                key={room.id}
                className="absolute rounded border border-slate-600/60 pointer-events-none"
                style={{
                  left: `${room.x}%`,
                  top: `${room.y}%`,
                  width: `${room.w}%`,
                  height: `${room.h}%`,
                  background: room.color ?? "#d4e8dc",
                }}
              >
                <span className="absolute left-1.5 top-1 text-[11px] font-bold text-slate-800/90">
                  {room.name}
                </span>
              </div>
            ))}
            {entrances.map((ent) => (
              <div
                key={ent.id}
                className="absolute flex items-center justify-center rounded text-[10px] font-bold text-white pointer-events-none"
                style={{
                  left: `${ent.x}%`,
                  top: `${ent.y}%`,
                  width: `${ent.w}%`,
                  height: `${ent.h}%`,
                  background: "#0f766e",
                }}
              >
                ▼
              </div>
            ))}
            {furniture.map((spot) => {
              const urgent = itemsForRoot(spot).some(
                (i) => stockLevel(i) !== "ok"
              );
              const active = selectedId === spot.id;
              return (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() => selectFurniture(spot)}
                  className={`absolute rounded px-0.5 text-[10px] sm:text-[11px] font-bold text-white leading-snug overflow-hidden ${
                    active
                      ? "ring-2 ring-amber-300 z-10"
                      : urgent
                        ? "border-2 border-orange-400 shadow-[0_0_0_1px_rgba(251,146,60,0.5)]"
                        : "border border-black/30"
                  }`}
                  style={{
                    left: `${spot.x}%`,
                    top: `${spot.y}%`,
                    width: `${spot.w}%`,
                    height: `${spot.h}%`,
                    background: spot.color ?? "#64748b",
                  }}
                  title={spot.name}
                >
                  {spot.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setArea("전체")}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
            area === "전체"
              ? "bg-teal-700 text-white"
              : "bg-white border border-slate-200 text-slate-600"
          }`}
        >
          전체
        </button>
        {areas.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setArea(a)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
              area === a
                ? "bg-teal-700 text-white"
                : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      {filteredRoots.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 text-sm">
          {q || area !== "전체"
            ? "해당하는 위치가 없습니다."
            : "위치가 없습니다. 새로고침하거나 설정을 확인하세요."}
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredRoots.map((root) => {
            const items = itemsForRoot(root);
            const open = selectedId === root.id;
            const urgent = items.some((i) => stockLevel(i) !== "ok");
            return (
              <li key={root.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (open) {
                      setSelectedId(null);
                      setDrawerId(null);
                    } else {
                      setSelectedId(root.id);
                      setDrawerId(null);
                      scrollToDetail();
                    }
                  }}
                  className={`w-full text-left rounded-2xl border bg-white p-4 shadow-sm transition ${
                    open
                      ? "border-teal-500 ring-2 ring-teal-200"
                      : urgent
                        ? "border-orange-200"
                        : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {cardTitle(root)}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {kindLabel(root.kind)}
                        {(childrenOf[root.id] ?? []).length > 0
                          ? ` · 서랍 ${(childrenOf[root.id] ?? []).length}칸`
                          : ""}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {items.length}종
                    </span>
                  </div>

                  {items.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-400">비어 있음</p>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {items.slice(0, 8).map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-800"
                        >
                          <i
                            className={`h-1.5 w-1.5 rounded-full ${levelColor(stockLevel(item))}`}
                          />
                          {item.name}
                          <span className="text-slate-500">
                            {item.quantity}
                            {item.unit}
                          </span>
                        </span>
                      ))}
                      {items.length > 8 && (
                        <span className="text-xs text-slate-400 self-center">
                          +{items.length - 8}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selected && (
        <section
          ref={detailRef}
          className="rounded-3xl border border-teal-200 bg-white p-4 shadow-lg space-y-3 scroll-mt-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] text-teal-700">
                {kindLabel(selected.kind)}
              </p>
              <h3 className="text-lg font-semibold">{cardTitle(selected)}</h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                className="text-xs rounded-lg border border-slate-200 px-2 py-1 text-teal-800"
                onClick={() =>
                  printSpotLabel(activeSpot ?? selected, store.spots)
                }
              >
                라벨·QR
              </button>
              <button
                type="button"
                className="text-sm text-slate-400"
                onClick={() => {
                  setSelectedId(null);
                  setDrawerId(null);
                }}
              >
                닫기
              </button>
            </div>
          </div>

          {drawers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setDrawerId(null)}
                className={`rounded-xl border px-2.5 py-1.5 text-xs ${
                  !drawerId ? "border-teal-500 bg-teal-50" : "border-slate-200"
                }`}
              >
                전체
              </button>
              {drawers.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDrawerId(d.id)}
                  className={`rounded-xl border px-2.5 py-1.5 text-xs ${
                    drawerId === d.id
                      ? "border-teal-500 bg-teal-50"
                      : "border-slate-200"
                  }`}
                >
                  {d.name}
                </button>
              ))}
            </div>
          )}

          <ul className="space-y-2 max-h-44 overflow-y-auto">
            {itemsHere.length === 0 ? (
              <li className="text-sm text-slate-500 text-center py-4 border border-dashed rounded-2xl">
                비어 있어요
              </li>
            ) : (
              itemsHere.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${levelColor(stockLevel(item))}`}
                      />
                      <p className="truncate text-sm font-medium">{item.name}</p>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {stockLabel(item)}
                      {!drawerId &&
                      item.storage_spot_id &&
                      drawers.some((d) => d.id === item.storage_spot_id)
                        ? ` · ${
                            store.spots.find((s) => s.id === item.storage_spot_id)
                              ?.name ?? ""
                          }`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="h-7 w-7 rounded-lg border bg-white text-sm"
                      aria-label="사용"
                      disabled={item.quantity <= 0}
                      onClick={() => setUseItem(item)}
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="h-7 w-7 rounded-lg border bg-white text-sm"
                      aria-label="추가"
                      onClick={() => void store.adjustQuantity(item.id, 1)}
                    >
                      +
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>

          <div className="rounded-2xl bg-slate-900 p-3 text-white space-y-2">
            <p className="text-xs text-teal-200">
              이 자리에 넣기
              {drawers.length > 0 && !drawerId ? " · 서랍을 먼저 선택" : ""}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_SUPPLIES.slice(0, 8).map((qs) => (
                <button
                  key={qs.name}
                  type="button"
                  disabled={drawers.length > 0 && !drawerId}
                  onClick={() =>
                    void addItem(qs.name, 1, qs.unit, qs.category, qs.minStock)
                  }
                  className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] disabled:opacity-40"
                >
                  + {qs.name}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (addName.trim()) void addItem(addName.trim());
              }}
            >
              <input
                className="min-w-0 flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm placeholder:text-white/40"
                placeholder="이름 직접 입력"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                disabled={drawers.length > 0 && !drawerId}
              />
              <button
                type="submit"
                className="rounded-xl bg-teal-500 px-3 py-2 text-sm font-medium text-slate-900 disabled:opacity-40"
                disabled={!addName.trim() || (drawers.length > 0 && !drawerId)}
              >
                넣기
              </button>
            </form>
          </div>
        </section>
      )}

      {toast && (
        <p className="text-center text-sm text-teal-800 bg-teal-50 rounded-xl py-2">
          {toast}
        </p>
      )}

      {useItem && (
        <UseItemDialog
          key={useItem.id}
          item={useItem}
          onClose={() => setUseItem(null)}
          onConfirm={async (actor, note) => {
            await store.adjustQuantity(useItem.id, -1, { actor, note });
          }}
        />
      )}
    </div>
  );
}

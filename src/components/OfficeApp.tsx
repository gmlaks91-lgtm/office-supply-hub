"use client";

import { useCallback, useEffect, useState } from "react";
import { InventoryPanel } from "@/components/InventoryPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { SpotScanner } from "@/components/SpotScanner";
import { StoragePanel } from "@/components/StoragePanel";
import { useOfficeStore } from "@/lib/store";
import type { TabId } from "@/lib/types";

const TABS: { id: TabId; label: string }[] = [
  { id: "location", label: "위치" },
  { id: "inventory", label: "재고" },
  { id: "settings", label: "설정" },
];

export function OfficeApp() {
  const store = useOfficeStore();
  const [tab, setTab] = useState<TabId>("location");
  const [focusSpotId, setFocusSpotId] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);

  const openSpot = useCallback((spotId: string) => {
    setFocusSpotId(spotId);
    setTab("location");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const spot = params.get("spot");
    const tabParam = params.get("tab");
    if (spot) {
      setFocusSpotId(spot);
      setTab("location");
    } else if (tabParam === "inventory" || tabParam === "settings" || tabParam === "location") {
      setTab(tabParam);
    }
  }, []);

  if (!store.ready) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-slate-500">
        불러오는 중…
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[linear-gradient(165deg,#f0f7f4_0%,#eef2ff_45%,#f8fafc_100%)] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-lg px-4 py-3">
          <p className="text-[11px] tracking-[0.18em] uppercase text-teal-700/80">
            Office Supply Hub
          </p>
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-lg font-semibold leading-tight">
              {store.org ? `${store.org.name} · 위치 찾기` : "회사 비품 · 위치 찾기"}
            </h1>
            <button
              type="button"
              onClick={() => setScanOpen(true)}
              className="shrink-0 rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-900"
            >
              QR 스캔
            </button>
          </div>
          {store.usingLocal && (
            <p className="mt-1 text-[11px] text-amber-700">
              로컬 저장 중 · 설정에서 Supabase 연결 안내 확인
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-28 pt-4">
        {tab === "location" && (
          <StoragePanel store={store} focusSpotId={focusSpotId} />
        )}
        {tab === "inventory" && (
          <InventoryPanel store={store} onLocate={openSpot} />
        )}
        {tab === "settings" && <SettingsPanel store={store} />}
      </main>

      <SpotScanner
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onSpot={openSpot}
      />

      <nav className="fixed bottom-0 inset-x-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-lg grid grid-cols-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`py-3 text-sm font-medium ${
                tab === t.id ? "text-teal-800" : "text-slate-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

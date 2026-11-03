"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readActorName } from "./actor";
import { parseInventoryCsv } from "./csv";
import {
  buildDemoBundle,
  buildDemoInventory,
  isDemoSeeded,
  markDemoSeeded,
} from "./demoSeed";
import { lowStockPayload, sendLowStockNotify } from "./notify";
import { stockLevel } from "./stock";
import {
  areaFromPoint,
  FURNITURE_PALETTE,
  getLayout,
  type FurnitureKind,
} from "./floorPlan";
import {
  createLocalOrg,
  ensureDefaultOrg,
  joinLocalOrg,
  makeJoinCode,
  orgStorageKeys,
  readOrgs,
  writeCurrentOrg,
  writeOrgs,
} from "./org";
import {
  defaultDrawerNames,
  layoutToSpotSeeds,
  mapRooms,
  spotPath,
} from "./storage";
import { getSupabase, isSupabaseConfigured } from "./supabase";
import type {
  ActivityEntry,
  InventoryItem,
  Organization,
  StorageSpot,
  SupplyRequest,
} from "./types";

const ACTIVITY_CAP = 200;

/** 로컬 데모: 빈 재고·미시드일 때만 비품+사용기록+요청 삽입 */
function maybeSeedLocalDemo(
  spots: StorageSpot[],
  inventory: InventoryItem[],
  activity: ActivityEntry[],
  requests: SupplyRequest[],
  demoFlagKey: string
): {
  inventory: InventoryItem[];
  activity: ActivityEntry[];
  requests: SupplyRequest[];
} {
  if (inventory.length > 0 || isDemoSeeded(demoFlagKey)) {
    return { inventory, activity, requests };
  }
  if (
    spots.filter((s) => s.kind !== "room" && s.kind !== "entrance").length === 0
  ) {
    return { inventory, activity, requests };
  }
  const bundle = buildDemoBundle(spots);
  if (bundle.inventory.length === 0) {
    return { inventory, activity, requests };
  }
  markDemoSeeded(demoFlagKey);
  return bundle;
}

function uid(): string {
  return crypto.randomUUID();
}

function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeSpot(s: Partial<StorageSpot> & { id: string; name: string }): StorageSpot {
  return {
    id: s.id,
    name: s.name,
    area: s.area ?? "사무실",
    kind: s.kind ?? "desk",
    parent_id: s.parent_id ?? null,
    note: s.note ?? null,
    sort_order: s.sort_order ?? 0,
    map_key: s.map_key ?? null,
    x: s.x ?? null,
    y: s.y ?? null,
    w: s.w ?? null,
    h: s.h ?? null,
    color: s.color ?? null,
    rotation: s.rotation ?? 0,
    org_id: s.org_id ?? null,
    created_at: s.created_at ?? new Date().toISOString(),
  };
}

function normalizeInventory(i: Partial<InventoryItem> & { id: string; name: string }): InventoryItem {
  return {
    id: i.id,
    name: i.name,
    category: i.category ?? "기타",
    quantity: i.quantity ?? 0,
    min_stock: i.min_stock ?? 0,
    unit: i.unit ?? "개",
    location: i.location ?? "사무실",
    storage_spot_id: i.storage_spot_id ?? null,
    notes: i.notes ?? null,
    counterparty: i.counterparty ?? null,
    expires_on: i.expires_on ?? null,
    org_id: i.org_id ?? null,
    created_at: i.created_at ?? new Date().toISOString(),
    updated_at: i.updated_at ?? new Date().toISOString(),
  };
}

function seedSpots(layoutId = "standard", orgId?: string | null): StorageSpot[] {
  const layout = getLayout(layoutId);
  const now = new Date().toISOString();
  const seeded: StorageSpot[] = [];
  for (const seed of layoutToSpotSeeds(layout)) {
    if (seed.kind === "room" || seed.kind === "entrance") {
      seeded.push(
        normalizeSpot({ ...seed, id: uid(), org_id: orgId ?? null, created_at: now })
      );
      continue;
    }
    const parentId = uid();
    seeded.push(
      normalizeSpot({ ...seed, id: parentId, org_id: orgId ?? null, created_at: now })
    );
    const tpl = layout.furniture.find((t) => seed.map_key?.endsWith(t.mapKey));
    const def = FURNITURE_PALETTE.find((f) => f.kind === seed.kind);
    const n = tpl?.drawers ?? def?.drawers ?? 0;
    const names =
      tpl?.drawerNames && tpl.drawerNames.length > 0
        ? tpl.drawerNames
        : defaultDrawerNames(n);
    names.forEach((name, idx) => {
      seeded.push(
        normalizeSpot({
          id: uid(),
          name,
          area: seed.area,
          kind: "drawer",
          parent_id: parentId,
          sort_order: seed.sort_order + idx + 1,
          org_id: orgId ?? null,
          created_at: now,
        })
      );
    });
  }
  return seeded;
}

function ensureRoomsAndEntrance(spots: StorageSpot[]): StorageSpot[] {
  let next = spots;
  const now = new Date().toISOString();
  if (!next.some((s) => s.kind === "room")) {
    const layout = getLayout("standard");
    const rooms = layoutToSpotSeeds(layout)
      .filter((s) => s.kind === "room")
      .map((r) => normalizeSpot({ ...r, id: uid(), created_at: now }));
    next = [...rooms, ...next];
  }
  if (!next.some((s) => s.kind === "entrance")) {
    next = [
      normalizeSpot({
        id: uid(),
        name: "입구",
        area: "입구",
        kind: "entrance",
        sort_order: 0,
        map_key: `entrance-migrated-${Date.now()}`,
        x: 24,
        y: 2,
        w: 16,
        h: 7,
        color: "#0f766e",
        rotation: 0,
        created_at: now,
      }),
      ...next,
    ];
  }
  return next;
}

function roomsForPoint(spots: StorageSpot[]) {
  return mapRooms(spots).map((r) => ({
    name: r.name,
    x: r.x!,
    y: r.y!,
    w: r.w!,
    h: r.h!,
  }));
}

export function useOfficeStore() {
  const [ready, setReady] = useState(false);
  const [usingLocal, setUsingLocal] = useState(false);
  const [org, setOrg] = useState<Organization | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [spots, setSpots] = useState<StorageSpot[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [requests, setRequests] = useState<SupplyRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [highlightSpotId, setHighlightSpotId] = useState<string | null>(null);
  const [layoutId, setLayoutId] = useState("standard");
  const orgIdRef = useRef<string | null>(null);

  const persist = useCallback((nextInv?: InventoryItem[], nextSpots?: StorageSpot[]) => {
    const id = orgIdRef.current;
    if (!id) return;
    const k = orgStorageKeys(id);
    if (nextInv) writeLS(k.inv, nextInv);
    if (nextSpots) writeLS(k.spots, nextSpots);
  }, []);

  const persistActivity = useCallback((next: ActivityEntry[]) => {
    const id = orgIdRef.current;
    if (!id) return;
    writeLS(orgStorageKeys(id).activity, next.slice(0, ACTIVITY_CAP));
  }, []);

  const persistRequests = useCallback((next: SupplyRequest[]) => {
    const id = orgIdRef.current;
    if (!id) return;
    writeLS(orgStorageKeys(id).requests, next);
  }, []);

  const pushActivity = useCallback(
    async (entry: Omit<ActivityEntry, "id" | "created_at"> & { id?: string; created_at?: string }) => {
      const orgId = orgIdRef.current;
      const localId = entry.id ?? uid();
      const row: ActivityEntry = {
        id: localId,
        item_id: entry.item_id,
        item_name: entry.item_name,
        action: entry.action,
        delta: entry.delta,
        actor: entry.actor,
        note: entry.note,
        org_id: orgId,
        created_at: entry.created_at ?? new Date().toISOString(),
      };
      setActivity((prev) => {
        const next = [row, ...prev].slice(0, ACTIVITY_CAP);
        persistActivity(next);
        return next;
      });
      const sb = getSupabase();
      if (sb && isSupabaseConfigured()) {
        const { data } = await sb
          .from("activity_log")
          .insert({
            item_id: row.item_id,
            item_name: row.item_name,
            action: row.action,
            delta: row.delta,
            actor: row.actor,
            note: row.note,
            org_id: orgId,
          })
          .select()
          .single();
        if (data) {
          const remote = data as ActivityEntry;
          setActivity((prev) => {
            const next = prev
              .map((a) => (a.id === localId ? remote : a))
              .slice(0, ACTIVITY_CAP);
            persistActivity(next);
            return next;
          });
        }
      }
    },
    [persistActivity]
  );

  const loadLocalOrgData = useCallback((current: Organization) => {
    const k = orgStorageKeys(current.id);
    setLayoutId(readLS(k.layout, "standard"));
    let localSpots = readLS<StorageSpot[]>(k.spots, []);
    if (localSpots.length === 0) {
      localSpots = readLS<StorageSpot[]>("office_storage_spots_v4", []);
    }
    if (localSpots.length === 0) {
      localSpots = readLS<StorageSpot[]>("office_storage_spots_v3", []);
    }
    localSpots = ensureRoomsAndEntrance(localSpots.map((s) => normalizeSpot(s)));
    if (localSpots.length === 0) localSpots = seedSpots("standard", current.id);
    writeLS(k.spots, localSpots);
    setSpots(localSpots);
    const seeded = maybeSeedLocalDemo(
      localSpots,
      readLS(k.inv, []),
      readLS(k.activity, []),
      readLS(k.requests, []),
      k.demo
    );
    const localInv = seeded.inventory.map((i) =>
      normalizeInventory({ ...i, org_id: current.id })
    );
    const localActivity = seeded.activity.map((a) => ({
      ...a,
      org_id: current.id,
    }));
    const localRequests = seeded.requests.map((r) => ({
      ...r,
      org_id: current.id,
    }));
    writeLS(k.inv, localInv);
    writeLS(k.activity, localActivity);
    writeLS(k.requests, localRequests);
    setInventory(localInv);
    setActivity(localActivity);
    setRequests(localRequests);
  }, []);

  const ensureRemoteOrg = useCallback(async (current: Organization) => {
    const sb = getSupabase();
    if (!sb) return current;
    const { data: byId } = await sb
      .from("organizations")
      .select("*")
      .eq("id", current.id)
      .maybeSingle();
    if (byId) return byId as Organization;
    const { data: created, error: e } = await sb
      .from("organizations")
      .insert({
        id: current.id,
        name: current.name,
        join_code: current.join_code,
      })
      .select()
      .single();
    if (e || !created) {
      // join_code 충돌 시 코드만 바꿔 재시도
      const retryCode = makeJoinCode();
      const { data: again } = await sb
        .from("organizations")
        .insert({ id: current.id, name: current.name, join_code: retryCode })
        .select()
        .single();
      if (again) {
        const updated = again as Organization;
        writeCurrentOrg(updated);
        const list = readOrgs().map((o) => (o.id === updated.id ? updated : o));
        writeOrgs(list);
        return updated;
      }
      return current;
    }
    return created as Organization;
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    let current = ensureDefaultOrg();
    orgIdRef.current = current.id;
    setOrg(current);
    const k = orgStorageKeys(current.id);

    const sb = getSupabase();
    if (!sb || !isSupabaseConfigured()) {
      setUsingLocal(true);
      loadLocalOrgData(current);
      setReady(true);
      return;
    }

    setUsingLocal(false);
    current = await ensureRemoteOrg(current);
    orgIdRef.current = current.id;
    setOrg(current);

    const [inv, spot] = await Promise.all([
      sb
        .from("inventory_items")
        .select("*")
        .eq("org_id", current.id)
        .order("updated_at", { ascending: false }),
      sb
        .from("storage_spots")
        .select("*")
        .eq("org_id", current.id)
        .order("sort_order", { ascending: true }),
    ]);

    if (inv.error || spot.error) {
      // org_id 컬럼 미적용 등 → 로컬 폴백
      setError(inv.error?.message || spot.error?.message || "데이터 로드 실패");
      setUsingLocal(true);
      loadLocalOrgData(current);
      setReady(true);
      return;
    }

    let remoteSpots = ((spot.data as StorageSpot[]) ?? []).map((s) => normalizeSpot(s));
    if (remoteSpots.length === 0) {
      const seeded = seedSpots("standard", current.id);
      const parents = seeded.filter((s) => !s.parent_id);
      for (const p of parents) {
        const { data: created, error: e1 } = await sb
          .from("storage_spots")
          .insert({
            name: p.name,
            area: p.area,
            kind: p.kind,
            note: p.note,
            sort_order: p.sort_order,
            map_key: p.map_key,
            x: p.x,
            y: p.y,
            w: p.w,
            h: p.h,
            color: p.color,
            rotation: p.rotation ?? 0,
            org_id: current.id,
          })
          .select()
          .single();
        if (e1 || !created) continue;
        const drawers = seeded.filter((s) => s.parent_id === p.id);
        if (drawers.length) {
          await sb.from("storage_spots").insert(
            drawers.map((d) => ({
              name: d.name,
              area: d.area,
              kind: "drawer",
              parent_id: created.id,
              sort_order: d.sort_order,
              org_id: current.id,
            }))
          );
        }
      }
      const again = await sb
        .from("storage_spots")
        .select("*")
        .eq("org_id", current.id)
        .order("sort_order");
      remoteSpots = ((again.data as StorageSpot[]) ?? []).map((s) => normalizeSpot(s));
    } else {
      remoteSpots = ensureRoomsAndEntrance(remoteSpots);
    }
    setSpots(remoteSpots);
    writeLS(k.spots, remoteSpots);

    let remoteInv = ((inv.data as InventoryItem[]) ?? []).map((i) =>
      normalizeInventory(i)
    );
    if (remoteInv.length === 0 && !isDemoSeeded(k.demo) && remoteSpots.length > 0) {
      const demo = buildDemoInventory(remoteSpots).map((i) => ({
        ...i,
        org_id: current.id,
      }));
      if (demo.length > 0) {
        const rows = demo.map(({ id: _id, created_at: _c, updated_at: _u, ...rest }) => rest);
        const { error: demoErr } = await sb.from("inventory_items").insert(rows);
        if (!demoErr) {
          markDemoSeeded(k.demo);
          const againInv = await sb
            .from("inventory_items")
            .select("*")
            .eq("org_id", current.id)
            .order("updated_at", { ascending: false });
          remoteInv = (againInv.data as InventoryItem[]) ?? demo;
        }
      }
    }
    setInventory(remoteInv);
    writeLS(k.inv, remoteInv);

    const [actRes, reqRes] = await Promise.all([
      sb
        .from("activity_log")
        .select("*")
        .eq("org_id", current.id)
        .order("created_at", { ascending: false })
        .limit(ACTIVITY_CAP),
      sb
        .from("supply_requests")
        .select("*")
        .eq("org_id", current.id)
        .order("created_at", { ascending: false }),
    ]);
    if (!actRes.error && actRes.data) {
      setActivity(actRes.data as ActivityEntry[]);
    } else {
      setActivity(readLS<ActivityEntry[]>(k.activity, []));
    }
    if (!reqRes.error && reqRes.data) {
      setRequests(reqRes.data as SupplyRequest[]);
    } else {
      setRequests(readLS<SupplyRequest[]>(k.requests, []));
    }
    setLayoutId(readLS(k.layout, "standard"));
    setReady(true);
  }, [ensureRemoteOrg, loadLocalOrgData]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Supabase Realtime — 같은 회사(org) 다른 기기 변경 반영 (로컬 데모는 구독 안 함) */
  useEffect(() => {
    if (!ready || usingLocal) return;
    const sb = getSupabase();
    const orgId = org?.id ?? orgIdRef.current;
    if (!sb || !orgId || !isSupabaseConfigured()) return;

    const channel = sb
      .channel(`office-org-${orgId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inventory_items",
          filter: `org_id=eq.${orgId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldId = (payload.old as { id?: string }).id;
            if (!oldId) return;
            setInventory((prev) => {
              const next = prev.filter((i) => i.id !== oldId);
              persist(next);
              return next;
            });
            return;
          }
          const raw = payload.new as InventoryItem;
          if (!raw?.id) return;
          const row = normalizeInventory(raw);
          setInventory((prev) => {
            const idx = prev.findIndex((i) => i.id === row.id);
            const next =
              idx >= 0
                ? prev.map((i) => (i.id === row.id ? row : i))
                : [row, ...prev];
            persist(next);
            return next;
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "supply_requests",
          filter: `org_id=eq.${orgId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldId = (payload.old as { id?: string }).id;
            if (!oldId) return;
            setRequests((prev) => {
              const next = prev.filter((r) => r.id !== oldId);
              persistRequests(next);
              return next;
            });
            return;
          }
          const row = payload.new as SupplyRequest;
          if (!row?.id) return;
          setRequests((prev) => {
            const idx = prev.findIndex((r) => r.id === row.id);
            const next =
              idx >= 0
                ? prev.map((r) => (r.id === row.id ? row : r))
                : [row, ...prev];
            persistRequests(next);
            return next;
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "activity_log",
          filter: `org_id=eq.${orgId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldId = (payload.old as { id?: string }).id;
            if (!oldId) return;
            setActivity((prev) => {
              const next = prev.filter((a) => a.id !== oldId);
              persistActivity(next);
              return next;
            });
            return;
          }
          if (payload.eventType !== "INSERT" && payload.eventType !== "UPDATE") {
            return;
          }
          const row = payload.new as ActivityEntry;
          if (!row?.id) return;
          setActivity((prev) => {
            if (prev.some((a) => a.id === row.id)) {
              const next = prev.map((a) => (a.id === row.id ? row : a));
              persistActivity(next);
              return next;
            }
            const next = [row, ...prev].slice(0, ACTIVITY_CAP);
            persistActivity(next);
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      void sb.removeChannel(channel);
    };
  }, [org?.id, persist, persistActivity, persistRequests, ready, usingLocal]);

  const applyLayoutTemplate = useCallback(
    async (id: string) => {
      const orgId = orgIdRef.current;
      const seeded = seedSpots(id, orgId);
      if (orgId) writeLS(orgStorageKeys(orgId).layout, id);
      setLayoutId(id);
      const nextInv = inventory.map((i) => ({ ...i, storage_spot_id: null }));
      const sb = getSupabase();
      if (!sb || usingLocal) {
        setSpots(seeded);
        setInventory(nextInv);
        persist(nextInv, seeded);
        return;
      }
      if (orgId) {
        await sb
          .from("inventory_items")
          .update({ storage_spot_id: null })
          .eq("org_id", orgId);
        await sb.from("storage_spots").delete().eq("org_id", orgId);
      }
      for (const p of seeded.filter((s) => !s.parent_id)) {
        const { data: created, error: e1 } = await sb
          .from("storage_spots")
          .insert({
            name: p.name,
            area: p.area,
            kind: p.kind,
            note: p.note,
            sort_order: p.sort_order,
            map_key: p.map_key,
            x: p.x,
            y: p.y,
            w: p.w,
            h: p.h,
            color: p.color,
            rotation: p.rotation ?? 0,
            org_id: orgId,
          })
          .select()
          .single();
        if (e1 || !created) continue;
        const drawers = seeded.filter((s) => s.parent_id === p.id);
        if (drawers.length) {
          await sb.from("storage_spots").insert(
            drawers.map((d) => ({
              name: d.name,
              area: d.area,
              kind: "drawer",
              parent_id: created.id,
              sort_order: d.sort_order,
              org_id: orgId,
            }))
          );
        }
      }
      setInventory(nextInv);
      await refresh();
    },
    [inventory, persist, refresh, usingLocal]
  );

  const resetMapToTemplate = useCallback(async () => {
    await applyLayoutTemplate(layoutId || "standard");
  }, [applyLayoutTemplate, layoutId]);

  const addFurniture = useCallback(
    async (input: {
      kind: FurnitureKind;
      name?: string;
      x: number;
      y: number;
    }) => {
      const def = FURNITURE_PALETTE.find((f) => f.kind === input.kind);
      if (!def) throw new Error("알 수 없는 가구");
      const now = new Date().toISOString();
      const isRoom = input.kind === "room";
      const isEntrance = input.kind === "entrance";
      const layout = {
        x: input.x,
        y: input.y,
        w: def.defaultW,
        h: def.defaultH,
      };
      const defaultName =
        input.name?.trim() ||
        (isEntrance
          ? "입구"
          : `${def.label} ${spots.filter((s) => s.kind === input.kind && !s.parent_id).length + 1}`);
      const area = isRoom || isEntrance
        ? defaultName
        : areaFromPoint(
            layout.x + layout.w / 2,
            layout.y + layout.h / 2,
            roomsForPoint(spots)
          );
      const parent = normalizeSpot({
        id: uid(),
        name: defaultName,
        area,
        kind: input.kind,
        sort_order: spots.length + 1,
        map_key: `${input.kind}-${Date.now()}`,
        x: layout.x,
        y: layout.y,
        w: layout.w,
        h: layout.h,
        color: def.color,
        rotation: isEntrance ? 0 : 0,
        org_id: orgIdRef.current,
        created_at: now,
      });
      if (isRoom) parent.area = parent.name;
      const drawers: StorageSpot[] = [];
      if (def.drawers) {
        defaultDrawerNames(def.drawers).forEach((name, idx) => {
          drawers.push(
            normalizeSpot({
              id: uid(),
              name,
              area,
              kind: "drawer",
              parent_id: parent.id,
              sort_order: parent.sort_order + idx + 1,
              org_id: orgIdRef.current,
              created_at: now,
            })
          );
        });
      }

      const sb = getSupabase();
      if (!sb || usingLocal) {
        const next = [...spots, parent, ...drawers];
        setSpots(next);
        persist(undefined, next);
        return parent;
      }
      const { data, error: err } = await sb
        .from("storage_spots")
        .insert({
          name: parent.name,
          area: parent.area,
          kind: parent.kind,
          sort_order: parent.sort_order,
          map_key: parent.map_key,
          x: parent.x,
          y: parent.y,
          w: parent.w,
          h: parent.h,
          color: parent.color,
          rotation: parent.rotation ?? 0,
          org_id: orgIdRef.current,
        })
        .select()
        .single();
      if (err) throw err;
      const created = normalizeSpot(data as StorageSpot);
      if (drawers.length) {
        await sb.from("storage_spots").insert(
          drawers.map((d) => ({
            name: d.name,
            area: d.area,
            kind: "drawer",
            parent_id: created.id,
            sort_order: d.sort_order,
            org_id: orgIdRef.current,
          }))
        );
      }
      await refresh();
      return created;
    },
    [persist, refresh, spots, usingLocal]
  );

  const updateSpot = useCallback(
    async (id: string, patch: Partial<StorageSpot>) => {
      const sb = getSupabase();
      if (!sb || usingLocal) {
        const next = spots.map((s) => {
          if (s.id !== id) return s;
          const merged = { ...s, ...patch };
          if ((merged.kind === "room" || merged.kind === "entrance") && patch.name) {
            merged.area = patch.name;
          } else if (
            merged.kind !== "room" &&
            merged.kind !== "entrance" &&
            (patch.x != null || patch.y != null)
          ) {
            merged.area = areaFromPoint(
              (patch.x ?? s.x ?? 0) + (merged.w ?? s.w ?? 10) / 2,
              (patch.y ?? s.y ?? 0) + (merged.h ?? s.h ?? 10) / 2,
              roomsForPoint(
                spots.map((x) => (x.id === id ? { ...x, ...patch } : x))
              )
            );
          }
          return merged;
        });
        const updated = next.find((s) => s.id === id);
        const final = updated
          ? next.map((s) => {
              if (s.parent_id === id) return { ...s, area: updated.area };
              if (updated.kind === "room" && patch.name && s.area === spots.find((o) => o.id === id)?.name) {
                return { ...s, area: updated.name };
              }
              return s;
            })
          : next;
        setSpots(final);
        persist(undefined, final);
        return;
      }
      const { error: err } = await sb.from("storage_spots").update(patch).eq("id", id);
      if (err) throw err;
      await refresh();
    },
    [persist, refresh, spots, usingLocal]
  );

  const removeSpot = useCallback(
    async (id: string) => {
      const removeIds = new Set(
        spots.filter((s) => s.id === id || s.parent_id === id).map((s) => s.id)
      );
      const sb = getSupabase();
      if (!sb || usingLocal) {
        const nextSpots = spots.filter((s) => !removeIds.has(s.id));
        const nextInv = inventory.map((i) =>
          i.storage_spot_id && removeIds.has(i.storage_spot_id)
            ? { ...i, storage_spot_id: null }
            : i
        );
        setSpots(nextSpots);
        setInventory(nextInv);
        persist(nextInv, nextSpots);
        return;
      }
      await sb.from("storage_spots").delete().eq("id", id);
      await refresh();
    },
    [inventory, persist, refresh, spots, usingLocal]
  );

  const addInventory = useCallback(
    async (input: {
      name: string;
      category?: string;
      quantity: number;
      min_stock: number;
      unit?: string;
      location: string;
      storage_spot_id: string | null;
      notes?: string | null;
      counterparty?: string | null;
      expires_on?: string | null;
    }) => {
      const now = new Date().toISOString();
      const orgId = orgIdRef.current;
      const row: InventoryItem = {
        id: uid(),
        name: input.name.trim(),
        category: input.category ?? "기타",
        quantity: input.quantity,
        min_stock: input.min_stock,
        unit: input.unit ?? "개",
        location: input.location,
        storage_spot_id: input.storage_spot_id,
        notes: input.notes ?? null,
        counterparty: input.counterparty?.trim() || null,
        expires_on: input.expires_on?.trim() || null,
        org_id: orgId,
        created_at: now,
        updated_at: now,
      };

      const same = (i: InventoryItem) =>
        i.name === row.name &&
        (row.storage_spot_id
          ? i.storage_spot_id === row.storage_spot_id
          : !i.storage_spot_id && i.location === row.location);

      const sb = getSupabase();
      if (!sb || usingLocal) {
        const existing = inventory.find(same);
        const next = existing
          ? inventory.map((i) =>
              i.id === existing.id
                ? {
                    ...i,
                    quantity: i.quantity + row.quantity,
                    min_stock: row.min_stock,
                    updated_at: now,
                  }
                : i
            )
          : [row, ...inventory];
        setInventory(next);
        persist(next);
        return;
      }
      let q = sb.from("inventory_items").select("*").eq("name", row.name);
      if (orgId) q = q.eq("org_id", orgId);
      if (row.storage_spot_id) q = q.eq("storage_spot_id", row.storage_spot_id);
      else q = q.eq("location", row.location).is("storage_spot_id", null);
      const { data: ex } = await q.maybeSingle();
      if (ex) {
        await sb
          .from("inventory_items")
          .update({
            quantity: (ex as InventoryItem).quantity + row.quantity,
            min_stock: row.min_stock,
          })
          .eq("id", ex.id);
      } else {
        const { error: err } = await sb.from("inventory_items").insert({
          name: row.name,
          category: row.category,
          quantity: row.quantity,
          min_stock: row.min_stock,
          unit: row.unit,
          location: row.location,
          storage_spot_id: row.storage_spot_id,
          notes: row.notes,
          counterparty: row.counterparty,
          expires_on: row.expires_on,
          org_id: orgId,
        });
        if (err) throw err;
      }
      await refresh();
    },
    [inventory, persist, refresh, usingLocal]
  );

  const updateInventory = useCallback(
    async (id: string, patch: Partial<InventoryItem>) => {
      const updated_at = new Date().toISOString();
      const applyLocal = () => {
        setInventory((prev) => {
          const next = prev.map((i) =>
            i.id === id ? { ...i, ...patch, updated_at } : i
          );
          persist(next);
          return next;
        });
      };

      const sb = getSupabase();
      if (!sb || usingLocal) {
        applyLocal();
        return;
      }
      const { error: err } = await sb
        .from("inventory_items")
        .update({ ...patch, updated_at })
        .eq("id", id);
      if (err) throw err;
      applyLocal();
    },
    [persist, usingLocal]
  );

  const removeInventory = useCallback(
    async (id: string) => {
      const sb = getSupabase();
      if (!sb || usingLocal) {
        const next = inventory.filter((i) => i.id !== id);
        setInventory(next);
        persist(next);
        return;
      }
      await sb.from("inventory_items").delete().eq("id", id);
      await refresh();
    },
    [inventory, persist, refresh, usingLocal]
  );

  const fillStock = useCallback(
    async (id: string) => {
      const item = inventory.find((i) => i.id === id);
      if (!item) return;
      const target = Math.max(item.min_stock, item.quantity + item.min_stock);
      const delta = target - item.quantity;
      await updateInventory(id, { quantity: target });
      await pushActivity({
        item_id: item.id,
        item_name: item.name,
        action: "fill",
        delta,
        actor: readActorName() || null,
        note: null,
      });
    },
    [inventory, pushActivity, updateInventory]
  );

  /** 사용(−) / 추가(+) with 감사 로그 */
  const adjustQuantity = useCallback(
    async (
      id: string,
      delta: number,
      opts?: { actor?: string; note?: string | null }
    ) => {
      const item = inventory.find((i) => i.id === id);
      if (!item || delta === 0) return;
      const wasOk = stockLevel(item) === "ok";
      const nextQty = Math.max(0, item.quantity + delta);
      const applied = nextQty - item.quantity;
      if (applied === 0) return;
      const nextItem = { ...item, quantity: nextQty };
      await updateInventory(id, { quantity: nextQty });
      await pushActivity({
        item_id: item.id,
        item_name: item.name,
        action: applied < 0 ? "use" : "add",
        delta: applied,
        actor: (opts?.actor ?? readActorName()) || null,
        note: opts?.note ?? null,
      });
      // 정상 → 부족으로 바뀌면 알림 시도 (쿨다운·미설정 시 무시)
      if (wasOk && stockLevel(nextItem) !== "ok" && applied < 0) {
        const place = item.storage_spot_id
          ? (() => {
              const s = spots.find((x) => x.id === item.storage_spot_id);
              return s ? spotPath(s, spots) : item.location;
            })()
          : item.location;
        void sendLowStockNotify({
          items: [
            {
              id: item.id,
              name: item.name,
              quantity: nextQty,
              min_stock: item.min_stock,
              unit: item.unit,
              location: place,
              category: item.category,
            },
          ],
          orgName: orgIdRef.current ? org?.name : null,
        }).catch(() => undefined);
      }
    },
    [inventory, org?.name, pushActivity, spots, updateInventory]
  );

  const notifyLowStockNow = useCallback(
    async (force = true) => {
      const items = lowStockPayload(inventory, (item) => {
        if (item.storage_spot_id) {
          const s = spots.find((x) => x.id === item.storage_spot_id);
          if (s) return spotPath(s, spots);
        }
        return item.location;
      });
      return sendLowStockNotify({
        items,
        orgName: org?.name,
        force,
      });
    },
    [inventory, org?.name, spots]
  );

  const requestSupply = useCallback(
    async (input: {
      item_id?: string | null;
      item_name: string;
      quantity: number;
      requester?: string;
      note?: string | null;
    }) => {
      const row: SupplyRequest = {
        id: uid(),
        item_id: input.item_id ?? null,
        item_name: input.item_name.trim(),
        quantity: Math.max(1, Math.floor(input.quantity)),
        requester: (input.requester ?? readActorName()).trim() || "직원",
        status: "pending",
        note: input.note ?? null,
        org_id: orgIdRef.current,
        created_at: new Date().toISOString(),
        resolved_at: null,
      };
      const sb = getSupabase();
      if (!sb || usingLocal) {
        const next = [row, ...requests];
        setRequests(next);
        persistRequests(next);
      } else {
        const { data, error: err } = await sb
          .from("supply_requests")
          .insert({
            item_id: row.item_id,
            item_name: row.item_name,
            quantity: row.quantity,
            requester: row.requester,
            status: row.status,
            note: row.note,
            org_id: row.org_id,
          })
          .select()
          .single();
        if (err) {
          const next = [row, ...requests];
          setRequests(next);
          persistRequests(next);
        } else if (data) {
          setRequests((prev) => [data as SupplyRequest, ...prev]);
        }
      }
      await pushActivity({
        item_id: row.item_id,
        item_name: row.item_name,
        action: "request",
        delta: row.quantity,
        actor: row.requester,
        note: row.note,
      });
    },
    [persistRequests, pushActivity, requests, usingLocal]
  );

  const resolveRequest = useCallback(
    async (id: string, status: "done" | "cancelled", fulfill = false) => {
      const req = requests.find((r) => r.id === id);
      if (!req || req.status !== "pending") return;
      const resolved_at = new Date().toISOString();
      if (fulfill && req.item_id) {
        const item = inventory.find((i) => i.id === req.item_id);
        if (item) {
          await updateInventory(item.id, {
            quantity: item.quantity + req.quantity,
          });
        }
      }
      const patch = { status, resolved_at };
      const sb = getSupabase();
      if (!sb || usingLocal) {
        const next = requests.map((r) => (r.id === id ? { ...r, ...patch } : r));
        setRequests(next);
        persistRequests(next);
      } else {
        const { error: err } = await sb
          .from("supply_requests")
          .update(patch)
          .eq("id", id);
        if (err) {
          const next = requests.map((r) => (r.id === id ? { ...r, ...patch } : r));
          setRequests(next);
          persistRequests(next);
        } else {
          setRequests((prev) =>
            prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
          );
        }
      }
      await pushActivity({
        item_id: req.item_id,
        item_name: req.item_name,
        action: status === "done" ? "fulfill" : "cancel",
        delta: status === "done" ? req.quantity : 0,
        actor: readActorName() || null,
        note: null,
      });
    },
    [inventory, persistRequests, pushActivity, requests, updateInventory, usingLocal]
  );

  const importInventoryCsvText = useCallback(
    async (text: string) => {
      const rows = parseInventoryCsv(text);
      if (rows.length === 0) throw new Error("가져올 행이 없습니다.");
      const now = new Date().toISOString();
      let next = [...inventory];
      for (const row of rows) {
        const name = row.name.trim();
        const existing = next.find(
          (i) =>
            i.name === name &&
            !i.storage_spot_id &&
            i.location === row.location
        );
        if (existing) {
          next = next.map((i) =>
            i.id === existing.id
              ? {
                  ...i,
                  quantity: i.quantity + row.quantity,
                  min_stock: row.min_stock,
                  category: row.category,
                  unit: row.unit,
                  notes: row.notes ?? i.notes,
                  counterparty: row.counterparty ?? i.counterparty,
                  expires_on: row.expires_on ?? i.expires_on,
                  updated_at: now,
                }
              : i
          );
        } else {
          next = [
            {
              id: uid(),
              name,
              category: row.category,
              quantity: row.quantity,
              min_stock: row.min_stock,
              unit: row.unit,
              location: row.location,
              storage_spot_id: null,
              notes: row.notes,
              counterparty: row.counterparty,
              expires_on: row.expires_on,
              created_at: now,
              updated_at: now,
            },
            ...next,
          ];
        }
      }
      const sb = getSupabase();
      if (!sb || usingLocal) {
        setInventory(next);
        persist(next);
      } else {
        for (const row of rows) {
          await addInventory({
            name: row.name,
            category: row.category,
            quantity: row.quantity,
            min_stock: row.min_stock,
            unit: row.unit,
            location: row.location,
            storage_spot_id: null,
            notes: row.notes,
            counterparty: row.counterparty,
            expires_on: row.expires_on,
          });
        }
        await refresh();
      }
      await pushActivity({
        item_id: null,
        item_name: `${rows.length}건`,
        action: "import",
        delta: rows.length,
        actor: readActorName() || null,
        note: "CSV 가져오기",
      });
      return rows.length;
    },
    [addInventory, inventory, persist, pushActivity, refresh, usingLocal]
  );

  /** 발표 리허설용: 위치 유지, 비품·사용기록·요청을 예시로 교체 */
  const reseedDemoExamples = useCallback(async () => {
    const orgId = orgIdRef.current;
    const bundle = buildDemoBundle(spots);
    const demo = bundle.inventory.map((i) => ({ ...i, org_id: orgId }));
    const demoActivity = bundle.activity.map((a) => ({ ...a, org_id: orgId }));
    const demoRequests = bundle.requests.map((r) => ({ ...r, org_id: orgId }));
    if (demo.length === 0) {
      setError("예시 비품을 넣을 칸이 없습니다. 표준형 레이아웃을 먼저 적용하세요.");
      return;
    }
    if (orgId) markDemoSeeded(orgStorageKeys(orgId).demo);

    const applyLocalBundle = () => {
      setInventory(demo);
      persist(demo);
      setActivity(demoActivity);
      persistActivity(demoActivity);
      setRequests(demoRequests);
      persistRequests(demoRequests);
      setError(null);
    };

    const sb = getSupabase();
    if (!sb || usingLocal) {
      applyLocalBundle();
      return;
    }

    if (orgId) {
      await Promise.all([
        sb.from("inventory_items").delete().eq("org_id", orgId),
        sb.from("activity_log").delete().eq("org_id", orgId),
        sb.from("supply_requests").delete().eq("org_id", orgId),
      ]);
    }
    const invRows = demo.map(
      ({ id: _id, created_at: _c, updated_at: _u, ...rest }) => rest
    );
    const { error: invErr } = await sb.from("inventory_items").insert(invRows);
    if (invErr) {
      setError(invErr.message);
      return;
    }
    const actRows = demoActivity.map(
      ({ id: _id, created_at: _c, ...rest }) => rest
    );
    const reqRows = demoRequests.map(
      ({ id: _id, created_at: _c, ...rest }) => rest
    );
    await Promise.all([
      actRows.length
        ? sb.from("activity_log").insert(actRows)
        : Promise.resolve(),
      reqRows.length
        ? sb.from("supply_requests").insert(reqRows)
        : Promise.resolve(),
    ]);
    applyLocalBundle();
    await refresh();
  }, [
    persist,
    persistActivity,
    persistRequests,
    refresh,
    spots,
    usingLocal,
  ]);

  const createOrganization = useCallback(
    async (name: string) => {
      const created = createLocalOrg(name);
      const sb = getSupabase();
      if (sb && isSupabaseConfigured()) {
        const { error: e } = await sb.from("organizations").insert({
          id: created.id,
          name: created.name,
          join_code: created.join_code,
        });
        if (e) {
          // 원격 실패해도 로컬 회사는 유지
          setError(e.message);
        }
      }
      orgIdRef.current = created.id;
      setOrg(created);
      setReady(false);
      await refresh();
      return created;
    },
    [refresh]
  );

  const joinOrganization = useCallback(
    async (code: string) => {
      const normalized = code.trim().toUpperCase();
      if (!normalized) throw new Error("가입 코드를 입력하세요");

      const sb = getSupabase();
      if (sb && isSupabaseConfigured()) {
        const { data, error: e } = await sb
          .from("organizations")
          .select("*")
          .eq("join_code", normalized)
          .maybeSingle();
        if (e) throw new Error(e.message);
        if (data) {
          const remote = data as Organization;
          const list = readOrgs();
          if (!list.some((o) => o.id === remote.id)) {
            writeOrgs([...list, remote]);
          }
          writeCurrentOrg(remote);
          orgIdRef.current = remote.id;
          setOrg(remote);
          setReady(false);
          await refresh();
          return remote;
        }
      }

      const local = joinLocalOrg(normalized);
      if (!local) throw new Error("가입 코드를 찾을 수 없습니다");
      orgIdRef.current = local.id;
      setOrg(local);
      setReady(false);
      await refresh();
      return local;
    },
    [refresh]
  );

  return {
    ready,
    usingLocal,
    error,
    org,
    inventory,
    spots,
    activity,
    requests,
    highlightSpotId,
    setHighlightSpotId,
    layoutId,
    refresh,
    applyLayoutTemplate,
    resetMapToTemplate,
    addFurniture,
    updateSpot,
    removeSpot,
    addInventory,
    updateInventory,
    removeInventory,
    fillStock,
    adjustQuantity,
    requestSupply,
    resolveRequest,
    importInventoryCsvText,
    reseedDemoExamples,
    createOrganization,
    joinOrganization,
    notifyLowStockNow,
  };
}

export type OfficeStore = ReturnType<typeof useOfficeStore>;

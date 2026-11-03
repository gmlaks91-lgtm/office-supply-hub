import {
  getLayout,
  OFFICE_LAYOUTS,
  type OfficeLayoutTemplate,
} from "./floorPlan";
import type { StorageSpot } from "./types";

export function kindLabel(kind: string): string {
  const map: Record<string, string> = {
    room: "구역/방",
    entrance: "입구",
    desk: "책상",
    cabinet: "캐비닛",
    shelf: "선반",
    bin: "박스/통",
    printer: "복합기",
    meeting: "회의탁자",
    drawer: "서랍",
  };
  return map[kind] ?? kind;
}

export function spotPath(spot: StorageSpot, all: StorageSpot[]): string {
  const parts: string[] = [spot.area];
  if (spot.parent_id) {
    const parent = all.find((s) => s.id === spot.parent_id);
    if (parent) parts.push(parent.name);
  }
  parts.push(spot.name);
  return parts.join(" · ");
}

export function groupSpotsByParent(spots: StorageSpot[]): {
  roots: StorageSpot[];
  childrenOf: Record<string, StorageSpot[]>;
} {
  const childrenOf: Record<string, StorageSpot[]> = {};
  const roots: StorageSpot[] = [];
  const sorted = [...spots].sort(
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ko")
  );
  for (const s of sorted) {
    if (s.parent_id) (childrenOf[s.parent_id] ??= []).push(s);
    else roots.push(s);
  }
  return { roots, childrenOf };
}

/** 맵에 그릴 가구 (구역·입구 제외) */
export function mapFurniture(spots: StorageSpot[]): StorageSpot[] {
  return spots.filter(
    (s) =>
      !s.parent_id &&
      s.kind !== "room" &&
      s.kind !== "entrance" &&
      s.x != null &&
      s.y != null &&
      s.w != null &&
      s.h != null
  );
}

export function mapRooms(spots: StorageSpot[]): StorageSpot[] {
  return spots.filter(
    (s) =>
      s.kind === "room" &&
      s.x != null &&
      s.y != null &&
      s.w != null &&
      s.h != null
  );
}

export function mapEntrances(spots: StorageSpot[]): StorageSpot[] {
  return spots.filter(
    (s) =>
      s.kind === "entrance" &&
      s.x != null &&
      s.y != null &&
      s.w != null &&
      s.h != null
  );
}

export function selectableSpots(spots: StorageSpot[]): StorageSpot[] {
  const { roots, childrenOf } = groupSpotsByParent(spots);
  const result: StorageSpot[] = [];
  for (const root of roots) {
    if (root.kind === "room" || root.kind === "entrance") continue;
    const kids = childrenOf[root.id] ?? [];
    if (kids.length > 0) result.push(...kids);
    else result.push(root);
  }
  return result;
}

/** 비품을 넣을 수 있는 칸 (책상·캐비닛 등, 구역/입구 제외) */
export function storageRoots(spots: StorageSpot[]): StorageSpot[] {
  return spots
    .filter(
      (s) =>
        !s.parent_id && s.kind !== "room" && s.kind !== "entrance"
    )
    .sort(
      (a, b) =>
        a.area.localeCompare(b.area, "ko") ||
        a.sort_order - b.sort_order ||
        a.name.localeCompare(b.name, "ko")
    );
}

export function uniqueAreas(spots: StorageSpot[]): string[] {
  const set = new Set(
    storageRoots(spots).map((s) => s.area).filter(Boolean)
  );
  return [...set].sort((a, b) => a.localeCompare(b, "ko"));
}

export function cardTitle(spot: StorageSpot): string {
  return `${spot.area} · ${spot.name}`;
}

export function defaultDrawerNames(count = 3): string[] {
  return Array.from({ length: count }, (_, i) => `${i + 1}번 서랍`);
}

export function layoutToSpotSeeds(
  layout: OfficeLayoutTemplate
): Omit<StorageSpot, "id" | "created_at">[] {
  const seeds: Omit<StorageSpot, "id" | "created_at">[] = [];

  seeds.push({
    name: layout.entrance.name,
    area: "입구",
    kind: "entrance",
    parent_id: null,
    note: null,
    sort_order: 0,
    map_key: `entrance-${layout.id}`,
    x: layout.entrance.x,
    y: layout.entrance.y,
    w: layout.entrance.w,
    h: layout.entrance.h,
    color: "#0f766e",
    rotation: 0,
  });

  layout.rooms.forEach((r, i) => {
    seeds.push({
      name: r.label,
      area: r.label,
      kind: "room",
      parent_id: null,
      note: null,
      sort_order: i + 1,
      map_key: `room-${layout.id}-${r.id}`,
      x: r.x,
      y: r.y,
      w: r.w,
      h: r.h,
      color: r.floor,
      rotation: 0,
    });
  });

  layout.furniture.forEach((t, i) => {
    seeds.push({
      name: t.name,
      area: t.area,
      kind: t.kind,
      parent_id: null,
      note: null,
      sort_order: 100 + (i + 1) * 10,
      map_key: `${layout.id}-${t.mapKey}`,
      x: t.x,
      y: t.y,
      w: t.w,
      h: t.h,
      color: t.color,
      rotation: 0,
    });
  });

  return seeds;
}

export function roomSeeds() {
  return layoutToSpotSeeds(getLayout("standard")).filter((s) => s.kind === "room");
}

export function templateSpotSeeds() {
  return layoutToSpotSeeds(getLayout("standard")).filter(
    (s) => s.kind !== "room" && s.kind !== "entrance"
  );
}

export { OFFICE_LAYOUTS, getLayout };

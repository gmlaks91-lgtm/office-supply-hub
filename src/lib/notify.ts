import type { InventoryItem } from "./types";
import { stockLevel } from "./stock";

const LS_LAST = "office_lowstock_notify_v1";

type LastMap = Record<string, number>;

function readLast(): LastMap {
  try {
    const raw = localStorage.getItem(LS_LAST);
    return raw ? (JSON.parse(raw) as LastMap) : {};
  } catch {
    return {};
  }
}

function writeLast(map: LastMap) {
  localStorage.setItem(LS_LAST, JSON.stringify(map));
}

/** 같은 품목 6시간 내 재알림 방지 */
const COOLDOWN_MS = 6 * 60 * 60 * 1000;

export type NotifyPayloadItem = {
  id: string;
  name: string;
  quantity: number;
  min_stock: number;
  unit: string;
  location: string;
  category: string;
};

export function lowStockPayload(
  inventory: InventoryItem[],
  placeOf: (item: InventoryItem) => string
): NotifyPayloadItem[] {
  return inventory
    .filter((i) => stockLevel(i) !== "ok")
    .map((i) => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
      min_stock: i.min_stock,
      unit: i.unit,
      location: placeOf(i),
      category: i.category,
    }));
}

export async function sendLowStockNotify(input: {
  items: NotifyPayloadItem[];
  orgName?: string | null;
  force?: boolean;
}): Promise<{
  ok: boolean;
  configured: boolean;
  skipped?: boolean;
  message?: string;
  slack?: boolean;
  email?: boolean;
}> {
  let items = input.items;
  if (!input.force) {
    const last = readLast();
    const now = Date.now();
    items = items.filter((i) => {
      const t = last[i.id] ?? 0;
      return now - t >= COOLDOWN_MS;
    });
    if (items.length === 0) {
      return { ok: true, configured: true, skipped: true, message: "최근에 이미 알림을 보냈습니다" };
    }
  }

  if (items.length === 0) {
    return { ok: false, configured: false, message: "부족 품목이 없습니다" };
  }

  const res = await fetch("/api/notify/low-stock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items,
      orgName: input.orgName ?? null,
    }),
  });
  const json = (await res.json()) as {
    ok?: boolean;
    configured?: boolean;
    message?: string;
    slack?: boolean;
    email?: boolean;
  };

  if (json.ok && (json.slack || json.email)) {
    const last = readLast();
    const now = Date.now();
    for (const i of items) last[i.id] = now;
    writeLast(last);
  }

  return {
    ok: Boolean(json.ok),
    configured: Boolean(json.configured),
    message: json.message,
    slack: json.slack,
    email: json.email,
  };
}

import type { InventoryItem } from "./types";

export function isExpiredDoc(item: InventoryItem, today = new Date()): boolean {
  if (!item.expires_on) return false;
  const d = item.expires_on.slice(0, 10);
  const t = today.toISOString().slice(0, 10);
  return d < t;
}

export function isExpiringSoon(
  item: InventoryItem,
  withinDays = 30,
  today = new Date()
): boolean {
  if (!item.expires_on || isExpiredDoc(item, today)) return false;
  const end = new Date(item.expires_on.slice(0, 10) + "T00:00:00");
  const ms = end.getTime() - today.getTime();
  return ms >= 0 && ms <= withinDays * 24 * 60 * 60 * 1000;
}

export function expiryLabel(item: InventoryItem): string | null {
  if (!item.expires_on) return null;
  if (isExpiredDoc(item)) return `만료 ${item.expires_on}`;
  if (isExpiringSoon(item)) return `만료임박 ${item.expires_on}`;
  return `만료 ${item.expires_on}`;
}

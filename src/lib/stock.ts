import type { InventoryItem, StockLevel } from "./types";

export function stockLevel(item: InventoryItem): StockLevel {
  if (item.quantity <= 0) return "critical";
  if (item.quantity <= Math.max(1, Math.floor(item.min_stock * 0.5)))
    return "critical";
  if (item.quantity <= item.min_stock) return "warn";
  return "ok";
}

export function stockLabel(item: InventoryItem): string {
  const level = stockLevel(item);
  if (level === "critical") return `부족 · ${item.quantity}${item.unit}`;
  if (level === "warn") return `임박 · ${item.quantity}/${item.min_stock}${item.unit}`;
  return `충분 · ${item.quantity}${item.unit}`;
}

export function levelColor(level: StockLevel): string {
  if (level === "critical") return "bg-red-500";
  if (level === "warn") return "bg-orange-500";
  return "bg-emerald-500";
}

export function levelBorder(level: StockLevel): string {
  if (level === "critical") return "border-red-300 bg-red-50";
  if (level === "warn") return "border-orange-300 bg-orange-50";
  return "border-emerald-200 bg-emerald-50/40";
}

export function sortByUrgency(items: InventoryItem[]): InventoryItem[] {
  const rank = (i: InventoryItem) => {
    const l = stockLevel(i);
    if (l === "critical") return 0;
    if (l === "warn") return 1;
    return 2;
  };
  return [...items].sort((a, b) => {
    const d = rank(a) - rank(b);
    if (d !== 0) return d;
    return (
      a.quantity / Math.max(a.min_stock, 1) -
      b.quantity / Math.max(b.min_stock, 1)
    );
  });
}

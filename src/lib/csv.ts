import type { InventoryItem, StorageSpot } from "./types";
import { spotPath } from "./storage";

const HEADERS = [
  "name",
  "category",
  "quantity",
  "min_stock",
  "unit",
  "location",
  "notes",
  "counterparty",
  "expires_on",
] as const;

function escapeCell(v: string | number | null | undefined): string {
  const s = v == null ? "" : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function placeFor(item: InventoryItem, spots: StorageSpot[]): string {
  if (item.storage_spot_id) {
    const spot = spots.find((s) => s.id === item.storage_spot_id);
    if (spot) return spotPath(spot, spots);
  }
  return item.location;
}

/** Excel·구매팀 공유용 재고 CSV */
export function inventoryToCsv(
  inventory: InventoryItem[],
  spots: StorageSpot[]
): string {
  const lines = [HEADERS.join(",")];
  for (const item of inventory) {
    lines.push(
      [
        escapeCell(item.name),
        escapeCell(item.category),
        escapeCell(item.quantity),
        escapeCell(item.min_stock),
        escapeCell(item.unit),
        escapeCell(placeFor(item, spots)),
        escapeCell(item.notes),
        escapeCell(item.counterparty),
        escapeCell(item.expires_on),
      ].join(",")
    );
  }
  return lines.join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export type CsvInventoryRow = {
  name: string;
  category: string;
  quantity: number;
  min_stock: number;
  unit: string;
  location: string;
  notes: string | null;
  counterparty: string | null;
  expires_on: string | null;
};

function parseLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQ = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQ = true;
    } else if (ch === ",") {
      out.push(cur);
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

/** CSV → 행 배열 (헤더 자동 매핑, 한글 헤더도 허용) */
export function parseInventoryCsv(text: string): CsvInventoryRow[] {
  const raw = text.replace(/^\uFEFF/, "").trim();
  if (!raw) return [];
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headerCells = parseLine(lines[0]).map((h) => h.trim().toLowerCase());
  type Col = (typeof HEADERS)[number];
  const alias: Record<string, Col> = {
    name: "name",
    이름: "name",
    품명: "name",
    category: "category",
    분류: "category",
    카테고리: "category",
    quantity: "quantity",
    수량: "quantity",
    재고: "quantity",
    min_stock: "min_stock",
    최소재고: "min_stock",
    최소: "min_stock",
    unit: "unit",
    단위: "unit",
    location: "location",
    위치: "location",
    notes: "notes",
    메모: "notes",
    비고: "notes",
    counterparty: "counterparty",
    거래처: "counterparty",
    업체: "counterparty",
    expires_on: "expires_on",
    만료일: "expires_on",
    만료: "expires_on",
  };

  const idx: Partial<Record<Col, number>> = {};
  headerCells.forEach((h, i) => {
    const key = alias[h];
    if (key) idx[key] = i;
  });
  if (idx.name == null) throw new Error("CSV에 name(이름) 열이 필요합니다.");

  const rows: CsvInventoryRow[] = [];
  for (let li = 1; li < lines.length; li++) {
    const cells = parseLine(lines[li]);
    const name = (cells[idx.name!] ?? "").trim();
    if (!name) continue;
    const num = (i: number | undefined, fallback: number) => {
      if (i == null) return fallback;
      const n = Number(String(cells[i] ?? "").replace(/,/g, "").trim());
      return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback;
    };
    rows.push({
      name,
      category: (idx.category != null ? cells[idx.category] : "")?.trim() || "기타",
      quantity: num(idx.quantity, 0),
      min_stock: num(idx.min_stock, 5),
      unit: (idx.unit != null ? cells[idx.unit] : "")?.trim() || "개",
      location: (idx.location != null ? cells[idx.location] : "")?.trim() || "사무실",
      notes: (idx.notes != null ? cells[idx.notes] : "")?.trim() || null,
      counterparty:
        (idx.counterparty != null ? cells[idx.counterparty] : "")?.trim() || null,
      expires_on:
        (idx.expires_on != null ? cells[idx.expires_on] : "")?.trim() || null,
    });
  }
  return rows;
}

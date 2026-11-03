/** 회사(워크스페이스) — 가입 코드로 입장 */
export type Organization = {
  id: string;
  name: string;
  join_code: string;
  created_at: string;
};

export type StorageSpot = {
  id: string;
  name: string;
  area: string;
  kind: string;
  parent_id: string | null;
  note: string | null;
  sort_order: number;
  map_key: string | null;
  /** 맵 좌표 (%). 서랍(자식)은 null */
  x: number | null;
  y: number | null;
  w: number | null;
  h: number | null;
  color: string | null;
  /** 입구 등 방향 (0·90·180·270) */
  rotation: number | null;
  org_id?: string | null;
  created_at: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  min_stock: number;
  unit: string;
  location: string;
  storage_spot_id: string | null;
  notes: string | null;
  org_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type StockLevel = "critical" | "warn" | "ok";

export type TabId = "location" | "inventory" | "settings";

/** 사용·보충 등 가벼운 감사 로그 */
export type ActivityEntry = {
  id: string;
  item_id: string | null;
  item_name: string;
  action: "use" | "add" | "fill" | "request" | "fulfill" | "cancel" | "import";
  delta: number;
  actor: string | null;
  note: string | null;
  org_id?: string | null;
  created_at: string;
};

export type SupplyRequestStatus = "pending" | "done" | "cancelled";

/** 직원 → 담당자 비품 요청 */
export type SupplyRequest = {
  id: string;
  item_id: string | null;
  item_name: string;
  quantity: number;
  requester: string;
  status: SupplyRequestStatus;
  note: string | null;
  org_id?: string | null;
  created_at: string;
  resolved_at: string | null;
};

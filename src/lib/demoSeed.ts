import type {
  ActivityEntry,
  InventoryItem,
  StorageSpot,
  SupplyRequest,
} from "./types";

/**
 * 칸별 비품 예시 (map_key 접미사 기준)
 * spots.map_key 예: standard-cab-left, standard-desk-a
 */

export type DemoItemSpec = {
  name: string;
  quantity: number;
  min_stock: number;
  unit: string;
  category: string;
  /** 있으면 해당 이름 서랍에 넣음 (없으면 칸 자체) */
  drawer?: string;
  counterparty?: string;
  expires_on?: string;
};

export const DEMO_SEEDED_FLAG = "office_demo_seeded_v1";

/** mapKey → 예시 비품 (이름 중복 없음, 표준형 맵에 골고루 배치) */
export const DEMO_BY_MAP_KEY: Record<string, DemoItemSpec[]> = {
  "desk-a": [
    {
      name: "볼펜(검정)",
      quantity: 23,
      min_stock: 20,
      unit: "자루",
      category: "문구",
    },
  ],
  "desk-b": [
    {
      name: "볼펜(파랑)",
      quantity: 15,
      min_stock: 10,
      unit: "자루",
      category: "문구",
    },
  ],
  "desk-c": [
    { name: "가위", quantity: 3, min_stock: 2, unit: "개", category: "문구" },
  ],
  "cab-left": [
    {
      name: "형광펜",
      quantity: 6,
      min_stock: 10,
      unit: "자루",
      category: "문구",
      drawer: "1번 서랍",
    },
    {
      name: "포스트잇",
      quantity: 8,
      min_stock: 5,
      unit: "팩",
      category: "문구",
      drawer: "1번 서랍",
    },
    {
      name: "클립",
      quantity: 4,
      min_stock: 3,
      unit: "통",
      category: "문구",
      drawer: "2번 서랍",
    },
    {
      name: "스테이플러 심",
      quantity: 1,
      min_stock: 5,
      unit: "통",
      category: "문구",
      drawer: "2번 서랍",
    },
    {
      name: "물티슈",
      quantity: 4,
      min_stock: 3,
      unit: "팩",
      category: "소모품",
      drawer: "3번 서랍",
    },
  ],
  "cab-right": [
    {
      name: "수임 계약서 양식",
      quantity: 12,
      min_stock: 10,
      unit: "부",
      category: "서류",
      drawer: "1번 서랍",
    },
    {
      name: "위임장 양식",
      quantity: 4,
      min_stock: 10,
      unit: "부",
      category: "서류",
      drawer: "1번 서랍",
    },
    {
      name: "견적서 양식",
      quantity: 20,
      min_stock: 10,
      unit: "부",
      category: "서류",
      drawer: "2번 서랍",
    },
    {
      name: "지출결의서 양식",
      quantity: 15,
      min_stock: 10,
      unit: "부",
      category: "서류",
      drawer: "2번 서랍",
    },
    {
      name: "클리어파일",
      quantity: 40,
      min_stock: 20,
      unit: "장",
      category: "서류",
      drawer: "3번 서랍",
    },
  ],
  "client-cab": [
    {
      name: "거래처 장부 바인더",
      quantity: 6,
      min_stock: 5,
      unit: "개",
      category: "서류",
      drawer: "가~사 거래처",
    },
  ],
  "meeting-table": [
    {
      name: "종이컵",
      quantity: 1,
      min_stock: 2,
      unit: "줄",
      category: "소모품",
    },
  ],
  "meeting-shelf": [
    {
      name: "HDMI 케이블",
      quantity: 3,
      min_stock: 2,
      unit: "개",
      category: "장비",
    },
  ],
  printer: [
    { name: "인주", quantity: 3, min_stock: 2, unit: "개", category: "인쇄" },
  ],
  "toner-bin": [
    {
      name: "토너(흑백)",
      quantity: 0,
      min_stock: 2,
      unit: "개",
      category: "인쇄",
    },
    {
      name: "토너(컬러)",
      quantity: 2,
      min_stock: 1,
      unit: "개",
      category: "인쇄",
    },
    {
      name: "A4 복사용지",
      quantity: 2,
      min_stock: 5,
      unit: "박스",
      category: "인쇄",
    },
    {
      name: "봉투(대)",
      quantity: 30,
      min_stock: 50,
      unit: "장",
      category: "인쇄",
    },
  ],
  "steel-a": [
    {
      name: "AA 건전지",
      quantity: 2,
      min_stock: 2,
      unit: "팩",
      category: "전자",
      drawer: "1번 서랍",
    },
    {
      name: "USB 메모리",
      quantity: 5,
      min_stock: 3,
      unit: "개",
      category: "전자",
      drawer: "2번 서랍",
    },
  ],
  "steel-b": [],
  "box-corner": [],
  // 다른 레이아웃 — 동일 품목을 한 번씩만 배치
  d1: [
    {
      name: "볼펜(검정)",
      quantity: 23,
      min_stock: 20,
      unit: "자루",
      category: "문구",
    },
  ],
  d2: [
    {
      name: "볼펜(파랑)",
      quantity: 15,
      min_stock: 10,
      unit: "자루",
      category: "문구",
    },
  ],
  d3: [{ name: "가위", quantity: 3, min_stock: 2, unit: "개", category: "문구" }],
  d4: [
    {
      name: "형광펜",
      quantity: 6,
      min_stock: 10,
      unit: "자루",
      category: "문구",
    },
  ],
  d5: [
    {
      name: "포스트잇",
      quantity: 8,
      min_stock: 5,
      unit: "팩",
      category: "문구",
    },
  ],
  d6: [{ name: "클립", quantity: 4, min_stock: 3, unit: "통", category: "문구" }],
  cab: [
    {
      name: "스테이플러 심",
      quantity: 1,
      min_stock: 5,
      unit: "통",
      category: "문구",
      drawer: "1번 서랍",
    },
    {
      name: "수임 계약서 양식",
      quantity: 12,
      min_stock: 10,
      unit: "부",
      category: "서류",
      drawer: "2번 서랍",
    },
    {
      name: "위임장 양식",
      quantity: 4,
      min_stock: 10,
      unit: "부",
      category: "서류",
      drawer: "3번 서랍",
    },
  ],
  print: [
    {
      name: "A4 복사용지",
      quantity: 2,
      min_stock: 5,
      unit: "박스",
      category: "인쇄",
    },
    { name: "인주", quantity: 3, min_stock: 2, unit: "개", category: "인쇄" },
  ],
  st1: [
    {
      name: "토너(흑백)",
      quantity: 0,
      min_stock: 2,
      unit: "개",
      category: "인쇄",
      drawer: "1번 서랍",
    },
    {
      name: "토너(컬러)",
      quantity: 2,
      min_stock: 1,
      unit: "개",
      category: "인쇄",
      drawer: "1번 서랍",
    },
    {
      name: "봉투(대)",
      quantity: 30,
      min_stock: 50,
      unit: "장",
      category: "인쇄",
      drawer: "2번 서랍",
    },
    {
      name: "견적서 양식",
      quantity: 20,
      min_stock: 10,
      unit: "부",
      category: "서류",
      drawer: "3번 서랍",
    },
    {
      name: "지출결의서 양식",
      quantity: 15,
      min_stock: 10,
      unit: "부",
      category: "서류",
      drawer: "3번 서랍",
    },
    {
      name: "거래처 장부 바인더",
      quantity: 6,
      min_stock: 5,
      unit: "개",
      category: "서류",
      drawer: "4번 서랍",
    },
  ],
  box: [
    {
      name: "클리어파일",
      quantity: 40,
      min_stock: 20,
      unit: "장",
      category: "서류",
    },
    {
      name: "USB 메모리",
      quantity: 5,
      min_stock: 3,
      unit: "개",
      category: "전자",
    },
    {
      name: "AA 건전지",
      quantity: 2,
      min_stock: 2,
      unit: "팩",
      category: "전자",
    },
    {
      name: "HDMI 케이블",
      quantity: 3,
      min_stock: 2,
      unit: "개",
      category: "장비",
    },
    {
      name: "물티슈",
      quantity: 4,
      min_stock: 3,
      unit: "팩",
      category: "소모품",
    },
    {
      name: "종이컵",
      quantity: 1,
      min_stock: 2,
      unit: "줄",
      category: "소모품",
    },
  ],
};

export function mapKeySuffix(mapKey: string | null): string | null {
  if (!mapKey) return null;
  if (mapKey.startsWith("entrance-") || mapKey.startsWith("room-")) return null;
  const parts = mapKey.split("-");
  if (parts.length < 2) return mapKey;
  const withoutLayout = parts.slice(1).join("-");
  return withoutLayout || null;
}

/** spots 기준으로 예시 재고 행 생성 */
export function buildDemoInventory(spots: StorageSpot[]): InventoryItem[] {
  const now = new Date().toISOString();
  const items: InventoryItem[] = [];
  const usedNames = new Set<string>();

  for (const parent of spots) {
    if (parent.parent_id || parent.kind === "room" || parent.kind === "entrance")
      continue;
    const suffix = mapKeySuffix(parent.map_key);
    if (!suffix) continue;
    const specs = DEMO_BY_MAP_KEY[suffix];
    if (!specs?.length) continue;

    const drawers = spots.filter((s) => s.parent_id === parent.id);

    for (const spec of specs) {
      if (usedNames.has(spec.name)) continue;
      usedNames.add(spec.name);

      let spotId = parent.id;
      let location = `${parent.area} · ${parent.name}`;
      if (spec.drawer) {
        const d = drawers.find((x) => x.name === spec.drawer);
        if (d) {
          spotId = d.id;
          location = `${parent.area} · ${parent.name} · ${d.name}`;
        }
      }
      items.push({
        id: crypto.randomUUID(),
        name: spec.name,
        category: spec.category,
        quantity: spec.quantity,
        min_stock: spec.min_stock,
        unit: spec.unit,
        location,
        storage_spot_id: spotId,
        notes: "예시 데이터",
        counterparty: spec.counterparty ?? null,
        expires_on: spec.expires_on ?? null,
        created_at: now,
        updated_at: now,
      });
    }
  }

  return items;
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function findItem(
  inventory: InventoryItem[],
  name: string
): InventoryItem | undefined {
  return inventory.find((i) => i.name === name);
}

/** 최근 3일 안 · 최신순 사용 기록 */
export function buildDemoActivity(inventory: InventoryItem[]): ActivityEntry[] {
  const specs: {
    name: string;
    action: ActivityEntry["action"];
    delta: number;
    actor: string;
    note: string | null;
    hoursAgo: number;
  }[] = [
    {
      name: "토너(흑백)",
      action: "use",
      delta: -1,
      actor: "이지은",
      note: "부가세 신고서 출력",
      hoursAgo: 3,
    },
    {
      name: "A4 복사용지",
      action: "use",
      delta: -1,
      actor: "박준호",
      note: "결산 보고서 인쇄",
      hoursAgo: 8,
    },
    {
      name: "볼펜(검정)",
      action: "use",
      delta: -2,
      actor: "최수아",
      note: null,
      hoursAgo: 18,
    },
    {
      name: "위임장 양식",
      action: "use",
      delta: -3,
      actor: "정민재",
      note: "신규 거래처 3곳",
      hoursAgo: 28,
    },
    {
      name: "봉투(대)",
      action: "use",
      delta: -20,
      actor: "이지은",
      note: "서류 반송",
      hoursAgo: 40,
    },
    {
      name: "포스트잇",
      action: "fill",
      delta: 5,
      actor: "김도윤",
      note: "채우기",
      hoursAgo: 52,
    },
    {
      name: "클리어파일",
      action: "use",
      delta: -5,
      actor: "한서연",
      note: null,
      hoursAgo: 65,
    },
  ];

  return specs.map((s) => {
    const item = findItem(inventory, s.name);
    return {
      id: crypto.randomUUID(),
      item_id: item?.id ?? null,
      item_name: s.name,
      action: s.action,
      delta: s.delta,
      actor: s.actor,
      note: s.note,
      created_at: hoursAgo(s.hoursAgo),
    };
  });
}

/** 대기 중 요청 */
export function buildDemoRequests(inventory: InventoryItem[]): SupplyRequest[] {
  const specs: {
    name: string;
    quantity: number;
    requester: string;
    note: string | null;
    hoursAgo: number;
  }[] = [
    {
      name: "토너(흑백)",
      quantity: 2,
      requester: "이지은",
      note: "오늘 중 필요",
      hoursAgo: 2,
    },
    {
      name: "위임장 양식",
      quantity: 10,
      requester: "정민재",
      note: null,
      hoursAgo: 6,
    },
    {
      name: "종이컵",
      quantity: 2,
      requester: "한서연",
      note: null,
      hoursAgo: 14,
    },
  ];

  return specs.map((s) => {
    const item = findItem(inventory, s.name);
    return {
      id: crypto.randomUUID(),
      item_id: item?.id ?? null,
      item_name: s.name,
      quantity: s.quantity,
      requester: s.requester,
      status: "pending" as const,
      note: s.note,
      created_at: hoursAgo(s.hoursAgo),
      resolved_at: null,
    };
  });
}

export type DemoBundle = {
  inventory: InventoryItem[];
  activity: ActivityEntry[];
  requests: SupplyRequest[];
};

export function buildDemoBundle(spots: StorageSpot[]): DemoBundle {
  const inventory = buildDemoInventory(spots);
  return {
    inventory,
    activity: buildDemoActivity(inventory),
    requests: buildDemoRequests(inventory),
  };
}

export function isDemoSeeded(flagKey = DEMO_SEEDED_FLAG): boolean {
  try {
    return localStorage.getItem(flagKey) === "1";
  } catch {
    return false;
  }
}

export function markDemoSeeded(flagKey = DEMO_SEEDED_FLAG) {
  try {
    localStorage.setItem(flagKey, "1");
  } catch {
    /* ignore */
  }
}

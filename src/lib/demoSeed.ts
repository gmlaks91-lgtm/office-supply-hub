import type { InventoryItem, StorageSpot } from "./types";

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

/** org별 플래그 키를 넘기면 회사마다 시드 여부를 따로 관리 */

/** mapKey → 예시 비품 */
export const DEMO_BY_MAP_KEY: Record<string, DemoItemSpec[]> = {
  "desk-a": [
    { name: "개인 볼펜", quantity: 3, min_stock: 1, unit: "자루", category: "문구" },
    { name: "메모 패드", quantity: 2, min_stock: 1, unit: "권", category: "문구" },
  ],
  "desk-b": [
    { name: "형광펜 세트", quantity: 1, min_stock: 1, unit: "세트", category: "문구" },
    { name: "USB 메모리", quantity: 1, min_stock: 1, unit: "개", category: "전자" },
  ],
  "desk-c": [
    { name: "노트북 충전기", quantity: 1, min_stock: 1, unit: "개", category: "전자" },
    { name: "유선 마우스", quantity: 1, min_stock: 1, unit: "개", category: "전자" },
  ],
  "cab-left": [
    { name: "볼펜", quantity: 40, min_stock: 20, unit: "자루", category: "문구", drawer: "1번 서랍" },
    { name: "형광펜", quantity: 12, min_stock: 10, unit: "자루", category: "문구", drawer: "1번 서랍" },
    { name: "포스트잇", quantity: 8, min_stock: 5, unit: "팩", category: "문구", drawer: "2번 서랍" },
    { name: "클립", quantity: 6, min_stock: 3, unit: "통", category: "문구", drawer: "2번 서랍" },
    { name: "스테이플러", quantity: 3, min_stock: 3, unit: "개", category: "문구", drawer: "3번 서랍" },
    { name: "스탬플러 심", quantity: 4, min_stock: 5, unit: "통", category: "문구", drawer: "3번 서랍" },
  ],
  "cab-right": [
    {
      name: "수임 계약서 양식",
      quantity: 15,
      min_stock: 10,
      unit: "부",
      category: "서류",
      drawer: "1번 서랍",
    },
    {
      name: "위임장 양식",
      quantity: 18,
      min_stock: 10,
      unit: "부",
      category: "서류",
      drawer: "1번 서랍",
    },
    {
      name: "견적서 양식",
      quantity: 12,
      min_stock: 10,
      unit: "부",
      category: "서류",
      drawer: "2번 서랍",
    },
    {
      name: "지출결의서 양식",
      quantity: 14,
      min_stock: 10,
      unit: "부",
      category: "서류",
      drawer: "2번 서랍",
    },
    {
      name: "클리어파일",
      quantity: 16,
      min_stock: 10,
      unit: "개",
      category: "서류",
      drawer: "3번 서랍",
    },
    {
      name: "서류 반송 봉투",
      quantity: 20,
      min_stock: 15,
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
    {
      name: "서류 반송 봉투",
      quantity: 18,
      min_stock: 15,
      unit: "장",
      category: "서류",
      drawer: "가~사 거래처",
    },
    {
      name: "거래처 장부 바인더",
      quantity: 5,
      min_stock: 5,
      unit: "개",
      category: "서류",
      drawer: "아~하 거래처",
    },
    {
      name: "클리어파일",
      quantity: 8,
      min_stock: 10,
      unit: "개",
      category: "서류",
      drawer: "아~하 거래처",
    },
  ],
  "meeting-table": [
    { name: "회의용 볼펜", quantity: 10, min_stock: 8, unit: "자루", category: "문구" },
    { name: "회의 노트", quantity: 5, min_stock: 3, unit: "권", category: "문구" },
  ],
  "meeting-shelf": [
    { name: "화이트보드 마카", quantity: 6, min_stock: 6, unit: "자루", category: "문구" },
    { name: "화이트보드 지우개", quantity: 2, min_stock: 1, unit: "개", category: "문구" },
    { name: "HDMI 케이블", quantity: 2, min_stock: 2, unit: "개", category: "장비" },
  ],
  printer: [
    { name: "용지걸이 클립", quantity: 2, min_stock: 1, unit: "개", category: "인쇄" },
  ],
  "toner-bin": [
    { name: "토너 (흑백)", quantity: 0, min_stock: 2, unit: "개", category: "인쇄" },
    { name: "토너 (컬러)", quantity: 2, min_stock: 1, unit: "개", category: "인쇄" },
    { name: "A4 복사용지", quantity: 1, min_stock: 3, unit: "팩", category: "인쇄" },
    { name: "봉투(대)", quantity: 25, min_stock: 20, unit: "장", category: "인쇄" },
    { name: "인주", quantity: 3, min_stock: 2, unit: "개", category: "인쇄" },
  ],
  "steel-a": [
    { name: "AA 건전지", quantity: 4, min_stock: 2, unit: "팩", category: "전자", drawer: "1번 서랍" },
    { name: "AAA 건전지", quantity: 3, min_stock: 2, unit: "팩", category: "전자", drawer: "1번 서랍" },
    { name: "USB 메모리", quantity: 5, min_stock: 3, unit: "개", category: "전자", drawer: "2번 서랍" },
    { name: "무선 마우스", quantity: 2, min_stock: 2, unit: "개", category: "전자", drawer: "2번 서랍" },
    { name: "키보드", quantity: 2, min_stock: 1, unit: "개", category: "전자", drawer: "3번 서랍" },
    { name: "헤드셋", quantity: 2, min_stock: 2, unit: "개", category: "전자", drawer: "3번 서랍" },
    { name: "웹캠", quantity: 1, min_stock: 1, unit: "개", category: "전자", drawer: "4번 서랍" },
  ],
  "steel-b": [
    { name: "HDMI 케이블", quantity: 4, min_stock: 2, unit: "개", category: "장비", drawer: "1번 서랍" },
    { name: "연장 코드", quantity: 3, min_stock: 2, unit: "개", category: "장비", drawer: "1번 서랍" },
    { name: "가위", quantity: 4, min_stock: 3, unit: "개", category: "문구", drawer: "2번 서랍" },
    { name: "커터칼", quantity: 2, min_stock: 2, unit: "개", category: "문구", drawer: "2번 서랍" },
    { name: "청소용 티슈", quantity: 3, min_stock: 2, unit: "박스", category: "소모품", drawer: "3번 서랍" },
    { name: "손 소독제", quantity: 2, min_stock: 2, unit: "개", category: "소모품", drawer: "3번 서랍" },
    { name: "명함 (공용)", quantity: 1, min_stock: 1, unit: "박스", category: "인쇄", drawer: "4번 서랍" },
  ],
  "box-corner": [
    { name: "택배 박스 (소)", quantity: 8, min_stock: 5, unit: "개", category: "소모품" },
    { name: "완충재", quantity: 3, min_stock: 2, unit: "롤", category: "소모품" },
    { name: "포장 테이프", quantity: 4, min_stock: 3, unit: "개", category: "문구" },
  ],
  // 다른 레이아웃 공통 키
  cab: [
    { name: "볼펜", quantity: 25, min_stock: 15, unit: "자루", category: "문구", drawer: "1번 서랍" },
    { name: "포스트잇", quantity: 6, min_stock: 5, unit: "팩", category: "문구", drawer: "2번 서랍" },
    { name: "스테이플러", quantity: 2, min_stock: 2, unit: "개", category: "문구", drawer: "3번 서랍" },
  ],
  print: [
    { name: "A4 복사용지", quantity: 4, min_stock: 3, unit: "팩", category: "인쇄" },
  ],
  st1: [
    { name: "토너 (흑백)", quantity: 2, min_stock: 1, unit: "개", category: "인쇄", drawer: "1번 서랍" },
    { name: "USB 메모리", quantity: 3, min_stock: 2, unit: "개", category: "전자", drawer: "2번 서랍" },
  ],
  box: [
    { name: "여분 A4 용지", quantity: 6, min_stock: 3, unit: "팩", category: "인쇄" },
  ],
  ca: [
    { name: "볼펜", quantity: 20, min_stock: 10, unit: "자루", category: "문구", drawer: "1번 서랍" },
    { name: "포스트잇", quantity: 5, min_stock: 3, unit: "팩", category: "문구", drawer: "2번 서랍" },
  ],
  st: [
    { name: "HDMI 케이블", quantity: 3, min_stock: 2, unit: "개", category: "장비", drawer: "1번 서랍" },
    { name: "AA 건전지", quantity: 2, min_stock: 2, unit: "팩", category: "전자", drawer: "2번 서랍" },
  ],
  steel: [
    { name: "토너 (흑백)", quantity: 2, min_stock: 1, unit: "개", category: "인쇄", drawer: "1번 서랍" },
    { name: "USB 메모리", quantity: 4, min_stock: 2, unit: "개", category: "전자", drawer: "2번 서랍" },
  ],
  shelf: [
    { name: "화이트보드 마카", quantity: 4, min_stock: 4, unit: "자루", category: "문구" },
    { name: "클리너", quantity: 2, min_stock: 1, unit: "개", category: "소모품" },
  ],
  s1: [
    { name: "HDMI 케이블", quantity: 5, min_stock: 2, unit: "개", category: "장비", drawer: "1번 서랍" },
    { name: "연장 코드", quantity: 3, min_stock: 2, unit: "개", category: "장비", drawer: "2번 서랍" },
  ],
  s2: [
    { name: "AA 건전지", quantity: 4, min_stock: 2, unit: "팩", category: "전자", drawer: "1번 서랍" },
    { name: "USB 메모리", quantity: 6, min_stock: 3, unit: "개", category: "전자", drawer: "2번 서랍" },
  ],
  s3: [
    { name: "A4 복사용지", quantity: 8, min_stock: 4, unit: "팩", category: "인쇄", drawer: "1번 서랍" },
    { name: "토너 (흑백)", quantity: 3, min_stock: 1, unit: "개", category: "인쇄", drawer: "2번 서랍" },
  ],
  s4: [
    { name: "택배 박스 (소)", quantity: 10, min_stock: 5, unit: "개", category: "소모품", drawer: "1번 서랍" },
    { name: "포장 테이프", quantity: 5, min_stock: 3, unit: "개", category: "문구", drawer: "2번 서랍" },
  ],
  "dock-bin": [
    { name: "입고 라벨", quantity: 2, min_stock: 1, unit: "롤", category: "소모품" },
    { name: "완충재", quantity: 2, min_stock: 2, unit: "롤", category: "소모품" },
  ],
  meet: [
    { name: "회의용 볼펜", quantity: 8, min_stock: 5, unit: "자루", category: "문구" },
  ],
  pr: [
    { name: "A4 복사용지", quantity: 3, min_stock: 2, unit: "팩", category: "인쇄" },
  ],
};

export function mapKeySuffix(mapKey: string | null): string | null {
  if (!mapKey) return null;
  // standard-cab-left → cab-left ; entrance-standard → skip
  if (mapKey.startsWith("entrance-") || mapKey.startsWith("room-")) return null;
  const parts = mapKey.split("-");
  if (parts.length < 2) return mapKey;
  // layoutId-mapKey where mapKey may contain dashes (desk-a)
  const withoutLayout = parts.slice(1).join("-");
  return withoutLayout || null;
}

/** spots 기준으로 예시 재고 행 생성 */
export function buildDemoInventory(spots: StorageSpot[]): InventoryItem[] {
  const now = new Date().toISOString();
  const items: InventoryItem[] = [];

  for (const parent of spots) {
    if (parent.parent_id || parent.kind === "room" || parent.kind === "entrance") continue;
    const suffix = mapKeySuffix(parent.map_key);
    if (!suffix) continue;
    const specs = DEMO_BY_MAP_KEY[suffix];
    if (!specs?.length) continue;

    const drawers = spots.filter((s) => s.parent_id === parent.id);

    for (const spec of specs) {
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

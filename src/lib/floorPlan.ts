/** 인테리어 가구 팔레트 + 사무실 기본 틀 예시 */

export type FurnitureKind =
  | "room"
  | "entrance"
  | "desk"
  | "cabinet"
  | "shelf"
  | "bin"
  | "printer"
  | "meeting";

export type FurnitureDef = {
  kind: FurnitureKind;
  label: string;
  defaultW: number;
  defaultH: number;
  color: string;
  drawers?: number;
};

export const FURNITURE_PALETTE: FurnitureDef[] = [
  { kind: "room", label: "구역/방", defaultW: 30, defaultH: 24, color: "#d4e8dc" },
  { kind: "entrance", label: "입구", defaultW: 16, defaultH: 8, color: "#0f766e" },
  { kind: "desk", label: "책상", defaultW: 14, defaultH: 12, color: "#b8956c" },
  {
    kind: "cabinet",
    label: "캐비닛",
    defaultW: 18,
    defaultH: 12,
    color: "#5b7c99",
    drawers: 3,
  },
  { kind: "shelf", label: "선반", defaultW: 10, defaultH: 18, color: "#6b8f71" },
  { kind: "bin", label: "박스/통", defaultW: 12, defaultH: 12, color: "#c4a35a" },
  { kind: "printer", label: "복합기", defaultW: 12, defaultH: 12, color: "#6a6a6a" },
  {
    kind: "meeting",
    label: "회의탁자",
    defaultW: 20,
    defaultH: 12,
    color: "#8b7355",
  },
];

export type FloorRoom = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  floor: string;
};

export type TemplateFurniture = {
  mapKey: string;
  name: string;
  area: string;
  kind: FurnitureKind;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  drawers?: number;
  /** 있으면 기본 「N번 서랍」 대신 이 이름 사용 */
  drawerNames?: string[];
};

export type OfficeLayoutTemplate = {
  id: string;
  name: string;
  description: string;
  rooms: FloorRoom[];
  entrance: { name: string; x: number; y: number; w: number; h: number };
  furniture: TemplateFurniture[];
};

/** 고를 수 있는 사무실 기본 틀 */
export const OFFICE_LAYOUTS: OfficeLayoutTemplate[] = [
  {
    id: "standard",
    name: "표준형",
    description:
      "입구→왼쪽 테이블·탕비실 · 직진 사무실 · 오른쪽 팀/회의 · 위쪽 가로 창고",
    /**
     * 입구(아래)에서 보면:
     * - 바로 왼쪽: 테이블
     * - 더 왼쪽: 작은 탕비실
     * - 직진: 직사각형 사무실
     * - 오른쪽: 위=회의실(세로 좁음), 아래=팀 공간(세로 넓음)
     * - 위: 가로로 긴 창고
     */
    rooms: [
      {
        id: "storage",
        label: "창고",
        x: 2,
        y: 2,
        w: 96,
        h: 18,
        floor: "#e8e0d4",
      },
      {
        id: "pantry",
        label: "탕비실",
        x: 2,
        y: 22,
        w: 18,
        h: 42,
        floor: "#f5e6d4",
      },
      {
        id: "office",
        label: "사무실",
        x: 22,
        y: 22,
        w: 40,
        h: 54,
        floor: "#d4e8dc",
      },
      {
        id: "meeting",
        label: "회의실",
        x: 64,
        y: 22,
        w: 34,
        h: 22,
        floor: "#dde4f5",
      },
      {
        id: "team",
        label: "팀 공간",
        x: 64,
        y: 46,
        w: 34,
        h: 36,
        floor: "#dceee4",
      },
    ],
    entrance: { name: "입구", x: 34, y: 88, w: 18, h: 10 },
    furniture: [
      // 입구 바로 왼쪽 테이블
      {
        mapKey: "meeting-table",
        name: "입구 옆 테이블",
        area: "사무실",
        kind: "meeting",
        x: 10,
        y: 80,
        w: 20,
        h: 10,
        color: "#8b7355",
      },
      // 사무실 (직진)
      {
        mapKey: "cab-left",
        name: "사무실 문구 캐비닛",
        area: "사무실",
        kind: "cabinet",
        x: 26,
        y: 30,
        w: 16,
        h: 12,
        color: "#5b7c99",
        drawers: 3,
      },
      {
        mapKey: "cab-right",
        name: "사무실 서류 캐비닛",
        area: "사무실",
        kind: "cabinet",
        x: 44,
        y: 30,
        w: 16,
        h: 12,
        color: "#5b7c99",
        drawers: 3,
      },
      {
        mapKey: "printer",
        name: "공용 복합기",
        area: "사무실",
        kind: "printer",
        x: 28,
        y: 52,
        w: 12,
        h: 12,
        color: "#6a6a6a",
      },
      {
        mapKey: "toner-bin",
        name: "토너·용지 수납함",
        area: "사무실",
        kind: "bin",
        x: 44,
        y: 52,
        w: 12,
        h: 12,
        color: "#c45c26",
      },
      // 회의실 (오른쪽 위 · 세로로 더 좁음)
      {
        mapKey: "meeting-shelf",
        name: "회의실 비품 선반",
        area: "회의실",
        kind: "shelf",
        x: 88,
        y: 26,
        w: 8,
        h: 14,
        color: "#6b8f71",
      },
      // 팀 공간 (오른쪽 아래 · 세로로 더 넓음)
      {
        mapKey: "desk-a",
        name: "팀 책상 1",
        area: "팀 공간",
        kind: "desk",
        x: 68,
        y: 50,
        w: 12,
        h: 11,
        color: "#b8956c",
      },
      {
        mapKey: "desk-b",
        name: "팀 책상 2",
        area: "팀 공간",
        kind: "desk",
        x: 82,
        y: 50,
        w: 12,
        h: 11,
        color: "#b8956c",
      },
      {
        mapKey: "desk-c",
        name: "팀 책상 3",
        area: "팀 공간",
        kind: "desk",
        x: 68,
        y: 66,
        w: 12,
        h: 11,
        color: "#b8956c",
      },
      // 창고 (위 · 가로로 길게)
      {
        mapKey: "steel-a",
        name: "창고 철제장 1열",
        area: "창고",
        kind: "cabinet",
        x: 6,
        y: 5,
        w: 18,
        h: 12,
        color: "#7a8590",
        drawers: 4,
      },
      {
        mapKey: "steel-b",
        name: "창고 철제장 2열",
        area: "창고",
        kind: "cabinet",
        x: 28,
        y: 5,
        w: 18,
        h: 12,
        color: "#7a8590",
        drawers: 4,
      },
      {
        mapKey: "client-cab",
        name: "거래처 서류 캐비닛",
        area: "창고",
        kind: "cabinet",
        x: 50,
        y: 5,
        w: 18,
        h: 12,
        color: "#4a6fa5",
        drawers: 2,
        drawerNames: ["가~사 거래처", "아~하 거래처"],
      },
      {
        mapKey: "box-corner",
        name: "입고 대기 박스존",
        area: "창고",
        kind: "bin",
        x: 72,
        y: 5,
        w: 22,
        h: 12,
        color: "#c4a35a",
      },
    ],
  },
  {
    id: "open",
    name: "오픈형",
    description: "큰 오픈 공간 + 한쪽 창고 (스타트업·공유오피스)",
    rooms: [
      { id: "open", label: "오픈오피스", x: 2, y: 12, w: 66, h: 72, floor: "#dceee4" },
      { id: "storage", label: "창고", x: 70, y: 12, w: 28, h: 72, floor: "#e8e0d4" },
    ],
    entrance: { name: "입구", x: 26, y: 2, w: 18, h: 8 },
    furniture: [
      { mapKey: "d1", name: "프론트 책상 1", area: "오픈오피스", kind: "desk", x: 8, y: 22, w: 14, h: 12, color: "#b8956c" },
      { mapKey: "d2", name: "프론트 책상 2", area: "오픈오피스", kind: "desk", x: 28, y: 22, w: 14, h: 12, color: "#b8956c" },
      { mapKey: "d3", name: "프론트 책상 3", area: "오픈오피스", kind: "desk", x: 48, y: 22, w: 14, h: 12, color: "#b8956c" },
      { mapKey: "d4", name: "백열 책상 4", area: "오픈오피스", kind: "desk", x: 8, y: 42, w: 14, h: 12, color: "#b8956c" },
      { mapKey: "d5", name: "백열 책상 5", area: "오픈오피스", kind: "desk", x: 28, y: 42, w: 14, h: 12, color: "#b8956c" },
      { mapKey: "d6", name: "백열 책상 6", area: "오픈오피스", kind: "desk", x: 48, y: 42, w: 14, h: 12, color: "#b8956c" },
      { mapKey: "cab", name: "공용 문구 캐비닛", area: "오픈오피스", kind: "cabinet", x: 10, y: 64, w: 22, h: 12, color: "#5b7c99", drawers: 3 },
      { mapKey: "print", name: "공용 복합기", area: "오픈오피스", kind: "printer", x: 40, y: 64, w: 12, h: 12, color: "#6a6a6a" },
      { mapKey: "st1", name: "창고 철제장", area: "창고", kind: "cabinet", x: 74, y: 24, w: 20, h: 16, color: "#7a8590", drawers: 4 },
      { mapKey: "box", name: "입고 박스존", area: "창고", kind: "bin", x: 74, y: 52, w: 20, h: 16, color: "#c4a35a" },
    ],
  },
  {
    id: "corridor",
    name: "복도형",
    description: "왼쪽 복도·입구, 오른쪽에 방들이 줄줄이",
    rooms: [
      { id: "hall", label: "중앙 복도", x: 2, y: 8, w: 22, h: 88, floor: "#e2e8f0" },
      { id: "r1", label: "2층 업무실 A", x: 26, y: 8, w: 72, h: 28, floor: "#d4e8dc" },
      { id: "r2", label: "2층 업무실 B", x: 26, y: 40, w: 72, h: 28, floor: "#dde4f5" },
      { id: "r3", label: "비품 창고", x: 26, y: 72, w: 72, h: 24, floor: "#e8e0d4" },
    ],
    entrance: { name: "1층 로비 입구", x: 5, y: 2, w: 14, h: 7 },
    furniture: [
      { mapKey: "da1", name: "업무실 A 책상 1", area: "2층 업무실 A", kind: "desk", x: 32, y: 14, w: 14, h: 12, color: "#b8956c" },
      { mapKey: "da2", name: "업무실 A 책상 2", area: "2층 업무실 A", kind: "desk", x: 52, y: 14, w: 14, h: 12, color: "#b8956c" },
      { mapKey: "ca", name: "업무실 A 캐비닛", area: "2층 업무실 A", kind: "cabinet", x: 74, y: 14, w: 16, h: 14, color: "#5b7c99", drawers: 3 },
      { mapKey: "db1", name: "업무실 B 책상 1", area: "2층 업무실 B", kind: "desk", x: 32, y: 48, w: 14, h: 12, color: "#b8956c" },
      { mapKey: "db2", name: "업무실 B 책상 2", area: "2층 업무실 B", kind: "desk", x: 52, y: 48, w: 14, h: 12, color: "#b8956c" },
      { mapKey: "meet", name: "미니 회의 탁자", area: "2층 업무실 B", kind: "meeting", x: 72, y: 48, w: 18, h: 12, color: "#8b7355" },
      { mapKey: "st", name: "창고 철제장", area: "비품 창고", kind: "cabinet", x: 32, y: 78, w: 22, h: 14, color: "#7a8590", drawers: 4 },
      { mapKey: "pr", name: "창고 옆 복합기", area: "비품 창고", kind: "printer", x: 60, y: 78, w: 12, h: 12, color: "#6a6a6a" },
    ],
  },
  {
    id: "small",
    name: "소규모",
    description: "작은 사무실 2칸 + 수납 (5~10명)",
    rooms: [
      { id: "work", label: "메인 업무실", x: 2, y: 14, w: 96, h: 50, floor: "#d4e8dc" },
      { id: "store", label: "수납실", x: 2, y: 68, w: 96, h: 28, floor: "#e8e0d4" },
    ],
    entrance: { name: "현관 입구", x: 42, y: 2, w: 16, h: 8 },
    furniture: [
      { mapKey: "d1", name: "창가 책상 1", area: "메인 업무실", kind: "desk", x: 10, y: 24, w: 14, h: 12, color: "#b8956c" },
      { mapKey: "d2", name: "창가 책상 2", area: "메인 업무실", kind: "desk", x: 30, y: 24, w: 14, h: 12, color: "#b8956c" },
      { mapKey: "d3", name: "안쪽 책상 3", area: "메인 업무실", kind: "desk", x: 50, y: 24, w: 14, h: 12, color: "#b8956c" },
      { mapKey: "d4", name: "안쪽 책상 4", area: "메인 업무실", kind: "desk", x: 70, y: 24, w: 14, h: 12, color: "#b8956c" },
      { mapKey: "cab", name: "공용 문구 캐비닛", area: "메인 업무실", kind: "cabinet", x: 12, y: 48, w: 20, h: 12, color: "#5b7c99", drawers: 3 },
      { mapKey: "print", name: "공용 복합기", area: "메인 업무실", kind: "printer", x: 40, y: 48, w: 12, h: 12, color: "#6a6a6a" },
      { mapKey: "shelf", name: "수납실 선반", area: "수납실", kind: "shelf", x: 10, y: 76, w: 12, h: 16, color: "#6b8f71" },
      { mapKey: "box", name: "여분 박스존", area: "수납실", kind: "bin", x: 30, y: 76, w: 24, h: 14, color: "#c4a35a" },
      { mapKey: "steel", name: "수납실 철제장", area: "수납실", kind: "cabinet", x: 62, y: 76, w: 22, h: 14, color: "#7a8590", drawers: 3 },
    ],
  },
  {
    id: "warehouse",
    name: "창고 중심",
    description: "큰 창고 + 작은 사무실 (물류·비품 많은 팀)",
    rooms: [
      { id: "office", label: "관리 사무실", x: 2, y: 10, w: 40, h: 40, floor: "#d4e8dc" },
      { id: "wh", label: "메인 창고", x: 44, y: 10, w: 54, h: 86, floor: "#e8e0d4" },
      { id: "dock", label: "하역장", x: 2, y: 54, w: 40, h: 42, floor: "#f5e6d4" },
    ],
    entrance: { name: "사무실 입구", x: 12, y: 2, w: 16, h: 7 },
    furniture: [
      { mapKey: "d1", name: "관리 책상 1", area: "관리 사무실", kind: "desk", x: 10, y: 20, w: 14, h: 12, color: "#b8956c" },
      { mapKey: "d2", name: "관리 책상 2", area: "관리 사무실", kind: "desk", x: 26, y: 20, w: 14, h: 12, color: "#b8956c" },
      { mapKey: "cab", name: "사무실 캐비닛", area: "관리 사무실", kind: "cabinet", x: 10, y: 38, w: 18, h: 10, color: "#5b7c99", drawers: 3 },
      { mapKey: "s1", name: "창고 철제장 1열", area: "메인 창고", kind: "cabinet", x: 50, y: 18, w: 20, h: 16, color: "#7a8590", drawers: 4 },
      { mapKey: "s2", name: "창고 철제장 2열", area: "메인 창고", kind: "cabinet", x: 74, y: 18, w: 20, h: 16, color: "#7a8590", drawers: 4 },
      { mapKey: "s3", name: "창고 철제장 3열", area: "메인 창고", kind: "cabinet", x: 50, y: 42, w: 20, h: 16, color: "#7a8590", drawers: 4 },
      { mapKey: "s4", name: "창고 철제장 4열", area: "메인 창고", kind: "cabinet", x: 74, y: 42, w: 20, h: 16, color: "#7a8590", drawers: 4 },
      { mapKey: "box", name: "대기 박스존", area: "메인 창고", kind: "bin", x: 52, y: 70, w: 40, h: 16, color: "#c4a35a" },
      { mapKey: "print", name: "하역장 복합기", area: "하역장", kind: "printer", x: 12, y: 64, w: 12, h: 12, color: "#6a6a6a" },
      { mapKey: "dock-bin", name: "입고 대기 박스", area: "하역장", kind: "bin", x: 12, y: 80, w: 24, h: 12, color: "#c45c26" },
    ],
  },
  {
    id: "empty",
    name: "빈 도면",
    description: "입구만 있고 직접 꾸미기 (완전 커스텀)",
    rooms: [],
    entrance: { name: "입구", x: 42, y: 2, w: 16, h: 8 },
    furniture: [],
  },
];

/** 하위 호환: 표준형 */
export const FLOOR_ROOMS = OFFICE_LAYOUTS[0].rooms;
export const TEMPLATE_FURNITURE = OFFICE_LAYOUTS[0].furniture;

export function getLayout(id: string): OfficeLayoutTemplate {
  return OFFICE_LAYOUTS.find((l) => l.id === id) ?? OFFICE_LAYOUTS[0];
}

export type LayoutRoom = {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export function areaFromPoint(
  x: number,
  y: number,
  rooms: LayoutRoom[] = FLOOR_ROOMS.map((r) => ({
    name: r.label,
    x: r.x,
    y: r.y,
    w: r.w,
    h: r.h,
  }))
): string {
  for (const room of rooms) {
    if (
      x >= room.x &&
      x <= room.x + room.w &&
      y >= room.y &&
      y <= room.y + room.h
    ) {
      return room.name;
    }
  }
  return "사무실";
}

export function clampLayout(
  x: number,
  y: number,
  w: number,
  h: number,
  maxSize = 80
): { x: number; y: number; w: number; h: number } {
  const cw = Math.min(maxSize, Math.max(6, w));
  const ch = Math.min(maxSize, Math.max(6, h));
  return {
    x: Math.min(100 - cw, Math.max(0, x)),
    y: Math.min(100 - ch, Math.max(0, y)),
    w: cw,
    h: ch,
  };
}

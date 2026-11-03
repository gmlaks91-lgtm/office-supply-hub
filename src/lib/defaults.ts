export type QuickSupply = {
  name: string;
  category: string;
  unit: string;
  minStock: number;
};

export const QUICK_SUPPLIES: QuickSupply[] = [
  { name: "A4 복사용지", category: "인쇄", unit: "팩", minStock: 3 },
  { name: "볼펜", category: "문구", unit: "자루", minStock: 20 },
  { name: "형광펜", category: "문구", unit: "자루", minStock: 10 },
  { name: "포스트잇", category: "문구", unit: "팩", minStock: 5 },
  { name: "스테이플러", category: "문구", unit: "개", minStock: 3 },
  { name: "테이프", category: "문구", unit: "개", minStock: 5 },
  { name: "파일철", category: "문구", unit: "개", minStock: 10 },
  { name: "토너 (흑백)", category: "인쇄", unit: "개", minStock: 2 },
  { name: "토너 (컬러)", category: "인쇄", unit: "개", minStock: 1 },
  { name: "봉투(대)", category: "인쇄", unit: "장", minStock: 20 },
  { name: "인주", category: "인쇄", unit: "개", minStock: 2 },
  { name: "AA 건전지", category: "전자", unit: "팩", minStock: 2 },
  { name: "USB 메모리", category: "전자", unit: "개", minStock: 3 },
  { name: "HDMI 케이블", category: "장비", unit: "개", minStock: 2 },
  { name: "화이트보드 마카", category: "문구", unit: "자루", minStock: 6 },
  { name: "청소용 티슈", category: "소모품", unit: "박스", minStock: 2 },
  { name: "수임 계약서 양식", category: "서류", unit: "부", minStock: 10 },
  { name: "위임장 양식", category: "서류", unit: "부", minStock: 10 },
  { name: "견적서 양식", category: "서류", unit: "부", minStock: 10 },
  { name: "지출결의서 양식", category: "서류", unit: "부", minStock: 10 },
  { name: "거래처 장부 바인더", category: "서류", unit: "개", minStock: 5 },
  { name: "서류 반송 봉투", category: "서류", unit: "장", minStock: 15 },
  { name: "클리어파일", category: "서류", unit: "개", minStock: 10 },
];

export const CATEGORIES = [
  "문구",
  "인쇄",
  "전자",
  "장비",
  "소모품",
  "서류",
  "기타",
] as const;

/** 신고 시즌 안내 (월 = 1~12). 해당 월에만 재고 탭 배너 표시 */
export type SeasonBanner = {
  months: number[];
  message: string;
};

export const SEASON_BANNERS: SeasonBanner[] = [
  {
    months: [1, 7],
    message: "부가세 신고 시즌 — 봉투·토너·A4 재고를 확인하세요",
  },
  {
    months: [5],
    message: "종합소득세 신고 시즌 — 신고 서류 봉투·바인더를 확인하세요",
  },
];

export function seasonBannerForMonth(month: number): string | null {
  const hit = SEASON_BANNERS.find((b) => b.months.includes(month));
  return hit?.message ?? null;
}

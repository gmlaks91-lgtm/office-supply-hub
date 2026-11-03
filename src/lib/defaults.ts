export type QuickSupply = {
  name: string;
  category: string;
  unit: string;
  minStock: number;
};

export const QUICK_SUPPLIES: QuickSupply[] = [
  { name: "A4 복사용지", category: "문구", unit: "팩", minStock: 3 },
  { name: "볼펜", category: "문구", unit: "자루", minStock: 20 },
  { name: "형광펜", category: "문구", unit: "자루", minStock: 10 },
  { name: "포스트잇", category: "문구", unit: "팩", minStock: 5 },
  { name: "스테이플러", category: "문구", unit: "개", minStock: 3 },
  { name: "테이프", category: "문구", unit: "개", minStock: 5 },
  { name: "파일철", category: "문구", unit: "개", minStock: 10 },
  { name: "토너 (흑백)", category: "인쇄", unit: "개", minStock: 1 },
  { name: "토너 (컬러)", category: "인쇄", unit: "개", minStock: 1 },
  { name: "AA 건전지", category: "전자", unit: "팩", minStock: 2 },
  { name: "USB 메모리", category: "전자", unit: "개", minStock: 3 },
  { name: "HDMI 케이블", category: "장비", unit: "개", minStock: 2 },
  { name: "화이트보드 마카", category: "문구", unit: "자루", minStock: 6 },
  { name: "청소용 티슈", category: "소모품", unit: "박스", minStock: 2 },
  { name: "계약서 양식", category: "서류", unit: "부", minStock: 5 },
  { name: "세금계산서 철", category: "서류", unit: "부", minStock: 3 },
  { name: "명함 신청서", category: "서류", unit: "부", minStock: 10 },
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

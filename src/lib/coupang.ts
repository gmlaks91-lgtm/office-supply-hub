/** 쿠팡 검색·최저가 추천 헬퍼 */

export type CoupangDeal = {
  title: string;
  price: number;
  url: string;
  imageUrl?: string;
  isRocket?: boolean;
  isFreeShipping?: boolean;
};

export function coupangSearchUrl(keyword: string): string {
  const q = encodeURIComponent(keyword.trim());
  return `https://www.coupang.com/np/search?component=&q=${q}&channel=user`;
}

export function formatWon(n: number): string {
  return `${n.toLocaleString("ko-KR")}원`;
}

type CacheEntry = { at: number; deals: CoupangDeal[] };
const memoryCache = new Map<string, CacheEntry>();
const CACHE_MS = 30 * 60 * 1000;

export function getCachedDeals(keyword: string): CoupangDeal[] | null {
  const hit = memoryCache.get(keyword.trim().toLowerCase());
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_MS) {
    memoryCache.delete(keyword.trim().toLowerCase());
    return null;
  }
  return hit.deals;
}

export function setCachedDeals(keyword: string, deals: CoupangDeal[]) {
  memoryCache.set(keyword.trim().toLowerCase(), { at: Date.now(), deals });
}

export function isCoupangConfigured(): boolean {
  return Boolean(
    process.env.COUPANG_ACCESS_KEY?.trim() && process.env.COUPANG_SECRET_KEY?.trim()
  );
}

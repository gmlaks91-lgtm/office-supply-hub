"use client";

import { useEffect, useState } from "react";
import { coupangSearchUrl, formatWon, type CoupangDeal } from "@/lib/coupang";

type Props = { keyword: string };

export function CoupangDeals({ keyword }: Props) {
  const [deals, setDeals] = useState<CoupangDeal[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const fallback = coupangSearchUrl(keyword);

  useEffect(() => {
    let cancelled = false;
    const q = keyword.trim();
    if (q.length < 2) return;

    setLoading(true);
    void fetch(`/api/coupang/search?q=${encodeURIComponent(q)}&limit=3`)
      .then(async (r) => {
        const json = (await r.json()) as {
          configured?: boolean;
          deals?: CoupangDeal[];
        };
        if (cancelled) return;
        setConfigured(json.configured !== false);
        setDeals(json.deals ?? []);
      })
      .catch(() => {
        if (!cancelled) {
          setConfigured(false);
          setDeals([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [keyword]);

  return (
    <div className="mt-2 rounded-xl bg-amber-50/80 border border-amber-100 px-2.5 py-2 space-y-1.5">
      <p className="text-[11px] font-medium text-amber-950">쿠팡 최저가 추천</p>
      {loading && <p className="text-[11px] text-amber-800/70">찾는 중…</p>}
      {!loading && deals.length > 0 && (
        <ul className="space-y-1">
          {deals.map((d) => (
            <li key={d.url}>
              <a
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-baseline justify-between gap-2 text-[11px] text-amber-950 hover:underline"
              >
                <span className="truncate min-w-0">
                  {d.isRocket ? "[로켓] " : ""}
                  {d.title}
                </span>
                <span className="shrink-0 font-semibold text-orange-700">
                  {formatWon(d.price)}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
      {!loading && deals.length === 0 && (
        <p className="text-[11px] text-amber-800/80">
          {configured === false
            ? "파트너스 키 없음 · 검색 링크로 확인하세요"
            : "실시간 최저가를 못 가져왔습니다"}
        </p>
      )}
      <a
        href={fallback}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-[11px] font-medium text-orange-800 underline"
      >
        쿠팡에서 찾기
      </a>
      <p className="text-[10px] text-amber-800/60 leading-snug">
        쿠팡 파트너스 활동을 통해 일정액의 수수료를 제공받을 수 있습니다.
      </p>
    </div>
  );
}

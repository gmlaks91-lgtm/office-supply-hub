import { createHmac } from "crypto";
import {
  getCachedDeals,
  isCoupangConfigured,
  setCachedDeals,
  type CoupangDeal,
} from "@/lib/coupang";

const SEARCH_PATH =
  "/v2/providers/affiliate_open_api/apis/openapi/v1/products/search";
const BASE = "https://api-gateway.coupang.com";

function signedDate(): string {
  // yyMMdd'T'HHmmss'Z' (GMT)
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const yy = String(d.getUTCFullYear()).slice(2);
  return `${yy}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function authorization(method: string, pathWithQuery: string): string {
  const accessKey = process.env.COUPANG_ACCESS_KEY!.trim();
  const secretKey = process.env.COUPANG_SECRET_KEY!.trim();
  const datetime = signedDate();
  const pathOnly = pathWithQuery.split("?")[0];
  const message = `${datetime}${method}${pathOnly}`;
  const signature = createHmac("sha256", secretKey).update(message).digest("hex");
  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`;
}

type PartnerProduct = {
  productId?: number;
  productName?: string;
  productPrice?: number;
  productUrl?: string;
  productImage?: string;
  isRocket?: boolean;
  isFreeShipping?: boolean;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = (searchParams.get("q") || searchParams.get("keyword") || "").trim();
  const limit = Math.min(3, Math.max(1, Number(searchParams.get("limit") || 3)));

  if (keyword.length < 2) {
    return Response.json({ ok: false, error: "검색어가 너무 짧습니다", deals: [] }, { status: 400 });
  }

  if (!isCoupangConfigured()) {
    return Response.json({
      ok: false,
      configured: false,
      error: "쿠팡 파트너스 키가 없습니다",
      deals: [],
    });
  }

  const cached = getCachedDeals(keyword);
  if (cached) {
    return Response.json({ ok: true, configured: true, cached: true, deals: cached.slice(0, limit) });
  }

  try {
    const qs = `?keyword=${encodeURIComponent(keyword)}&limit=10`;
    const pathWithQuery = `${SEARCH_PATH}${qs}`;
    const res = await fetch(`${BASE}${pathWithQuery}`, {
      method: "GET",
      headers: {
        Authorization: authorization("GET", pathWithQuery),
        "Content-Type": "application/json;charset=UTF-8",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return Response.json(
        {
          ok: false,
          configured: true,
          error: `쿠팡 API ${res.status}`,
          detail: text.slice(0, 200),
          deals: [],
        },
        { status: 502 }
      );
    }

    const json = (await res.json()) as {
      data?: { productData?: PartnerProduct[] } | PartnerProduct[];
      rData?: { productData?: PartnerProduct[] };
    };

    const raw: PartnerProduct[] =
      (json.data && !Array.isArray(json.data) && json.data.productData) ||
      (Array.isArray(json.data) ? json.data : undefined) ||
      json.rData?.productData ||
      [];

    const deals: CoupangDeal[] = raw
      .filter((p) => p.productName && typeof p.productPrice === "number" && p.productUrl)
      .map((p) => ({
        title: p.productName!,
        price: p.productPrice!,
        url: p.productUrl!.startsWith("http")
          ? p.productUrl!
          : `https://www.coupang.com${p.productUrl}`,
        imageUrl: p.productImage,
        isRocket: p.isRocket,
        isFreeShipping: p.isFreeShipping,
      }))
      .sort((a, b) => a.price - b.price)
      .slice(0, 3);

    setCachedDeals(keyword, deals);

    return Response.json({
      ok: true,
      configured: true,
      cached: false,
      deals: deals.slice(0, limit),
      notice:
        "쿠팡 파트너스 활동을 통해 일정액의 수수료를 제공받을 수 있습니다.",
    });
  } catch (e) {
    return Response.json(
      {
        ok: false,
        configured: true,
        error: e instanceof Error ? e.message : "조회 실패",
        deals: [],
      },
      { status: 500 }
    );
  }
}

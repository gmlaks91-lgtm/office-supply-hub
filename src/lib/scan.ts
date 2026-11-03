/** 스캔 문자열에서 spot id 추출 (?spot= 딥링크 또는 UUID) */
export function parseSpotIdFromScan(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;

  try {
    const url = new URL(text);
    const spot = url.searchParams.get("spot");
    if (spot) return spot.trim();
  } catch {
    /* not a full URL */
  }

  const q = text.match(/[?&]spot=([^&#\s]+)/i);
  if (q?.[1]) {
    try {
      return decodeURIComponent(q[1]).trim();
    } catch {
      return q[1].trim();
    }
  }

  // bare uuid
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text)) {
    return text;
  }

  return null;
}

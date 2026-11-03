/** 발표·시연용 UI 선호 (localStorage) */

const LS_COUPANG = "office_show_coupang_v1";
const LS_SEASON_PREVIEW = "office_season_preview_month_v1";

export function readShowCoupang(): boolean {
  try {
    return localStorage.getItem(LS_COUPANG) === "1";
  } catch {
    return false;
  }
}

export function writeShowCoupang(on: boolean) {
  try {
    localStorage.setItem(LS_COUPANG, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/** null = 실제 이번 달 사용, 1~12 = 미리보기 */
export function readSeasonPreviewMonth(): number | null {
  try {
    const raw = localStorage.getItem(LS_SEASON_PREVIEW);
    if (!raw || raw === "auto") return null;
    const n = Number(raw);
    if (Number.isInteger(n) && n >= 1 && n <= 12) return n;
    return null;
  } catch {
    return null;
  }
}

export function writeSeasonPreviewMonth(month: number | null) {
  try {
    if (month == null) localStorage.setItem(LS_SEASON_PREVIEW, "auto");
    else localStorage.setItem(LS_SEASON_PREVIEW, String(month));
  } catch {
    /* ignore */
  }
}

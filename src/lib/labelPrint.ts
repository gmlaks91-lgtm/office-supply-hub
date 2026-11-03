import { spotPath } from "./storage";
import type { StorageSpot } from "./types";

/** 위치 라벨 인쇄 창 (QR = 앱 딥링크) */
export function printSpotLabel(spot: StorageSpot, all: StorageSpot[]) {
  const path = spotPath(spot, all);
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const deep = `${origin}/?spot=${encodeURIComponent(spot.id)}`;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(deep)}`;
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8"/>
<title>라벨 · ${path}</title>
<style>
  body { font-family: system-ui, sans-serif; padding: 24px; }
  .label { border: 2px solid #0f766e; border-radius: 12px; padding: 20px; max-width: 320px;
    display: flex; gap: 16px; align-items: center; }
  h1 { font-size: 16px; margin: 0 0 6px; }
  p { margin: 0; font-size: 12px; color: #334155; word-break: break-all; }
  img { width: 120px; height: 120px; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="label">
    <img src="${qr}" alt="QR" width="120" height="120"/>
    <div>
      <h1>${path.replace(/</g, "&lt;")}</h1>
      <p>스캔하면 이 위치로 이동합니다</p>
      <p style="margin-top:8px;font-size:10px;color:#64748b">${deep.replace(/</g, "&lt;")}</p>
    </div>
  </div>
  <script>window.onload=()=>setTimeout(()=>window.print(),300)</script>
</body>
</html>`;
  const w = window.open("", "_blank", "width=420,height=360");
  if (!w) {
    alert("팝업이 차단되었습니다. 팝업을 허용한 뒤 다시 시도하세요.");
    return;
  }
  w.document.write(html);
  w.document.close();
}

# 회사 비품 공유 · 사무실 맵

**세무법인 비품·서류 위치 공유 앱**입니다.  
직원이 **어디에 뭐가 있는지 / 얼마나 있는지**를 같이 보고, 쓰고, 채우는 모바일 우선 PWA입니다.

## 기능

- **인테리어 맵**: 가구 팔레트로 책상·캐비닛 등을 배치·이동·삭제
- **칸별 비품**: 탭해서 내용 확인, 수량 ±, 빠른 추가 · **라벨·QR** 인쇄
- **재고·서류**: 검색, 카테고리(서류), **거래처·만료일**, 부족·주문, 사용 기록, 요청→입고
- **신고 시즌 안내**: 1·5·7월 배너 (설정에서 월 미리보기)
- **QR 스캔**: 헤더에서 칸 라벨 스캔 → 해당 위치 카드
- **쿠팡 최저가**: 설정에서 켠 경우에만 부족 목록에 표시 (기본 꺼짐)
- **회사 분리**: 가입 코드 워크스페이스
- **CSV** / **Supabase** / **PWA**

바코드 스캐너·대여·장보기 앱 수준의 복잡도는 넣지 않았습니다.

## 로컬 실행

```bash
npm install
cp .env.example .env.local
npm run dev
```

환경변수가 없으면 이 기기 localStorage로 바로 데모됩니다.

### 업무 플로우 빠르게 보기

1. **설정** → 회사 만들기/입장 · 내 이름  
2. **재고** → 품목 **−** 로 사용 · **서류** 카테고리 필터  
3. 최소 재고 이하 → **부족·주문** (쿠팡은 설정에서 켠 경우만)  
4. **요청** → **입고·완료**  
5. **설정** → CSV  
6. **위치** → 라벨·QR (`/?spot=…`)

## Supabase

1. 프로젝트 생성 후 SQL Editor에서 `supabase/schema.sql` 실행  
2. `.env.local`에 URL / anon key

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

테이블: `organizations`, `storage_spots`, `inventory_items`, `activity_log`, `supply_requests`  
(기존 DB는 `schema.sql` 하단 ALTER / organizations 구간을 추가 실행)

**Realtime (기기 간 동기화):** Database → Publications → `supabase_realtime`에서  
`inventory_items`, `supply_requests`, `activity_log`를 Enable 하세요. (`schema.sql` 하단 SQL로도 가능)

join_code 기반 회사 분리는 발표·내부용입니다. 운영 시에는 Supabase Auth + RLS를 권장합니다.

### (선택) 쿠팡 최저가

```
COUPANG_ACCESS_KEY=
COUPANG_SECRET_KEY=
```

키가 없으면(그리고 설정에서 켠 경우) 검색 링크만 열립니다.

## Vercel 배포

1. GitHub에 push → Vercel Import  
2. 환경변수 2개 등록 후 Deploy  
3. 휴대폰에서 HTTPS 주소 열고 홈 화면에 추가  

```bash
vercel --prod
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## 비슷한 제품에서 가져온 실무 포인트

Sortly / Asset Panda / OfficeStoreApp / ReStock / repleno 공통으로 쓰는 것:

| 필요 | 이 앱 |
|------|--------|
| 최소재고·부족 목록 | 재고 → 부족·주문 |
| 누가 썼는지 | 사용 시 이름·메모 → 사용기록 |
| 직원 요청 | 요청 / 입고·완료 |
| 엑셀 연동 | CSV import/export |
| 위치 QR | 라벨·QR 인쇄 |

## 발표 자료

- 한 장 보고서: [`docs/report-poster.jpg`](docs/report-poster.jpg)

## 향후 계획 (미구현)

Slack·메일로 부족 재고를 자동 알림하는 기능은 아직 연결하지 않았습니다. 앱 안 「부족·주문」 목록이 기본입니다.

나중에 붙일 때 참고용 env:

```
RESEND_API_KEY=
LOW_STOCK_NOTIFY_EMAIL=
SLACK_WEBHOOK_URL=
```

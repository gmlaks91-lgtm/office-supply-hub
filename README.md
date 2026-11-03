# 회사 비품 공유 · 사무실 맵

직원이 **어디에 뭐가 있는지 / 얼마나 있는지**를 같이 보고, 쓰고, 채우는 모바일 우선 PWA입니다.

## 기능

- **인테리어 맵**: 가구 팔레트로 책상·캐비닛 등을 배치·이동·삭제
- **칸별 비품**: 탭해서 내용 확인, 수량 ±, 빠른 추가 · **라벨·QR** 인쇄
- **재고·서류**: 검색, 카테고리(서류 포함), **부족·주문** + **쿠팡 최저가/검색**, 사용 기록, 요청→입고
- **회사 분리**: 가입 코드 워크스페이스(동일 서류명도 회사별로 격리)
- **CSV** 내보내기/가져오기 (엑셀·구매팀 공유)
- **Supabase 공유** + **Vercel** 배포 + 홈 화면 추가(PWA)

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
3. 최소 재고 이하 → **부족·주문** + 쿠팡 추천(또는 검색 링크)  
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

join_code 기반 회사 분리는 발표·내부용입니다. 운영 시에는 Supabase Auth + RLS 권장을 권장합니다.

### (선택) 쿠팡 최저가

```
COUPANG_ACCESS_KEY=
COUPANG_SECRET_KEY=
```

키가 없으면 부족 목록에서 쿠팡 검색 링크만 열립니다.

### (선택) 부족 메일/슬랙

```
RESEND_API_KEY=
LOW_STOCK_NOTIFY_EMAIL=
SLACK_WEBHOOK_URL=
```

앱 안 「부족·주문」 목록이 기본 알림입니다. 외부 발송 크론은 연결하지 않았습니다.

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

- 한 장 보고서: [`docs/report-poster.jpg`](docs/report-poster.jpg) (루트 `보고서.jpg` 동일)  

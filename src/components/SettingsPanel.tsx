"use client";

import { useEffect, useRef, useState } from "react";
import { readActorName, writeActorName } from "@/lib/actor";
import { downloadCsv, inventoryToCsv } from "@/lib/csv";
import type { OfficeStore } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase";

type Props = { store: OfficeStore };

export function SettingsPanel({ store }: Props) {
  const configured = isSupabaseConfigured();
  const [busy, setBusy] = useState(false);
  const [actor, setActor] = useState("");
  const [csvMsg, setCsvMsg] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [orgMsg, setOrgMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActor(readActorName());
  }, []);

  async function onReseed() {
    if (
      !confirm(
        "비품 재고를 예시 데이터로 바꿀까요?\n(위치는 그대로 두고, 기존 비품 목록만 교체됩니다.)"
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await store.reseedDemoExamples();
    } finally {
      setBusy(false);
    }
  }

  function onExportCsv() {
    const csv = inventoryToCsv(store.inventory, store.spots);
    const day = new Date().toISOString().slice(0, 10);
    downloadCsv(`office-inventory-${day}.csv`, csv);
    setCsvMsg(`${store.inventory.length}건을 CSV로 저장했습니다.`);
  }

  async function onImportFile(file: File) {
    setCsvMsg(null);
    setBusy(true);
    try {
      const text = await file.text();
      const n = await store.importInventoryCsvText(text);
      setCsvMsg(`${n}건을 가져왔습니다. (같은 이름·위치는 수량이 합쳐집니다)`);
    } catch (e) {
      setCsvMsg(e instanceof Error ? e.message : "가져오기 실패");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">설정</h2>
        <p className="text-sm text-slate-500">업무 설정 · 공유 · CSV</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
        <h3 className="font-medium text-slate-900">회사 (워크스페이스)</h3>
        <p className="text-sm text-slate-600">
          회사마다 위치·재고·서류가 따로 저장됩니다. 같은 서류 이름도 A사·B사에서 섞이지
          않습니다.
        </p>
        {store.org && (
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
            <p className="font-medium text-slate-900">{store.org.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              가입 코드{" "}
              <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {store.org.join_code}
              </code>
            </p>
          </div>
        )}
        <div className="space-y-2">
          <input
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="새 회사 이름"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />
          <button
            type="button"
            disabled={busy || !orgName.trim()}
            onClick={() => {
              setBusy(true);
              setOrgMsg(null);
              void store
                .createOrganization(orgName.trim())
                .then((o) => {
                  setOrgMsg(`「${o.name}」을(를) 만들었습니다. 코드: ${o.join_code}`);
                  setOrgName("");
                })
                .catch((e) =>
                  setOrgMsg(e instanceof Error ? e.message : "만들기 실패")
                )
                .finally(() => setBusy(false));
            }}
            className="w-full rounded-xl bg-teal-800 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            회사 만들기
          </button>
        </div>
        <div className="flex gap-2">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="가입 코드"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm uppercase tracking-wider"
          />
          <button
            type="button"
            disabled={busy || !joinCode.trim()}
            onClick={() => {
              setBusy(true);
              setOrgMsg(null);
              void store
                .joinOrganization(joinCode.trim())
                .then((o) => {
                  setOrgMsg(`「${o.name}」에 입장했습니다.`);
                  setJoinCode("");
                })
                .catch((e) =>
                  setOrgMsg(e instanceof Error ? e.message : "입장 실패")
                )
                .finally(() => setBusy(false));
            }}
            className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            입장
          </button>
        </div>
        {orgMsg && <p className="text-xs text-slate-600">{orgMsg}</p>}
        <p className="text-[11px] text-slate-400">
          로컬만 쓸 때는 이 기기에 만든 코드만 입장됩니다. Supabase 연결 시 다른
          기기와도 코드로 합류할 수 있습니다. 운영용 권한(RLS)은 별도 강화가
          필요합니다.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
        <h3 className="font-medium text-slate-900">내 이름</h3>
        <p className="text-sm text-slate-600">
          사용·요청 기록에 붙습니다. 여러 사람이 같은 기기를 쓰면 쓸 때마다 바꿀 수
          있습니다.
        </p>
        <input
          value={actor}
          onChange={(e) => {
            setActor(e.target.value);
            writeActorName(e.target.value);
          }}
          placeholder="예: 김민수 / 총무팀"
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
        <h3 className="font-medium text-slate-900">Excel · CSV</h3>
        <p className="text-sm text-slate-600">
          구매·정산은 엑셀로 하는 경우가 많아, 재고를 내보내거나 기존 목록을 가져올 수
          있습니다.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onExportCsv}
            className="rounded-xl bg-teal-800 px-4 py-2.5 text-sm font-medium text-white"
          >
            CSV 내보내기
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            CSV 가져오기
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImportFile(f);
            }}
          />
        </div>
        {csvMsg && <p className="text-xs text-slate-600">{csvMsg}</p>}
        <p className="text-[11px] text-slate-400">
          열: name, category, quantity, min_stock, unit, location, notes (한글 헤더
          이름/수량/위치 등도 인식)
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
        <h3 className="font-medium text-slate-900">데이터 공유</h3>
        {configured && !store.usingLocal ? (
          <p className="text-sm text-emerald-700">
            Supabase 연결됨 · 직원과 같은 위치·재고를 봅니다
          </p>
        ) : (
          <p className="text-sm text-amber-800">
            이 기기에만 저장 중. 공유하려면{" "}
            <code className="text-xs bg-slate-100 px-1 rounded">.env.local</code>에
            Supabase 키를 넣고{" "}
            <code className="text-xs bg-slate-100 px-1 rounded">schema.sql</code>을
            실행하세요.
          </p>
        )}
        {store.error && <p className="text-xs text-red-600">{store.error}</p>}
        <p className="text-xs text-slate-500">
          이메일·Slack 부족 알림은{" "}
          <code className="bg-slate-100 px-1 rounded">RESEND_API_KEY</code> 또는 Slack
          Incoming Webhook을 붙일 때 연결하면 됩니다. 지금은 앱 안 「부족·주문」 목록으로
          바로 확인합니다.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
        <h3 className="font-medium text-slate-900">업무 사용법</h3>
        <ol className="text-sm text-slate-600 space-y-1.5 list-decimal pl-5">
          <li>
            <strong>위치</strong>에서 칸을 열어 비품 확인 · 라벨 인쇄(QR)
          </li>
          <li>
            <strong>재고</strong>에서 − 사용(이름 기록), 부족·주문 · 요청 탭 확인
          </li>
          <li>설정에서 CSV로 엑셀 공유 · 내 이름 저장</li>
        </ol>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
        <h3 className="font-medium text-slate-900">예시 데이터</h3>
        <p className="text-sm text-slate-600">
          발표·리허설용으로 칸별 비품 예시를 다시 넣습니다. 위치는 유지되고 비품만
          교체됩니다.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void onReseed()}
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "넣는 중…" : "예시 다시 넣기"}
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
        <h3 className="font-medium text-slate-900">휴대폰</h3>
        <p className="text-sm text-slate-600">
          HTTPS로 배포한 주소를 열고 홈 화면에 추가하면 앱처럼 쓸 수 있습니다.
        </p>
      </section>
    </div>
  );
}

type BodyItem = {
  name: string;
  quantity: number;
  min_stock: number;
  unit: string;
  location: string;
  category?: string;
};

export async function POST(request: Request) {
  let body: { items?: BodyItem[]; orgName?: string | null };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, configured: false, message: "잘못된 요청" }, { status: 400 });
  }

  const items = (body.items ?? []).filter((i) => i?.name);
  if (!items.length) {
    return Response.json({ ok: false, configured: false, message: "부족 품목이 없습니다" });
  }

  const slackUrl = process.env.SLACK_WEBHOOK_URL?.trim();
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const notifyEmail = process.env.LOW_STOCK_NOTIFY_EMAIL?.trim();
  const configured = Boolean(slackUrl || (resendKey && notifyEmail));

  if (!configured) {
    return Response.json({
      ok: false,
      configured: false,
      message:
        "SLACK_WEBHOOK_URL 또는 RESEND_API_KEY + LOW_STOCK_NOTIFY_EMAIL을 설정하세요",
      slack: false,
      email: false,
    });
  }

  const org = body.orgName?.trim() || "회사";
  const lines = items
    .slice(0, 40)
    .map(
      (i) =>
        `• ${i.name} — ${i.quantity}/${i.min_stock}${i.unit} · ${i.location}${
          i.category ? ` (${i.category})` : ""
        }`
    )
    .join("\n");
  const text = `[부족·주문] ${org}\n${items.length}건\n${lines}`;

  let slack = false;
  let email = false;
  const errors: string[] = [];

  if (slackUrl) {
    try {
      const r = await fetch(slackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      slack = r.ok;
      if (!r.ok) errors.push(`Slack ${r.status}`);
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "Slack 실패");
    }
  }

  if (resendKey && notifyEmail) {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.LOW_STOCK_FROM_EMAIL?.trim() || "Office Hub <onboarding@resend.dev>",
          to: [notifyEmail],
          subject: `[부족·주문] ${org} · ${items.length}건`,
          text,
        }),
      });
      email = r.ok;
      if (!r.ok) {
        const t = await r.text().catch(() => "");
        errors.push(`Resend ${r.status} ${t.slice(0, 120)}`);
      }
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "메일 실패");
    }
  }

  const ok = slack || email;
  return Response.json({
    ok,
    configured: true,
    slack,
    email,
    message: ok
      ? `알림 전송${slack ? " · Slack" : ""}${email ? " · 메일" : ""}`
      : errors.join("; ") || "전송 실패",
  });
}

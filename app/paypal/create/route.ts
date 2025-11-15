import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = "USD" } = await req.json();
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      return NextResponse.json({ error: "PayPal env missing" }, { status: 500 });
    }
    const base =
      process.env.PAYPAL_ENV === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";

    // 1) OAuth
    const oauth = await fetch(`${base}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
          ).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    if (!oauth.ok) {
      const t = await oauth.text();
      return NextResponse.json({ error: "paypal_oauth_failed", detail: t }, { status: 500 });
    }
    const { access_token } = (await oauth.json()) as any;

    // 2) Create Order
    const orderRes = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{ amount: { currency_code: currency, value: String(amount || "5.00") } }],
      }),
    });

    const data = await orderRes.json();
    if (!orderRes.ok) {
      return NextResponse.json({ error: "paypal_create_failed", detail: data }, { status: 500 });
    }
    return NextResponse.json({ id: data.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "server_error" }, { status: 500 });
  }
}



// ============================================================================
// FILE: app/api/paypal/capture/route.ts
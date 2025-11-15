import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { orderID } = await req.json();
    if (!orderID) return NextResponse.json({ error: "missing_order_id" }, { status: 400 });

    const base =
      process.env.PAYPAL_ENV === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";

    // OAuth
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

    // Capture
    const cap = await fetch(`${base}/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const data = await cap.json();
    if (!cap.ok) {
      return NextResponse.json({ error: "paypal_capture_failed", detail: data }, { status: 500 });
    }
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "server_error" }, { status: 500 });
  }
}



// ====================================
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { markOrderPaid, markOrderFailed } from "@/lib/payments";

export const runtime = "nodejs";

/**
 * Razorpay webhook (Dashboard → Webhooks → events: payment.captured, order.paid, payment.failed).
 * Raw body must be read as text so the HMAC matches exactly.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature");
  if (!sig || !verifyWebhookSignature(raw, sig)) return NextResponse.json({ error: "Bad signature" }, { status: 400 });

  const event = JSON.parse(raw);
  await connectDB();
  const payment = event.payload?.payment?.entity;
  if (event.event === "payment.captured" || event.event === "order.paid") {
    const orderId = payment?.order_id ?? event.payload?.order?.entity?.id;
    if (orderId && payment?.id) await markOrderPaid(orderId, payment.id);
  } else if (event.event === "payment.failed" && payment?.order_id) {
    await markOrderFailed(payment.order_id, payment.id);
  }
  return NextResponse.json({ received: true });
}

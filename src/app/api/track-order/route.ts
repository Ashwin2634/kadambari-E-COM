import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, "track", 10, 60);
  if (limited) return limited;
  const { orderId, contact } = await req.json();
  if (!orderId || !contact) return NextResponse.json({ error: "Enter your order ID and phone or email" }, { status: 400 });
  await connectDB();
  const c = String(contact).trim();
  const order = await Order.findOne({
    customOrderId: String(orderId).trim().toUpperCase(),
    "paymentDetails.status": "PAID",
    $or: [{ "customer.email": c.toLowerCase() }, { "customer.phone": c }],
  }).select("customOrderId items fulfillment pricingSummary.grandTotal createdAt customer.shippingAddress.city").lean();
  // Same message whether the ID or the contact is wrong – prevents order enumeration.
  if (!order) return NextResponse.json({ error: "No order matches those details" }, { status: 404 });
  return NextResponse.json({ order });
}

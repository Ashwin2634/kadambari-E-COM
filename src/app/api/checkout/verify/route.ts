import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyCheckoutSignature } from "@/lib/razorpay";
import { markOrderPaid } from "@/lib/payments";
import { Order } from "@/models/Order";

/** Step 2: Razorpay Checkout success handler posts here; the signature is verified server-side. */
export async function POST(req: NextRequest) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
    return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
  if (!verifyCheckoutSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature))
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  await connectDB();
  await markOrderPaid(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  const order = await Order.findOne({ "paymentDetails.razorpayOrderId": razorpay_order_id }).select("customOrderId").lean();
  return NextResponse.json({ ok: true, customOrderId: order?.customOrderId });
}

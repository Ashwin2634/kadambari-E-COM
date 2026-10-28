import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { priceCart, CheckoutError } from "@/lib/pricing";
import { razorpay } from "@/lib/razorpay";
import { Order } from "@/models/Order";
import { generateOrderId } from "@/lib/utils";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  cart: z.array(z.object({ productId: z.string().length(24), color: z.string(), size: z.string(), quantity: z.number().int().min(1).max(10) })).min(1),
  couponCode: z.string().optional(),
  customer: z.object({
    email: z.string().email(),
    phone: z.string().regex(/^[0-9+\-\s]{10,15}$/),
    fullName: z.string().min(2),
    street: z.string().min(3),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().min(4),
    country: z.string().default("India"),
  }),
});

/** Step 1 of checkout: reprice on the server, create a PENDING order + Razorpay order. */
export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, "create-order", 8, 60);
  if (limited) return limited;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Please check your details and try again" }, { status: 400 });
  const { cart, couponCode, customer } = parsed.data;

  await connectDB();
  try {
    const { items, pricingSummary } = await priceCart(cart, couponCode);
    const session = await getSession();
    const rzpOrder = await razorpay().orders.create({
      amount: Math.round(pricingSummary.grandTotal * 100), // paise
      currency: "INR",
      receipt: generateOrderId(),
    });
    const order = await Order.create({
      customOrderId: generateOrderId(),
      customer: {
        userId: session?.user?.id,
        email: customer.email,
        phone: customer.phone,
        shippingAddress: { fullName: customer.fullName, street: customer.street, city: customer.city, state: customer.state, postalCode: customer.postalCode, country: customer.country },
      },
      items,
      pricingSummary,
      paymentDetails: { provider: "RAZORPAY", razorpayOrderId: rzpOrder.id, status: "PENDING" },
      fulfillment: { status: "ORDER_PLACED", timeline: [{ status: "ORDER_PLACED", timestamp: new Date(), note: "Awaiting payment" }] },
    });
    return NextResponse.json({
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      customOrderId: order.customOrderId,
      prefill: { name: customer.fullName, email: customer.email, contact: customer.phone },
    });
  } catch (e) {
    if (e instanceof CheckoutError) return NextResponse.json({ error: e.message }, { status: 409 });
    console.error(e);
    return NextResponse.json({ error: "Could not start payment" }, { status: 500 });
  }
}

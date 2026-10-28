import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { findValidCoupon, CheckoutError } from "@/lib/pricing";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, "coupon", 15, 60);
  if (limited) return limited;
  const { code, subtotal } = await req.json();
  await connectDB();
  try {
    return NextResponse.json(await findValidCoupon(String(code ?? ""), Number(subtotal) || 0));
  } catch (e) {
    if (e instanceof CheckoutError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}

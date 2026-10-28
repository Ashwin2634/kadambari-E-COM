import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Order } from "@/models/Order";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(); if (denied) return denied;
  await connectDB();
  const status = req.nextUrl.searchParams.get("status");
  const filter: Record<string, unknown> = { "paymentDetails.status": { $in: ["PAID", "REFUNDED"] } };
  if (status) filter["fulfillment.status"] = status;
  return NextResponse.json({ orders: await Order.find(filter).sort({ createdAt: -1 }).limit(200).lean() });
}

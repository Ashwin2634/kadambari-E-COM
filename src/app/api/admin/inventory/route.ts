import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Product } from "@/models/Product";

/** Rapid stock edit: { productId, variantId, stockQuantity } */
export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin(); if (denied) return denied;
  const { productId, variantId, stockQuantity } = await req.json();
  const q = Number(stockQuantity);
  if (!Number.isInteger(q) || q < 0) return NextResponse.json({ error: "Stock must be a whole number ≥ 0" }, { status: 400 });
  await connectDB();
  await Product.updateOne({ _id: productId }, { $set: { "variants.$[v].stockQuantity": q } }, { arrayFilters: [{ "v._id": variantId }] });
  return NextResponse.json({ ok: true });
}

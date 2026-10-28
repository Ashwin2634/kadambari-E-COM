import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Product } from "@/models/Product";
import { slugify } from "@/lib/utils";
import { productSchema } from "@/lib/schemas";

export async function GET() {
  const denied = await requireAdmin(); if (denied) return denied;
  await connectDB();
  return NextResponse.json({ products: await Product.find().sort({ createdAt: -1 }).lean() });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(); if (denied) return denied;
  const parsed = productSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid product" }, { status: 400 });
  await connectDB();
  try {
    const p = await Product.create({ ...parsed.data, slug: slugify(parsed.data.title) });
    return NextResponse.json({ product: p }, { status: 201 });
  } catch (e: unknown) {
    if ((e as { code?: number }).code === 11000) return NextResponse.json({ error: "Title or SKU already exists" }, { status: 409 });
    throw e;
  }
}

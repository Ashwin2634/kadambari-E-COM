import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await connectDB();
  const sp = req.nextUrl.searchParams;
  const filter: Record<string, unknown> = { isAvailable: true };
  if (sp.get("category")) filter.category = sp.get("category");
  if (sp.get("q")) filter.title = { $regex: sp.get("q")!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  const sortMap: Record<string, Record<string, 1 | -1>> = {
    new: { createdAt: -1 }, low: { "pricing.basePrice": 1 }, high: { "pricing.basePrice": -1 }, best: { totalSold: -1 },
  };
  const products = await Product.find(filter).sort(sortMap[sp.get("sort") ?? "new"] ?? { createdAt: -1 }).limit(60).lean();
  return NextResponse.json({ products });
}

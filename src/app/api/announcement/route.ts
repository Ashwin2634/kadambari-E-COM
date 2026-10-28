import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Marketing } from "@/models/Marketing";

export const dynamic = "force-dynamic";

export async function GET() {
  await connectDB();
  const now = new Date();
  const banner = await Marketing.findOne({
    type: "GLOBAL_BANNER",
    isActive: true,
    $and: [{ $or: [{ validFrom: null }, { validFrom: { $lte: now } }] }, { $or: [{ validTo: null }, { validTo: { $gte: now } }] }],
  }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ banner });
}

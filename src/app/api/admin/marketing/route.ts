import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Marketing } from "@/models/Marketing";

const schema = z.object({
  type: z.enum(["GLOBAL_BANNER", "COUPON", "FLASH_SALE"]),
  title: z.string().min(2),
  code: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  discountValue: z.number().min(0).optional(),
  minPurchaseAmount: z.number().min(0).optional(),
  bannerMessage: z.string().optional(),
  bannerCtaLink: z.string().optional(),
  bannerBgColor: z.string().optional(),
  bannerTextColor: z.string().optional(),
  isActive: z.boolean().optional(),
  validFrom: z.string().optional().nullable(),
  validTo: z.string().optional().nullable(),
});

export async function GET() {
  const denied = await requireAdmin(); if (denied) return denied;
  await connectDB();
  return NextResponse.json({ items: await Marketing.find().sort({ createdAt: -1 }).lean() });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(); if (denied) return denied;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
  await connectDB();
  const d = parsed.data;
  const item = await Marketing.create({ ...d, validFrom: d.validFrom || undefined, validTo: d.validTo || undefined });
  return NextResponse.json({ item }, { status: 201 });
}

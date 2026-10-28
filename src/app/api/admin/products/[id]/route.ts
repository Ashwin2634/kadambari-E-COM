import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Product } from "@/models/Product";
import { slugify } from "@/lib/utils";
import { productSchema } from "@/lib/schemas";
import { deleteImage } from "@/lib/cloudinary";

type Ctx = { params: { id: string } };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin(); if (denied) return denied;
  const parsed = productSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid product" }, { status: 400 });
  await connectDB();
  const p = await Product.findByIdAndUpdate(params.id, { ...parsed.data, slug: slugify(parsed.data.title) }, { new: true });
  return p ? NextResponse.json({ product: p }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

/** Quick toggle: { isAvailable: boolean } */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin(); if (denied) return denied;
  const { isAvailable } = await req.json();
  await connectDB();
  const p = await Product.findByIdAndUpdate(params.id, { isAvailable: !!isAvailable }, { new: true });
  return p ? NextResponse.json({ product: p }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin(); if (denied) return denied;
  await connectDB();
  const p = await Product.findByIdAndDelete(params.id);
  if (p) await Promise.allSettled(p.images.filter((i) => i.publicId).map((i) => deleteImage(i.publicId!)));
  return NextResponse.json({ ok: true });
}

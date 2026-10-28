import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Marketing } from "@/models/Marketing";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin(); if (denied) return denied;
  const { isActive } = await req.json();
  await connectDB();
  await Marketing.findByIdAndUpdate(params.id, { isActive: !!isActive });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin(); if (denied) return denied;
  await connectDB();
  await Marketing.findByIdAndDelete(params.id);
  return NextResponse.json({ ok: true });
}

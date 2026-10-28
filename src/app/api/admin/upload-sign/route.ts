import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { signUpload } from "@/lib/cloudinary";

export async function POST() {
  const denied = await requireAdmin(); if (denied) return denied;
  return NextResponse.json(signUpload());
}

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, "register", 5, 60);
  if (limited) return limited;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Enter a name, valid email and 8+ character password" }, { status: 400 });
  await connectDB();
  const email = parsed.data.email.toLowerCase();
  if (await User.exists({ email })) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  // role is ALWAYS "user" here – admins are created via the seed script only.
  await User.create({ name: parsed.data.name, email, passwordHash: await bcrypt.hash(parsed.data.password, 12), role: "user" });
  return NextResponse.json({ ok: true }, { status: 201 });
}

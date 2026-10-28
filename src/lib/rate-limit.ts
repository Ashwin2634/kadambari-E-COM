import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const hasUpstash = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
const upstash = hasUpstash ? Redis.fromEnv() : null;
const limiters = new Map<string, Ratelimit>();
const mem = new Map<string, { n: number; reset: number }>();

/** Returns a 429 response when the caller exceeded `limit` hits per `windowSec`, else null. */
export async function rateLimit(req: NextRequest, bucket: string, limit = 10, windowSec = 60) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const key = `${bucket}:${ip}`;
  let ok = true;
  if (upstash) {
    let rl = limiters.get(bucket);
    if (!rl) {
      rl = new Ratelimit({ redis: upstash, limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`), prefix: "rl" });
      limiters.set(bucket, rl);
    }
    ok = (await rl.limit(key)).success;
  } else {
    const now = Date.now();
    const e = mem.get(key);
    if (!e || e.reset < now) mem.set(key, { n: 1, reset: now + windowSec * 1000 });
    else ok = ++e.n <= limit;
  }
  return ok ? null : NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
}

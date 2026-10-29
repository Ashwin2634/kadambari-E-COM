import clsx, { ClassValue } from "clsx";

export const cn = (...a: ClassValue[]) => clsx(a);

export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function generateOrderId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let r = "";
  for (let i = 0; i < 5; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return `SUIT-${new Date().getFullYear()}-${r}`;
}

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/** Cloudinary delivery URL with auto format/quality and a width cap. */
export function cld(url: string, w = 600) {
  if (!url || !url.includes("res.cloudinary.com")) return url;
  const clean = url.replace(/\/upload\/(?:[a-zA-Z0-9_,:]+\/)?/, "/upload/");
  return clean.replace("/upload/", `/upload/f_auto,q_auto:good,c_limit,w_${w}/`);
}

/** Serialise Mongoose docs (ObjectId/Date) into plain JSON for client components. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const plain = <T,>(d: T): any => JSON.parse(JSON.stringify(d));

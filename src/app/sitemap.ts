import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { SITE_URL } from "@/lib/utils";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let products: { slug: string; category: string; updatedAt: Date }[] = [];
  try {
    await connectDB();
    products = await Product.find({ isAvailable: true }).select("slug category updatedAt").lean();
  } catch (e) {
    console.error("Sitemap: database unavailable", e);
  }
  const cats = Array.from(new Set(products.map((p) => p.category)));
  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/track-order`, priority: 0.3 },
    ...cats.map((c) => ({ url: `${SITE_URL}/shop?category=${encodeURIComponent(c)}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${SITE_URL}/product/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}

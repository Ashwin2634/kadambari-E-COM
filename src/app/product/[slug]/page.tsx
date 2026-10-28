import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import ProductGallery from "@/components/ProductGallery";
import ProductPurchase from "@/components/ProductPurchase";
import ProductCard from "@/components/ProductCard";
import JsonLd from "@/components/JsonLd";
import { plain, SITE_URL, cld } from "@/lib/utils";

export const revalidate = 60;

async function getProduct(slug: string) {
  await connectDB();
  return plain(await Product.findOne({ slug, isAvailable: true }).lean());
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getProduct(params.slug);
  if (!p) return { title: "Not found" };
  const cover = (p.images.find((i: { isCover: boolean }) => i.isCover) ?? p.images[0])?.url;
  const title = p.seo?.metaTitle || p.title;
  const description = p.seo?.metaDescription || p.shortDescription;
  const images = cover ? [{ url: cld(cover, 1200) }] : [];
  return {
    title, description, keywords: p.seo?.keywords,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { title, description, images, type: "website" },
    twitter: { card: "summary_large_image", title, description, images: images.map((i) => i.url) },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const p = await getProduct(params.slug);
  if (!p) notFound();
  // "Complete the look": accessories first, otherwise other suits
  const related = plain(await Product.find({ isAvailable: true, _id: { $ne: p._id }, category: { $in: ["Accessories", "Shirts", "Ties"] } }).limit(4).lean());
  const more = related.length ? related : plain(await Product.find({ isAvailable: true, _id: { $ne: p._id }, category: p.category }).limit(4).lean());
  const price = p.pricing.isOnSale && p.pricing.salePrice != null ? p.pricing.salePrice : p.pricing.basePrice;
  const inStock = p.variants.some((v: { stockQuantity: number; isAvailable: boolean }) => v.isAvailable && v.stockQuantity > 0);

  const jsonLd = [
    {
      "@context": "https://schema.org", "@type": "Product", name: p.title, sku: p.sku, description: p.shortDescription,
      image: p.images.map((i: { url: string }) => i.url), category: p.category, material: p.fabric?.material,
      offers: { "@type": "Offer", priceCurrency: p.pricing.currency, price: price, url: `${SITE_URL}/product/${p.slug}`, availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", itemCondition: "https://schema.org/NewCondition" },
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: p.category, item: `${SITE_URL}/shop?category=${encodeURIComponent(p.category)}` },
        { "@type": "ListItem", position: 3, name: p.title, item: `${SITE_URL}/product/${p.slug}` },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-10">
      {jsonLd.map((d, i) => <JsonLd key={i} data={d} />)}
      <nav aria-label="Breadcrumb" className="text-xs text-ash mb-6">
        <Link href="/" className="hover:text-bone">Home</Link> / <Link href={`/shop?category=${encodeURIComponent(p.category)}`} className="hover:text-bone">{p.category}</Link> / <span className="text-bone">{p.title}</span>
      </nav>
      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12">
        <ProductGallery images={p.images} title={p.title} />
        <div className="lg:sticky lg:top-28 self-start">
          <h1 className="font-display text-5xl leading-tight">{p.title}</h1>
          <p className="text-ash mt-3 mb-6 max-w-prose">{p.shortDescription}</p>
          <ProductPurchase p={p} />
          <dl className="mt-10 border-t border-platinum text-sm">
            {[["Fit", p.fitType], ["Fabric", p.fabric?.material], ["Care", p.fabric?.care?.join(", ")], ["SKU", p.sku]].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex justify-between py-3 border-b border-platinum"><dt className="text-ash">{k}</dt><dd className="text-right">{v}</dd></div>
            ))}
          </dl>
          {p.description && <div className="prose prose-invert mt-8 text-sm text-ash leading-relaxed whitespace-pre-line">{p.description}</div>}
        </div>
      </div>
      {more.length > 0 && (
        <section className="mt-24">
          <h2 className="font-display text-3xl mb-6">Complete the look</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {more.map((r: any) => <ProductCard key={r._id} p={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}

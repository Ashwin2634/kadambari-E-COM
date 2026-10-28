import Link from "next/link";
import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import ProductCard from "@/components/ProductCard";
import { plain } from "@/lib/utils";

export const metadata: Metadata = { title: "Shop all suits", description: "Browse tuxedos, double-breasted suits, gothic blazers and velvet suits." };
export const dynamic = "force-dynamic";

const CATS = ["Tuxedos", "Double-Breasted", "Gothic Blazers", "Velvet Suits"];
const SORTS: [string, string][] = [["new", "Newest"], ["best", "Best sellers"], ["low", "Price: low to high"], ["high", "Price: high to low"]];

export default async function Shop({ searchParams }: { searchParams: { category?: string; sort?: string; q?: string } }) {
  await connectDB();
  const filter: Record<string, unknown> = { isAvailable: true };
  if (searchParams.category) filter.category = searchParams.category;
  if (searchParams.q) filter.title = { $regex: searchParams.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  const sorts: Record<string, Record<string, 1 | -1>> = { new: { createdAt: -1 }, best: { totalSold: -1 }, low: { "pricing.basePrice": 1 }, high: { "pricing.basePrice": -1 } };
  const products = plain(await Product.find(filter).sort(sorts[searchParams.sort ?? "new"] ?? sorts.new).limit(60).lean());
  const href = (o: Record<string, string | undefined>) => {
    const p = new URLSearchParams(); Object.entries({ ...searchParams, ...o }).forEach(([k, v]) => v && p.set(k, v));
    return `/shop?${p}`;
  };
  return (
    <div className="mx-auto max-w-[1500px] px-5 py-10">
      <h1 className="font-display text-5xl mb-8">{searchParams.category ?? "All suits"}</h1>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 text-sm">
        <nav className="flex flex-wrap gap-2" aria-label="Filter by category">
          <Link href={href({ category: undefined })} className={`px-3 py-1.5 border ${!searchParams.category ? "border-gold text-gold" : "border-platinum text-ash"}`}>All</Link>
          {CATS.map((c) => <Link key={c} href={href({ category: c })} className={`px-3 py-1.5 border ${searchParams.category === c ? "border-gold text-gold" : "border-platinum text-ash"}`}>{c}</Link>)}
        </nav>
        <nav className="flex gap-4 text-ash" aria-label="Sort">
          {SORTS.map(([k, l]) => <Link key={k} href={href({ sort: k })} className={(searchParams.sort ?? "new") === k ? "text-bone" : "hover:text-bone"}>{l}</Link>)}
        </nav>
      </div>
      {products.length === 0 ? <p className="text-ash py-20">No suits match this filter. <Link href="/shop" className="underline">Clear filters</Link></p> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {products.map((p: any, i: number) => <ProductCard key={p._id} p={p} priority={i < 4} />)}
        </div>
      )}
    </div>
  );
}

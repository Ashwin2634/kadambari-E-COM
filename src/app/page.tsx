import Image from "next/image";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import ProductCard from "@/components/ProductCard";
import { plain, cld } from "@/lib/utils";

export const revalidate = 120;

const CATEGORIES = ["Tuxedos", "Double-Breasted", "Gothic Blazers", "Velvet Suits"];

export default async function Home() {
  let latest: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    await connectDB();
    latest = plain(await Product.find({ isAvailable: true }).sort({ createdAt: -1 }).limit(8).lean());
  } catch (e) {
    console.error("Home: database unavailable, rendering empty state", e); // keeps `next build` working without a DB
  }
  const hero = latest[0]?.images?.[0]?.url;
  return (
    <>
      <section className="mx-auto max-w-[1500px] px-5 grid lg:grid-cols-[1.1fr_1fr] gap-10 items-end pt-14 pb-20">
        <div>
          <h1 className="font-display text-[clamp(3.2rem,9vw,8rem)] leading-[0.92] tracking-tight">Cut for the hours after midnight.</h1>
          <p className="mt-8 max-w-md text-ash leading-relaxed">Tuxedos, double-breasted suits, gothic blazers and velvet. Made after you order, in Italian wool, finished by hand.</p>
          <div className="mt-8 flex gap-3"><Link href="/shop" className="btn-primary">Shop the collection</Link><Link href="/track-order" className="btn-ghost">Track an order</Link></div>
        </div>
        <div className="relative aspect-[4/5] bg-platinum/30 border border-platinum overflow-hidden">
          {hero && <Image src={cld(hero, 900)} alt={latest[0].title} fill priority sizes="(max-width:1024px) 100vw, 45vw" className="object-cover" />}
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 grid grid-cols-2 md:grid-cols-4 gap-px bg-platinum border border-platinum" aria-label="Categories">
        {CATEGORIES.map((c) => (
          <Link key={c} href={`/shop?category=${encodeURIComponent(c)}`} className="bg-obsidian p-8 font-display text-2xl hover:bg-coal hover:text-gold transition-colors">{c}</Link>
        ))}
      </section>

      <section className="mx-auto max-w-[1500px] px-5 mt-20">
        <h2 className="font-display text-4xl mb-8">New arrivals</h2>
        {latest.length === 0 ? (
          <p className="text-ash">No products yet. Run <code>npm run seed</code> or add products in the admin panel.</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{latest.map((p: any, i: number) => <ProductCard key={p._id} p={p} priority={i < 4} />)}</div>
        )}
      </section>
    </>
  );
}

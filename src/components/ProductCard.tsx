"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatINR, cld } from "@/lib/utils";
import { useCart } from "@/store/cart";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function ProductCard({ p, priority = false }: { p: any; priority?: boolean }) {
  const [picker, setPicker] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const add = useCart((s) => s.add);
  const cover = p.images.find((i: any) => i.isCover) ?? p.images[0];
  const alt = p.images.find((i: any) => i !== cover);
  const price = p.pricing.isOnSale && p.pricing.salePrice != null ? p.pricing.salePrice : p.pricing.basePrice;
  const totalStock = p.variants.reduce((n: number, v: any) => n + (v.isAvailable ? v.stockQuantity : 0), 0);
  const badges: string[] = [];
  if (p.tags.includes("New Drop")) badges.push("New arrival");
  if (p.tags.includes("Runway")) badges.push("Runway");
  if (totalStock > 0 && totalStock <= 5) badges.push("Low stock");
  if (totalStock === 0) badges.push("Sold out");

  const sizes = Array.from(new Set(p.variants.map((v: any) => v.size))) as string[];
  const quickAdd = (size: string) => {
    const v = p.variants.find((x: any) => x.size === size && x.stockQuantity > 0 && x.isAvailable);
    if (!v) return;
    add({ productId: p._id, slug: p.slug, title: p.title, image: cover?.url ?? "", color: v.color, size, unitPrice: price, quantity: 1, maxStock: v.stockQuantity });
    setPicker(false);
  };

  return (
    <article
      className="group relative bg-coal border border-platinum"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setPicker(false)}
    >
      <Link href={`/product/${p.slug}`} className="block relative aspect-[3/4] overflow-hidden bg-platinum/30">
        {cover && (
          <Image
            src={cld(cover.url, 500)}
            alt={cover.altText || p.title}
            fill
            priority={priority}
            loading={priority ? undefined : "lazy"}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"} ${alt && isHovered ? "group-hover:opacity-0" : ""}`}
            onLoad={() => setImgLoaded(true)}
          />
        )}
        {alt && isHovered && (
          <Image
            src={cld(alt.url, 500)}
            alt={alt.altText || `${p.title} alternate view`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1">{badges.map((b) => <span key={b} className="badge">{b}</span>)}</div>
      </Link>
      <div className="p-4 flex items-start justify-between gap-3">
        <div>
          <Link href={`/product/${p.slug}`} className="font-medium hover:text-gold">{p.title}</Link>
          <p className="text-xs text-ash mt-0.5">{p.category} · {p.fitType}</p>
        </div>
        <div className="text-right text-sm shrink-0">
          <p>{formatINR(price)}</p>
          {p.pricing.isOnSale && <p className="text-xs text-ash line-through">{formatINR(p.pricing.basePrice)}</p>}
        </div>
      </div>
      {totalStock > 0 && (
        <div className="absolute inset-x-0 bottom-[72px] px-3 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all">
          {picker ? (
            <div className="bg-obsidian/95 border border-platinum p-2 flex flex-wrap gap-1.5" role="group" aria-label="Choose size">
              {sizes.map((s) => {
                const ok = p.variants.some((v: any) => v.size === s && v.stockQuantity > 0 && v.isAvailable);
                return <button key={s} disabled={!ok} onClick={() => quickAdd(s)} className="px-2.5 py-1 text-xs border border-platinum hover:border-gold disabled:opacity-30 disabled:line-through">{s}</button>;
              })}
            </div>
          ) : (
            <button onClick={() => setPicker(true)} className="btn-primary w-full !py-2">Quick add</button>
          )}
        </div>
      )}
    </article>
  );
}

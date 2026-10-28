"use client";
import { useMemo, useState } from "react";
import { useCart } from "@/store/cart";
import { formatINR } from "@/lib/utils";
import SizeGuideModal from "./SizeGuideModal";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function ProductPurchase({ p }: { p: any }) {
  const colors = useMemo(() => {
    const m = new Map<string, string>();
    p.variants.forEach((v: any) => m.set(v.color, v.colorCodeHex));
    return Array.from(m, ([name, hex]) => ({ name, hex }));
  }, [p.variants]);
  const [color, setColor] = useState(colors[0]?.name ?? "");
  const [size, setSize] = useState("");
  const add = useCart((s) => s.add);

  const variants = p.variants.filter((v: any) => v.color === color);
  const selected = variants.find((v: any) => v.size === size);
  const price = p.pricing.isOnSale && p.pricing.salePrice != null ? p.pricing.salePrice : p.pricing.basePrice;
  const cover = (p.images.find((i: any) => i.isCover) ?? p.images[0])?.url ?? "";

  const stockLabel = (v: any) => (!v.isAvailable || v.stockQuantity === 0 ? "Out of stock" : v.stockQuantity <= 3 ? `Only ${v.stockQuantity} left in ${v.size}` : null);

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-6">
        <span className="text-2xl">{formatINR(price)}</span>
        {p.pricing.isOnSale && <span className="text-ash line-through">{formatINR(p.pricing.basePrice)}</span>}
        <span className="text-xs text-ash">Inclusive of taxes</span>
      </div>

      <fieldset className="mb-6">
        <legend className="label">Colour: <span className="text-bone">{color}</span></legend>
        <div className="flex gap-2">
          {colors.map((c) => (
            <button key={c.name} onClick={() => { setColor(c.name); setSize(""); }} aria-label={c.name} aria-pressed={c.name === color}
              className={`w-9 h-9 rounded-full border-2 ${c.name === color ? "border-gold" : "border-platinum"}`} style={{ background: c.hex }} />
          ))}
        </div>
      </fieldset>

      <fieldset className="mb-2">
        <div className="flex justify-between"><legend className="label">Size</legend><SizeGuideModal /></div>
        <div className="flex flex-wrap gap-2">
          {variants.map((v: any) => {
            const out = !v.isAvailable || v.stockQuantity === 0;
            return (
              <button key={v._id} disabled={out} aria-pressed={size === v.size} onClick={() => setSize(v.size)}
                className={`min-w-14 px-3 py-2 text-sm border ${size === v.size ? "border-gold text-gold" : "border-platinum"} ${out ? "opacity-30 line-through cursor-not-allowed" : "hover:border-bone"}`}>
                {v.size}
              </button>
            );
          })}
        </div>
      </fieldset>
      <p className="h-6 text-sm text-crimson" aria-live="polite">{selected ? stockLabel(selected) : ""}</p>

      <button className="btn-crimson w-full mt-2" disabled={!selected || selected.stockQuantity === 0}
        onClick={() => selected && add({ productId: p._id, slug: p.slug, title: p.title, image: cover, color, size, unitPrice: price, quantity: 1, maxStock: selected.stockQuantity })}>
        {selected ? "Add to bag" : "Select a size"}
      </button>
    </div>
  );
}

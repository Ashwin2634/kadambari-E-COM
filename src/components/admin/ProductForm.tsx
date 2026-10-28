"use client";
import Image from "next/image";
import { useCallback, useState } from "react";
import { X, UploadCloud, Star } from "lucide-react";
import { api } from "./api";
import { slugify } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */
const SIZES = ["36R", "38R", "40R", "42R", "44R", "46R", "48R"];
const CATEGORIES = ["Tuxedos", "Double-Breasted", "Gothic Blazers", "Velvet Suits", "Accessories"];
const FITS = ["Slim Fit", "Tailored", "Oversized", "Classic"];

type Variant = { color: string; colorCodeHex: string; size: string; stockQuantity: number; isAvailable: boolean };

export default function ProductForm({ initial, onClose, onSaved }: { initial?: any; onClose: () => void; onSaved: () => void }) {
  const [p, setP] = useState<any>(() => initial ?? {
    title: "", sku: "", category: CATEGORIES[0], fitType: "Tailored", shortDescription: "", description: "",
    fabric: { material: "", care: ["Dry Clean Only"] }, pricing: { basePrice: 0, salePrice: undefined, isOnSale: false },
    variants: [], images: [], tags: [], seo: { metaTitle: "", metaDescription: "", keywords: [] }, isAvailable: false,
  });
  const [sizes, setSizes] = useState<string[]>(Array.from(new Set((initial?.variants ?? []).map((v: Variant) => v.size))) as string[]);
  const [colors, setColors] = useState<{ name: string; hex: string }[]>(
    Array.from(new Map((initial?.variants ?? []).map((v: Variant) => [v.color, v.colorCodeHex])), ([name, hex]) => ({ name, hex })) as any
  );
  const [defStock, setDefStock] = useState(5);
  const [uploading, setUploading] = useState(0);
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (patch: any) => setP((x: any) => ({ ...x, ...patch }));

  /* ---- Cloudinary signed direct upload ---- */
  const upload = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    for (const file of list) {
      setUploading((n) => n + 1);
      try {
        const sig = await api("/api/admin/upload-sign", { method: "POST" });
        const fd = new FormData();
        fd.append("file", file); fd.append("api_key", sig.apiKey); fd.append("timestamp", sig.timestamp);
        fd.append("signature", sig.signature); fd.append("folder", sig.folder);
        const r = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: "POST", body: fd });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error?.message || "Upload failed");
        setP((x: any) => ({ ...x, images: [...x.images, { publicId: d.public_id, url: d.secure_url, altText: x.title, isCover: x.images.length === 0 }] }));
      } catch (e) { setErr((e as Error).message); }
      setUploading((n) => n - 1);
    }
  }, []);
  const setCover = (i: number) => set({ images: p.images.map((im: any, k: number) => ({ ...im, isCover: k === i })) });
  const removeImage = (i: number) => { const imgs = p.images.filter((_: any, k: number) => k !== i); if (imgs.length && !imgs.some((m: any) => m.isCover)) imgs[0].isCover = true; set({ images: imgs }); };

  /* ---- Variant matrix ---- */
  const generate = () => {
    const existing = new Map<string, Variant>(p.variants.map((v: Variant) => [v.color + "|" + v.size, v]));
    const next: Variant[] = [];
    colors.filter((c) => c.name).forEach((c) => sizes.forEach((s) => next.push(existing.get(c.name + "|" + s) ?? { color: c.name, colorCodeHex: c.hex, size: s, stockQuantity: defStock, isAvailable: true })));
    set({ variants: next });
  };
  const setVariant = (i: number, patch: Partial<Variant>) => set({ variants: p.variants.map((v: Variant, k: number) => (k === i ? { ...v, ...patch } : v)) });

  async function save() {
    setBusy(true); setErr("");
    const body = {
      ...p,
      pricing: { basePrice: Number(p.pricing.basePrice), salePrice: p.pricing.isOnSale && p.pricing.salePrice ? Number(p.pricing.salePrice) : undefined, isOnSale: !!p.pricing.isOnSale },
      seo: { ...p.seo, metaTitle: p.seo.metaTitle || p.title, metaDescription: p.seo.metaDescription || p.shortDescription },
    };
    delete body._id; delete body.createdAt; delete body.updatedAt; delete body.__v; delete body.slug; delete body.totalSold;
    try {
      await api(initial ? `/api/admin/products/${initial._id}` : "/api/admin/products", { method: initial ? "PUT" : "POST", body: JSON.stringify(body) });
      onSaved();
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 overflow-y-auto p-4" role="dialog" aria-modal="true" aria-label={initial ? "Edit product" : "Add product"}>
      <div className="mx-auto max-w-4xl bg-coal border border-platinum p-6 space-y-8">
        <div className="flex justify-between"><h2 className="font-display text-3xl">{initial ? "Edit product" : "Add product"}</h2><button onClick={onClose} aria-label="Close"><X /></button></div>

        <section className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="label">Title</label><input className="field" value={p.title} onChange={(e) => set({ title: e.target.value })} />{p.title && <p className="text-xs text-ash mt-1">/product/{slugify(p.title)}</p>}</div>
          <div><label className="label">SKU</label><input className="field" value={p.sku} onChange={(e) => set({ sku: e.target.value })} /></div>
          <div><label className="label">Category</label><select className="field" value={p.category} onChange={(e) => set({ category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label className="label">Fit</label><select className="field" value={p.fitType} onChange={(e) => set({ fitType: e.target.value })}>{FITS.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label className="label">Material</label><input className="field" value={p.fabric.material} onChange={(e) => set({ fabric: { ...p.fabric, material: e.target.value } })} placeholder="100% Italian wool" /></div>
          <div className="sm:col-span-2"><label className="label">Care (comma separated)</label><input className="field" value={p.fabric.care.join(", ")} onChange={(e) => set({ fabric: { ...p.fabric, care: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } })} /></div>
          <div className="sm:col-span-2"><label className="label">Short description</label><input className="field" value={p.shortDescription} onChange={(e) => set({ shortDescription: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Full description</label><textarea rows={4} className="field" value={p.description} onChange={(e) => set({ description: e.target.value })} /></div>
          <div><label className="label">Base price (₹)</label><input type="number" min={0} className="field" value={p.pricing.basePrice} onChange={(e) => set({ pricing: { ...p.pricing, basePrice: e.target.value } })} /></div>
          <div><label className="label flex items-center gap-2"><input type="checkbox" checked={p.pricing.isOnSale} onChange={(e) => set({ pricing: { ...p.pricing, isOnSale: e.target.checked } })} /> On sale: sale price (₹)</label><input type="number" min={0} disabled={!p.pricing.isOnSale} className="field" value={p.pricing.salePrice ?? ""} onChange={(e) => set({ pricing: { ...p.pricing, salePrice: e.target.value } })} /></div>
          <div className="sm:col-span-2"><label className="label">Tags (comma separated: Bestseller, New Drop, Runway…)</label><input className="field" value={p.tags.join(", ")} onChange={(e) => set({ tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></div>
        </section>

        <section>
          <h3 className="mb-3">Photos</h3>
          <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}
            className={`border border-dashed p-8 text-center text-sm ${drag ? "border-gold bg-gold/5" : "border-platinum"}`}>
            <UploadCloud className="mx-auto mb-2 text-ash" />
            <p className="text-ash mb-3">Drop images here{uploading ? ` · uploading ${uploading}…` : ""}</p>
            <label className="btn-ghost cursor-pointer">Choose files<input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => e.target.files && upload(e.target.files)} /></label>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
            {p.images.map((im: any, i: number) => (
              <div key={im.url} className={`relative aspect-[3/4] border ${im.isCover ? "border-gold" : "border-platinum"}`}>
                <Image src={im.url} alt={im.altText || ""} fill sizes="150px" className="object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/70 p-1">
                  <button type="button" onClick={() => setCover(i)} aria-label="Set as cover" className={im.isCover ? "text-gold" : "text-ash"}><Star size={16} /></button>
                  <button type="button" onClick={() => removeImage(i)} aria-label="Remove image" className="text-crimson"><X size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3">Variant matrix</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="label">Sizes</p>
              <div className="flex flex-wrap gap-2">{SIZES.map((s) => <button key={s} type="button" aria-pressed={sizes.includes(s)} onClick={() => setSizes(sizes.includes(s) ? sizes.filter((x) => x !== s) : [...sizes, s])} className={`px-3 py-1.5 text-sm border ${sizes.includes(s) ? "border-gold text-gold" : "border-platinum text-ash"}`}>{s}</button>)}</div>
            </div>
            <div>
              <p className="label">Colours</p>
              {colors.map((c, i) => (
                <div key={i} className="flex gap-2 mb-2"><input type="color" aria-label="Colour swatch" className="w-10 h-10 bg-transparent" value={c.hex} onChange={(e) => setColors(colors.map((x, k) => k === i ? { ...x, hex: e.target.value } : x))} /><input className="field" placeholder="Colour name" value={c.name} onChange={(e) => setColors(colors.map((x, k) => k === i ? { ...x, name: e.target.value } : x))} /><button type="button" aria-label="Remove colour" onClick={() => setColors(colors.filter((_, k) => k !== i))}><X size={16} /></button></div>
              ))}
              <button type="button" className="text-sm underline text-ash" onClick={() => setColors([...colors, { name: "", hex: "#000000" }])}>Add colour</button>
            </div>
          </div>
          <div className="flex items-end gap-3 mt-4"><div><label className="label">Default stock</label><input type="number" min={0} className="field !w-28" value={defStock} onChange={(e) => setDefStock(Number(e.target.value))} /></div><button type="button" className="btn-ghost" onClick={generate}>Generate matrix</button></div>
          {p.variants.length > 0 && (
            <table className="w-full mt-4"><thead><tr><th className="th">Colour</th><th className="th">Size</th><th className="th">Stock</th><th className="th">Available</th></tr></thead>
              <tbody>{p.variants.map((v: Variant, i: number) => (
                <tr key={v.color + v.size}><td className="td"><span className="inline-block w-3 h-3 rounded-full mr-2 align-middle" style={{ background: v.colorCodeHex }} />{v.color}</td><td className="td">{v.size}</td>
                  <td className="td"><input type="number" min={0} aria-label={`Stock ${v.color} ${v.size}`} className="field !w-24 !py-1" value={v.stockQuantity} onChange={(e) => setVariant(i, { stockQuantity: Number(e.target.value) })} /></td>
                  <td className="td"><input type="checkbox" aria-label="Available" checked={v.isAvailable} onChange={(e) => setVariant(i, { isAvailable: e.target.checked })} /></td></tr>))}</tbody></table>
          )}
        </section>

        <section className="grid sm:grid-cols-2 gap-4">
          <h3 className="sm:col-span-2">SEO (defaults to title and short description)</h3>
          <div><label className="label">Meta title</label><input className="field" value={p.seo.metaTitle ?? ""} onChange={(e) => set({ seo: { ...p.seo, metaTitle: e.target.value } })} /></div>
          <div><label className="label">Keywords (comma separated)</label><input className="field" value={(p.seo.keywords ?? []).join(", ")} onChange={(e) => set({ seo: { ...p.seo, keywords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } })} /></div>
          <div className="sm:col-span-2"><label className="label">Meta description</label><input className="field" value={p.seo.metaDescription ?? ""} onChange={(e) => set({ seo: { ...p.seo, metaDescription: e.target.value } })} /></div>
        </section>

        <div className="flex items-center justify-between border-t border-platinum pt-5">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.isAvailable} onChange={(e) => set({ isAvailable: e.target.checked })} /> Published (visible in the store)</label>
          <div className="flex gap-3 items-center">{err && <span role="alert" className="text-crimson text-sm">{err}</span>}<button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-crimson" disabled={busy || uploading > 0} onClick={save}>{busy ? "Saving…" : "Save product"}</button></div>
        </div>
      </div>
    </div>
  );
}

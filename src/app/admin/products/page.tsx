"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/components/admin/api";
import ProductForm from "@/components/admin/ProductForm";
import { formatINR } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */
type SortKey = "title" | "category" | "price" | "stock";

export default function AdminProducts() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-products"], queryFn: () => api("/api/admin/products") });
  const [editing, setEditing] = useState<any | null | undefined>(undefined); // undefined = closed, null = new
  const [q, setQ] = useState(""); const [cat, setCat] = useState(""); const [stockF, setStockF] = useState("");
  const [sort, setSort] = useState<{ k: SortKey; d: 1 | -1 }>({ k: "title", d: 1 });

  const toggle = useMutation({ mutationFn: (v: { id: string; isAvailable: boolean }) => api(`/api/admin/products/${v.id}`, { method: "PATCH", body: JSON.stringify({ isAvailable: v.isAvailable }) }), onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }) });
  const del = useMutation({ mutationFn: (id: string) => api(`/api/admin/products/${id}`, { method: "DELETE" }), onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }) });

  const stock = (p: any) => p.variants.reduce((n: number, v: any) => n + v.stockQuantity, 0);
  const price = (p: any) => (p.pricing.isOnSale && p.pricing.salePrice != null ? p.pricing.salePrice : p.pricing.basePrice);
  const rows = useMemo(() => {
    let r: any[] = data?.products ?? [];
    if (q) r = r.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()));
    if (cat) r = r.filter((p) => p.category === cat);
    if (stockF === "out") r = r.filter((p) => stock(p) === 0);
    if (stockF === "low") r = r.filter((p) => stock(p) > 0 && stock(p) <= 10);
    const val = (p: any) => ({ title: p.title, category: p.category, price: price(p), stock: stock(p) }[sort.k]);
    return [...r].sort((a, b) => (val(a) > val(b) ? 1 : -1) * sort.d);
  }, [data, q, cat, stockF, sort]);
  const cats = Array.from(new Set<string>((data?.products ?? []).map((p: any) => p.category)));
  const Th = ({ k, children }: { k: SortKey; children: string }) => (
    <th className="th" aria-sort={sort.k === k ? (sort.d === 1 ? "ascending" : "descending") : "none"}><button onClick={() => setSort({ k, d: sort.k === k ? ((sort.d * -1) as 1 | -1) : 1 })}>{children}{sort.k === k ? (sort.d === 1 ? " ↑" : " ↓") : ""}</button></th>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6"><h1 className="font-display text-4xl">Products</h1><button className="btn-crimson" onClick={() => setEditing(null)}>Add product</button></div>
      <div className="flex flex-wrap gap-3 mb-6">
        <input className="field !w-64" placeholder="Search title or SKU" aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="field !w-48" aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All categories</option>{cats.map((c) => <option key={c}>{c}</option>)}</select>
        <select className="field !w-44" aria-label="Stock" value={stockF} onChange={(e) => setStockF(e.target.value)}><option value="">Any stock</option><option value="low">Low (10 or fewer)</option><option value="out">Out of stock</option></select>
      </div>
      {isLoading ? <p className="text-ash">Loading…</p> : (
        <div className="overflow-x-auto border border-platinum">
          <table className="w-full">
            <thead><tr><Th k="title">Product</Th><Th k="category">Category</Th><Th k="price">Price</Th><Th k="stock">Stock</Th><th className="th">Published</th><th className="th" /></tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p._id} className="hover:bg-coal">
                  <td className="td">{p.title}<br /><span className="text-xs text-ash">{p.sku}</span></td>
                  <td className="td text-ash">{p.category}</td>
                  <td className="td">{formatINR(price(p))}</td>
                  <td className={`td ${stock(p) === 0 ? "text-crimson" : ""}`}>{stock(p)}</td>
                  <td className="td"><button role="switch" aria-checked={p.isAvailable} aria-label={`Publish ${p.title}`} onClick={() => toggle.mutate({ id: p._id, isAvailable: !p.isAvailable })} className={`w-10 h-5 rounded-full relative transition-colors ${p.isAvailable ? "bg-gold" : "bg-platinum"}`}><span className={`absolute top-0.5 w-4 h-4 rounded-full bg-obsidian transition-all ${p.isAvailable ? "left-5" : "left-0.5"}`} /></button></td>
                  <td className="td text-right whitespace-nowrap"><button className="text-sm underline mr-4" onClick={() => setEditing(p)}>Edit</button><button className="text-sm text-crimson" onClick={() => confirm(`Delete ${p.title}?`) && del.mutate(p._id)}>Delete</button></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td className="td text-ash" colSpan={6}>No products match. Add one to get started.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {editing !== undefined && <ProductForm initial={editing ?? undefined} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); qc.invalidateQueries({ queryKey: ["admin-products"] }); }} />}
    </div>
  );
}

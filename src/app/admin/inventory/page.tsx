"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/components/admin/api";

const LOW = 5;

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function Inventory() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-products"], queryFn: () => api("/api/admin/products") });
  const [edits, setEdits] = useState<Record<string, string>>({});
  const save = useMutation({
    mutationFn: (v: { productId: string; variantId: string; stockQuantity: number }) => api("/api/admin/inventory", { method: "PATCH", body: JSON.stringify(v) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });
  const rows = (data?.products ?? []).flatMap((p: any) => p.variants.map((v: any) => ({ p, v })));
  const low = rows.filter((r: any) => r.v.stockQuantity <= LOW).length;

  return (
    <div>
      <h1 className="font-display text-4xl mb-2">Inventory</h1>
      <p className={`text-sm mb-6 ${low ? "text-crimson" : "text-ash"}`}>{low ? `${low} variants are at or below ${LOW} units.` : "All variants are well stocked."}</p>
      <div className="overflow-x-auto border border-platinum">
        <table className="w-full">
          <thead><tr><th className="th">Product</th><th className="th">SKU</th><th className="th">Colour</th><th className="th">Size</th><th className="th">Stock</th></tr></thead>
          <tbody>
            {rows.map(({ p, v }: any) => {
              const key = v._id; const val = edits[key] ?? String(v.stockQuantity); const dirty = val !== String(v.stockQuantity);
              return (
                <tr key={key} className={v.stockQuantity <= LOW ? "bg-crimson/10" : ""}>
                  <td className="td">{p.title}</td><td className="td text-ash">{p.sku}</td><td className="td">{v.color}</td><td className="td">{v.size}</td>
                  <td className="td">
                    <input aria-label={`Stock for ${p.title} ${v.color} ${v.size}`} type="number" min={0} className="field !w-24 !py-1" value={val}
                      onChange={(e) => setEdits({ ...edits, [key]: e.target.value })}
                      onBlur={() => dirty && save.mutate({ productId: p._id, variantId: v._id, stockQuantity: Number(val) }, { onSuccess: () => setEdits(({ [key]: _, ...r }) => r) })}
                      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />
                    {v.stockQuantity <= LOW && <span className="ml-2 text-xs text-crimson">{v.stockQuantity === 0 ? "Out of stock" : "Low"}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {save.isError && <p className="text-crimson text-sm mt-3">{(save.error as Error).message}</p>}
    </div>
  );
}

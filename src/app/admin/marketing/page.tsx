"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/components/admin/api";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function Marketing() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["marketing"], queryFn: () => api("/api/admin/marketing") });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["marketing"] }); qc.invalidateQueries({ queryKey: ["announcement"] }); };
  const create = useMutation({ mutationFn: (b: object) => api("/api/admin/marketing", { method: "POST", body: JSON.stringify(b) }), onSuccess: refresh });
  const toggle = useMutation({ mutationFn: (v: { id: string; isActive: boolean }) => api(`/api/admin/marketing/${v.id}`, { method: "PATCH", body: JSON.stringify({ isActive: v.isActive }) }), onSuccess: refresh });
  const del = useMutation({ mutationFn: (id: string) => api(`/api/admin/marketing/${id}`, { method: "DELETE" }), onSuccess: refresh });

  const [b, setB] = useState({ title: "Site banner", bannerMessage: "", bannerCtaLink: "/shop", bannerBgColor: "#B3122B", bannerTextColor: "#F5F5F5", validFrom: "", validTo: "" });
  const [c, setC] = useState({ code: "", discountType: "PERCENTAGE", discountValue: 10, minPurchaseAmount: 0, validTo: "" });
  const items: any[] = data?.items ?? [];

  return (
    <div className="space-y-10">
      <h1 className="font-display text-4xl">Marketing</h1>
      <div className="grid xl:grid-cols-2 gap-6">
        <form className="border border-platinum p-5 space-y-3" onSubmit={(e) => { e.preventDefault(); create.mutate({ type: "GLOBAL_BANNER", ...b, isActive: true }); }}>
          <h2>Announcement bar</h2>
          <div><label className="label">Scrolling message</label><input className="field" required value={b.bannerMessage} onChange={(e) => setB({ ...b, bannerMessage: e.target.value })} placeholder="UP TO 40% OFF FORMALWEAR | CODE: OBSIDIAN" /></div>
          <div><label className="label">Link (optional)</label><input className="field" value={b.bannerCtaLink} onChange={(e) => setB({ ...b, bannerCtaLink: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Background</label><input type="color" className="field !p-1 h-10" value={b.bannerBgColor} onChange={(e) => setB({ ...b, bannerBgColor: e.target.value })} /></div>
            <div><label className="label">Text</label><input type="color" className="field !p-1 h-10" value={b.bannerTextColor} onChange={(e) => setB({ ...b, bannerTextColor: e.target.value })} /></div>
            <div><label className="label">Starts</label><input type="datetime-local" className="field" value={b.validFrom} onChange={(e) => setB({ ...b, validFrom: e.target.value })} /></div>
            <div><label className="label">Ends</label><input type="datetime-local" className="field" value={b.validTo} onChange={(e) => setB({ ...b, validTo: e.target.value })} /></div>
          </div>
          <button className="btn-primary" disabled={create.isPending}>Publish banner</button>
        </form>

        <form className="border border-platinum p-5 space-y-3" onSubmit={(e) => { e.preventDefault(); create.mutate({ type: "COUPON", title: c.code, ...c, validTo: c.validTo || undefined, isActive: true }); setC({ ...c, code: "" }); }}>
          <h2>New coupon</h2>
          <div className="flex gap-2 items-end"><div className="flex-1"><label className="label">Code</label><input className="field" required value={c.code} onChange={(e) => setC({ ...c, code: e.target.value.toUpperCase() })} /></div>
            <button type="button" className="btn-ghost" onClick={() => setC({ ...c, code: Math.random().toString(36).slice(2, 8).toUpperCase() })}>Generate</button></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Type</label><select className="field" value={c.discountType} onChange={(e) => setC({ ...c, discountType: e.target.value })}><option value="PERCENTAGE">Percentage off</option><option value="FIXED">Flat amount off</option></select></div>
            <div><label className="label">Value</label><input type="number" min={1} className="field" value={c.discountValue} onChange={(e) => setC({ ...c, discountValue: Number(e.target.value) })} /></div>
            <div><label className="label">Minimum cart (₹)</label><input type="number" min={0} className="field" value={c.minPurchaseAmount} onChange={(e) => setC({ ...c, minPurchaseAmount: Number(e.target.value) })} /></div>
            <div><label className="label">Expires</label><input type="datetime-local" className="field" value={c.validTo} onChange={(e) => setC({ ...c, validTo: e.target.value })} /></div>
          </div>
          <button className="btn-primary" disabled={create.isPending}>Create coupon</button>
          {create.isError && <p className="text-crimson text-sm">{(create.error as Error).message}</p>}
        </form>
      </div>

      <div className="overflow-x-auto border border-platinum">
        <table className="w-full">
          <thead><tr><th className="th">Type</th><th className="th">Details</th><th className="th">Expires</th><th className="th">Active</th><th className="th" /></tr></thead>
          <tbody>
            {items.map((m) => (
              <tr key={m._id}>
                <td className="td">{m.type === "COUPON" ? "Coupon" : m.type === "GLOBAL_BANNER" ? "Banner" : "Flash sale"}</td>
                <td className="td">{m.type === "COUPON" ? <>{m.code}: {m.discountType === "PERCENTAGE" ? `${m.discountValue}% off` : `₹${m.discountValue} off`}{m.minPurchaseAmount ? ` over ₹${m.minPurchaseAmount}` : ""}</> : m.bannerMessage}</td>
                <td className="td text-ash">{m.validTo ? new Date(m.validTo).toLocaleString("en-IN") : "No end"}</td>
                <td className="td"><input type="checkbox" aria-label="Active" checked={m.isActive} onChange={(e) => toggle.mutate({ id: m._id, isActive: e.target.checked })} /></td>
                <td className="td"><button className="text-crimson text-xs" onClick={() => confirm("Delete this item?") && del.mutate(m._id)}>Delete</button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td className="td text-ash" colSpan={5}>Nothing yet. Create a banner or a coupon above.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

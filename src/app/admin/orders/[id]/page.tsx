"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/components/admin/api";
import { formatINR } from "@/lib/utils";

const STATUSES = ["ORDER_PLACED", "TAILORING", "DISPATCHED", "IN_TRANSIT", "DELIVERED", "CANCELLED"];

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-order", id], queryFn: () => api(`/api/admin/orders/${id}`) });
  const o = data?.order;
  const [form, setForm] = useState({ status: "ORDER_PLACED", courierPartner: "", trackingNumber: "", trackingUrl: "", note: "" });
  useEffect(() => { if (o) setForm((f) => ({ ...f, status: o.fulfillment.status, courierPartner: o.fulfillment.courierPartner ?? "", trackingNumber: o.fulfillment.trackingNumber ?? "", trackingUrl: o.fulfillment.trackingUrl ?? "" })); }, [o]);
  const update = useMutation({
    mutationFn: () => api(`/api/admin/orders/${id}`, { method: "PATCH", body: JSON.stringify(form) }),
    onSuccess: () => { setForm((f) => ({ ...f, note: "" })); qc.invalidateQueries({ queryKey: ["admin-order", id] }); },
  });
  if (!o) return <p className="text-ash">Loading…</p>;
  const a = o.customer.shippingAddress; const p = o.pricingSummary;
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center print:hidden">
        <h1 className="font-display text-4xl">{o.customOrderId}</h1>
        <button className="btn-ghost" onClick={() => window.print()}>Print invoice</button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 print:hidden">
        <form className="border border-platinum p-5 space-y-3" onSubmit={(e) => { e.preventDefault(); update.mutate(); }}>
          <h2>Fulfilment and tracking</h2>
          <div><label className="label">Status</label><select className="field" value={form.status} onChange={set("status")}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Courier</label><input className="field" value={form.courierPartner} onChange={set("courierPartner")} /></div>
            <div><label className="label">Tracking ID</label><input className="field" value={form.trackingNumber} onChange={set("trackingNumber")} /></div>
          </div>
          <div><label className="label">Tracking URL</label><input className="field" value={form.trackingUrl} onChange={set("trackingUrl")} /></div>
          <div><label className="label">Note shown to customer (optional)</label><input className="field" value={form.note} onChange={set("note")} /></div>
          <button className="btn-primary" disabled={update.isPending}>{update.isPending ? "Saving…" : "Update order"}</button>
          {update.isSuccess && <p className="text-gold text-sm">Updated. The customer's timeline now shows this change.</p>}
          {update.isError && <p className="text-crimson text-sm">{(update.error as Error).message}</p>}
        </form>
        <div className="border border-platinum p-5 text-sm space-y-2">
          <h2 className="text-base mb-2">Payment audit trail</h2>
          {[["Provider", o.paymentDetails.provider], ["Status", o.paymentDetails.status], ["Razorpay order", o.paymentDetails.razorpayOrderId], ["Razorpay payment", o.paymentDetails.razorpayPaymentId ?? "—"], ["Signature", o.paymentDetails.razorpaySignature ? o.paymentDetails.razorpaySignature.slice(0, 16) + "…" : "—"]].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4"><span className="text-ash">{k}</span><span className="break-all text-right">{v}</span></div>
          ))}
          <h3 className="pt-4 text-ash">Timeline</h3>
          <ul className="space-y-1">{[...o.fulfillment.timeline].reverse().map((t: any, i: number) => <li key={i}>{t.status.replace("_", " ")} <span className="text-ash">· {new Date(t.timestamp).toLocaleString("en-IN")}{t.note ? ` · ${t.note}` : ""}</span></li>)}</ul>
        </div>
      </div>

      <article className="bg-white text-black p-8 print:p-0" id="invoice" aria-label="Invoice">
        <div className="flex justify-between mb-8"><div><p className="font-display text-3xl">Obsidian Suits</p><p className="text-xs">Tax invoice</p></div><div className="text-right text-sm"><p>{o.customOrderId}</p><p>{new Date(o.createdAt).toLocaleDateString("en-IN")}</p></div></div>
        <div className="text-sm mb-6"><p className="font-semibold">Ship to</p><p>{a.fullName}</p><p>{a.street}, {a.city}, {a.state} {a.postalCode}, {a.country}</p><p>{o.customer.email} · {o.customer.phone}</p></div>
        <table className="w-full text-sm"><thead><tr className="border-b border-black text-left"><th className="py-2">Item</th><th>SKU</th><th>Qty</th><th className="text-right">Unit</th><th className="text-right">Total</th></tr></thead>
          <tbody>{o.items.map((i: any, k: number) => <tr key={k} className="border-b border-gray-300"><td className="py-2">{i.title} ({i.selectedVariant.color}, {i.selectedVariant.size})</td><td>{i.sku}</td><td>{i.quantity}</td><td className="text-right">{formatINR(i.unitPrice)}</td><td className="text-right">{formatINR(i.totalItemPrice)}</td></tr>)}</tbody></table>
        <dl className="text-sm mt-4 ml-auto w-64 space-y-1">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatINR(p.subtotal)}</dd></div>
          {p.discountAmount > 0 && <div className="flex justify-between"><dt>Discount {p.appliedCouponCode && `(${p.appliedCouponCode})`}</dt><dd>-{formatINR(p.discountAmount)}</dd></div>}
          <div className="flex justify-between"><dt>Shipping</dt><dd>{formatINR(p.shippingFee)}</dd></div>
          <div className="flex justify-between text-gray-600"><dt>GST included</dt><dd>{formatINR(p.taxAmount)}</dd></div>
          <div className="flex justify-between font-semibold text-base border-t border-black pt-2"><dt>Total paid</dt><dd>{formatINR(p.grandTotal)}</dd></div>
        </dl>
      </article>
      <style>{`@media print { header, footer, aside, [role=region] { display:none !important } body { background:#fff } }`}</style>
    </div>
  );
}

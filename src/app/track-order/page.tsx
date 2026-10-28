"use client";
import { useState } from "react";
import { formatINR } from "@/lib/utils";

const STEPS = ["ORDER_PLACED", "TAILORING", "DISPATCHED", "IN_TRANSIT", "DELIVERED"];
const LABEL: Record<string, string> = { ORDER_PLACED: "Order placed", TAILORING: "Tailoring", DISPATCHED: "Dispatched", IN_TRANSIT: "In transit", DELIVERED: "Delivered", CANCELLED: "Cancelled" };

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function TrackOrder() {
  const [orderId, setOrderId] = useState("");
  const [contact, setContact] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(""); setOrder(null);
    const r = await fetch("/api/track-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, contact }) });
    const d = await r.json(); setBusy(false);
    r.ok ? setOrder(d.order) : setErr(d.error);
  }
  const f = order?.fulfillment;
  const idx = f ? STEPS.indexOf(f.status) : -1;

  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="font-display text-5xl mb-2">Track your order</h1>
      <p className="text-ash mb-8">Enter your order number and the phone or email used at checkout.</p>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="oid">Order number</label><input id="oid" className="field" placeholder="SUIT-2026-X9B2Q" value={orderId} onChange={(e) => setOrderId(e.target.value)} required /></div>
        <div><label className="label" htmlFor="ct">Phone or email</label><input id="ct" className="field" value={contact} onChange={(e) => setContact(e.target.value)} required /></div>
        <button className="btn-primary sm:col-span-2" disabled={busy}>{busy ? "Looking up…" : "Track order"}</button>
      </form>
      {err && <p role="alert" className="text-crimson mt-4 text-sm">{err}</p>}

      {order && (
        <section className="mt-12 border border-platinum p-6" aria-live="polite">
          <div className="flex justify-between flex-wrap gap-2 mb-6">
            <div><p className="text-xs text-ash">Order</p><p className="text-lg">{order.customOrderId}</p></div>
            <div className="text-right"><p className="text-xs text-ash">Total</p><p className="text-lg">{formatINR(order.pricingSummary.grandTotal)}</p></div>
          </div>
          {f.status === "CANCELLED" ? <p className="text-crimson">This order was cancelled.</p> : (
            <ol className="relative border-l border-platinum ml-2 space-y-6">
              {STEPS.map((s, i) => {
                const entry = [...f.timeline].reverse().find((t: any) => t.status === s);
                return (
                  <li key={s} className="pl-6 relative">
                    <span className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full ${i <= idx ? "bg-gold" : "bg-platinum"}`} />
                    <p className={i <= idx ? "text-bone" : "text-ash"}>{LABEL[s]}</p>
                    {entry && <p className="text-xs text-ash">{new Date(entry.timestamp).toLocaleString("en-IN")}{entry.note ? ` · ${entry.note}` : ""}</p>}
                  </li>
                );
              })}
            </ol>
          )}
          {f.trackingNumber && (
            <p className="mt-6 text-sm">{f.courierPartner}: {f.trackingUrl ? <a className="underline text-gold" href={f.trackingUrl} target="_blank" rel="noopener noreferrer">{f.trackingNumber}</a> : f.trackingNumber}</p>
          )}
          <ul className="mt-6 pt-4 border-t border-platinum text-sm text-ash space-y-1">
            {order.items.map((i: any, k: number) => <li key={k}>{i.title} · {i.selectedVariant.color}, {i.selectedVariant.size} × {i.quantity}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
}

"use client";
import Script from "next/script";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/store/cart";
import { formatINR, cld } from "@/lib/utils";

declare global { interface Window { Razorpay: new (o: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void } } }

const FREE_SHIPPING = 9999;
const SHIPPING_FEE = 499;
const empty = { fullName: "", email: "", phone: "", street: "", city: "", state: "", postalCode: "", country: "India" };

export default function Checkout() {
  const router = useRouter();
  const { lines, coupon, setCoupon, clear } = useCart();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [f, setF] = useState(empty);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => setMounted(true), []);

  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const after = subtotal - discount;
  const shipping = after >= FREE_SHIPPING ? 0 : SHIPPING_FEE;
  const total = after + shipping;
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function applyCoupon() {
    const r = await fetch("/api/coupons/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, subtotal }) });
    const d = await r.json();
    if (!r.ok) { setMsg({ text: d.error }); setDiscount(0); setCoupon(undefined); return; }
    setDiscount(d.discountAmount); setCoupon(d.code); setMsg({ ok: true, text: `${d.code} applied: you save ${formatINR(d.discountAmount)}` });
  }

  async function pay() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/checkout/create-order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: lines.map((l) => ({ productId: l.productId, color: l.color, size: l.size, quantity: l.quantity })), couponCode: coupon, customer: f }),
      });
      const o = await res.json();
      if (!res.ok) throw new Error(o.error || "Could not start payment");
      const rzp = new window.Razorpay({
        key: o.key, amount: o.amount, currency: o.currency, order_id: o.razorpayOrderId,
        name: "Obsidian Suits", description: `Order ${o.customOrderId}`, prefill: o.prefill, theme: { color: "#B3122B" },
        handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const v = await fetch("/api/checkout/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(r) });
          const d = await v.json();
          if (!v.ok) { setMsg({ text: "Payment could not be verified. If money was deducted, it will be reconciled automatically." }); setBusy(false); return; }
          clear(); router.push(`/order-success?id=${d.customOrderId}`);
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.on("payment.failed", () => { setMsg({ text: "Payment failed. Try another method." }); setBusy(false); });
      rzp.open();
    } catch (e) {
      setMsg({ text: (e as Error).message }); setBusy(false);
    }
  }

  if (!mounted) return null;
  if (lines.length === 0) return <div className="mx-auto max-w-xl py-24 text-center"><p className="text-ash mb-6">Your bag is empty.</p><Link href="/shop" className="btn-primary">Browse suits</Link></div>;

  const valid1 = f.fullName && /\S+@\S+\.\S+/.test(f.email) && f.phone.replace(/\D/g, "").length >= 10 && f.street && f.city && f.state && f.postalCode;

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-12 grid lg:grid-cols-[1.2fr_1fr] gap-14">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div>
        <h1 className="font-display text-4xl mb-2">Checkout</h1>
        <p className="text-sm text-ash mb-8">Step {step} of 2: {step === 1 ? "Your details" : "Review and pay"}</p>

        {step === 1 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {([["fullName", "Full name", "sm:col-span-2"], ["email", "Email", ""], ["phone", "Phone", ""], ["street", "Street address", "sm:col-span-2"], ["city", "City", ""], ["state", "State", ""], ["postalCode", "PIN code", ""], ["country", "Country", ""]] as const).map(([k, l, c]) => (
              <div key={k} className={c}><label className="label" htmlFor={k}>{l}</label><input id={k} className="field" value={f[k]} onChange={set(k)} autoComplete={k === "fullName" ? "name" : k} /></div>
            ))}
            <button className="btn-primary sm:col-span-2" disabled={!valid1} onClick={() => setStep(2)}>Continue to payment</button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border border-platinum p-4 text-sm">
              <p>{f.fullName}</p><p className="text-ash">{f.street}, {f.city}, {f.state} {f.postalCode}, {f.country}</p><p className="text-ash">{f.email} · {f.phone}</p>
              <button onClick={() => setStep(1)} className="underline text-ash mt-2">Edit details</button>
            </div>
            <button className="btn-crimson w-full" disabled={busy} onClick={pay}>{busy ? "Opening payment…" : `Pay ${formatINR(total)} with Razorpay`}</button>
            <p className="text-xs text-ash">UPI, cards, netbanking and wallets are supported. Payment is confirmed on our server before your order is placed.</p>
          </div>
        )}
        {msg && <p role="alert" className={`mt-4 text-sm ${msg.ok ? "text-gold" : "text-crimson"}`}>{msg.text}</p>}
      </div>

      <aside className="border border-platinum bg-coal p-6 h-fit">
        <h2 className="font-display text-2xl mb-5">Summary</h2>
        <ul className="space-y-4 mb-6">
          {lines.map((l) => (
            <li key={l.productId + l.color + l.size} className="flex gap-3 text-sm">
              <div className="relative w-14 aspect-[3/4] bg-platinum shrink-0">{l.image && <Image src={l.image} alt="" fill sizes="56px" className="object-cover" />}</div>
              <div className="flex-1"><p>{l.title}</p><p className="text-ash">{l.color} · {l.size} · Qty {l.quantity}</p></div>
              <p>{formatINR(l.unitPrice * l.quantity)}</p>
            </li>
          ))}
        </ul>
        <div className="flex gap-2 mb-2"><input className="field" placeholder="Coupon code" aria-label="Coupon code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} /><button className="btn-ghost !px-4" onClick={applyCoupon} disabled={!code}>Apply</button></div>
        <dl className="text-sm space-y-2 mt-5 pt-5 border-t border-platinum">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatINR(subtotal)}</dd></div>
          {discount > 0 && <div className="flex justify-between text-gold"><dt>Discount</dt><dd>-{formatINR(discount)}</dd></div>}
          <div className="flex justify-between"><dt>Shipping</dt><dd>{shipping === 0 ? "Free" : formatINR(shipping)}</dd></div>
          <div className="flex justify-between text-lg pt-3 border-t border-platinum"><dt>Total</dt><dd>{formatINR(total)}</dd></div>
          <p className="text-xs text-ash">Includes GST. The final amount is confirmed by our server.</p>
        </dl>
      </aside>
    </div>
  );
}

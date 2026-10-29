"use client";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/store/cart";
import { formatINR, cld } from "@/lib/utils";

const FREE_SHIPPING = 9999;

export default function CartDrawer() {
  const { lines, isOpen, setOpen, setQty, remove } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);
  if (!mounted) return null;

  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const remaining = Math.max(0, FREE_SHIPPING - subtotal);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div key="bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/70" onClick={() => setOpen(false)} />
          <motion.aside key="panel" role="dialog" aria-modal="true" aria-label="Shopping cart"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.28 }}
            className="fixed right-0 top-0 bottom-0 z-[70] w-full max-w-md bg-coal border-l border-platinum flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-platinum">
              <h2 className="font-display text-2xl">Your bag</h2>
              <button onClick={() => setOpen(false)} aria-label="Close cart"><X /></button>
            </div>

            <div className="px-5 py-4 border-b border-platinum text-sm">
              <p className="mb-2">{remaining > 0 ? <>Add <b className="text-gold">{formatINR(remaining)}</b> for free shipping</> : "You've unlocked free shipping"}</p>
              <div className="h-1 bg-platinum"><div className="h-1 bg-gold transition-all" style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING) * 100)}%` }} /></div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {lines.length === 0 && (
                <div className="text-ash text-sm pt-10 text-center">
                  <p className="mb-4">Your bag is empty.</p>
                  <Link href="/shop" onClick={() => setOpen(false)} className="btn-ghost">Browse suits</Link>
                </div>
              )}
              {lines.map((l) => (
                <div key={l.productId + l.color + l.size} className="flex gap-4">
                  <div className="relative w-20 aspect-[3/4] bg-platinum shrink-0">{l.image && <Image src={l.image} alt={l.title} fill sizes="80px" className="object-cover" />}</div>
                  <div className="flex-1 text-sm">
                    <Link href={`/product/${l.slug}`} onClick={() => setOpen(false)} className="font-medium hover:text-gold">{l.title}</Link>
                    <p className="text-ash">{l.color} · {l.size}</p>
                    <p className="mt-1">{formatINR(l.unitPrice)}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center border border-platinum">
                        <button aria-label="Decrease quantity" className="p-1.5" onClick={() => setQty(l, l.quantity - 1)}><Minus size={14} /></button>
                        <span className="w-8 text-center">{l.quantity}</span>
                        <button aria-label="Increase quantity" className="p-1.5" onClick={() => setQty(l, l.quantity + 1)}><Plus size={14} /></button>
                      </div>
                      <button onClick={() => remove(l)} className="text-xs text-ash hover:text-crimson">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {lines.length > 0 && (
              <div className="p-5 border-t border-platinum space-y-3">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
                <p className="text-xs text-ash">Taxes included. Shipping and coupons are applied at checkout.</p>
                <Link href="/checkout" onClick={() => setOpen(false)} className="btn-crimson w-full">Checkout</Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  productId: string; slug: string; title: string; image: string;
  color: string; size: string; unitPrice: number; quantity: number; maxStock: number;
};
const same = (a: CartLine, b: { productId: string; color: string; size: string }) =>
  a.productId === b.productId && a.color === b.color && a.size === b.size;

type State = {
  lines: CartLine[]; isOpen: boolean; coupon?: string;
  add: (l: CartLine) => void;
  setQty: (l: CartLine, q: number) => void;
  remove: (l: CartLine) => void;
  clear: () => void;
  setOpen: (o: boolean) => void;
  setCoupon: (c?: string) => void;
  subtotal: () => number;
  count: () => number;
};

export const useCart = create<State>()(
  persist(
    (set, get) => ({
      lines: [], isOpen: false,
      add: (l) => set((s) => {
        const ex = s.lines.find((x) => same(x, l));
        const lines = ex
          ? s.lines.map((x) => (same(x, l) ? { ...x, quantity: Math.min(x.quantity + l.quantity, x.maxStock) } : x))
          : [...s.lines, l];
        return { lines, isOpen: true };
      }),
      setQty: (l, q) => set((s) => ({
        lines: s.lines.map((x) => (same(x, l) ? { ...x, quantity: Math.max(1, Math.min(q, x.maxStock)) } : x)),
      })),
      remove: (l) => set((s) => ({ lines: s.lines.filter((x) => !same(x, l)) })),
      clear: () => set({ lines: [], coupon: undefined }),
      setOpen: (isOpen) => set({ isOpen }),
      setCoupon: (coupon) => set({ coupon }),
      subtotal: () => get().lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
      count: () => get().lines.reduce((s, l) => s + l.quantity, 0),
    }),
    { name: "obsidian-cart", partialize: (s) => ({ lines: s.lines, coupon: s.coupon }) }
  )
);

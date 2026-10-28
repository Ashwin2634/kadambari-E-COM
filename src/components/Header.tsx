"use client";
import Link from "next/link";
import { ShoppingBag, User, Search } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useCart } from "@/store/cart";

export default function Header() {
  const { data: session } = useSession();
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.quantity, 0));
  const setOpen = useCart((s) => s.setOpen);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const nav = [["Shop all", "/shop"], ["Tuxedos", "/shop?category=Tuxedos"], ["Double-breasted", "/shop?category=Double-Breasted"], ["Gothic blazers", "/shop?category=Gothic%20Blazers"], ["Velvet", "/shop?category=Velvet%20Suits"]];
  return (
    <header className="sticky top-[32px] z-40 bg-obsidian/90 backdrop-blur border-b border-platinum">
      <div className="mx-auto max-w-[1500px] flex items-center justify-between px-5 h-16">
        <Link href="/" className="font-display text-2xl tracking-tight">Obsidian</Link>
        <nav aria-label="Primary" className="hidden lg:flex gap-8 text-sm text-ash">
          {nav.map(([l, h]) => <Link key={h} href={h} className="hover:text-bone transition-colors">{l}</Link>)}
          <Link href="/track-order" className="hover:text-bone transition-colors">Track order</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/shop" aria-label="Search the shop" className="hover:text-gold"><Search size={19} /></Link>
          {session?.user ? (
            <div className="flex items-center gap-3 text-sm">
              {session.user.role === "admin" && <Link href="/admin" className="text-gold">Admin</Link>}
              <button onClick={() => signOut({ callbackUrl: "/" })} className="text-ash hover:text-bone">Sign out</button>
            </div>
          ) : (
            <Link href="/login" aria-label="Sign in" className="hover:text-gold"><User size={19} /></Link>
          )}
          <button onClick={() => setOpen(true)} aria-label={`Open cart, ${mounted ? count : 0} items`} className="relative hover:text-gold">
            <ShoppingBag size={20} />
            {mounted && count > 0 && <span className="absolute -top-2 -right-2 bg-crimson text-[10px] rounded-full w-4 h-4 grid place-items-center">{count}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}

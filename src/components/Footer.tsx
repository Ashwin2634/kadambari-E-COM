import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-platinum mt-24">
      <div className="mx-auto max-w-[1500px] px-5 py-14 grid gap-10 md:grid-cols-3 text-sm text-ash">
        <div>
          <p className="font-display text-3xl text-bone mb-3">Obsidian</p>
          <p className="max-w-xs">Suits cut in small batches, in wool and velvet that hold a shape after midnight.</p>
        </div>
        <ul className="space-y-2">
          <li><Link href="/shop" className="hover:text-bone">Shop all</Link></li>
          <li><Link href="/track-order" className="hover:text-bone">Track your order</Link></li>
          <li><Link href="/login" className="hover:text-bone">Account</Link></li>
        </ul>
        <p>Dry clean only. Free shipping over ₹9,999. Every suit is tailored after your order is placed.</p>
      </div>
      <p className="text-center text-xs text-ash pb-8">© {new Date().getFullYear()} Obsidian Suits</p>
    </footer>
  );
}

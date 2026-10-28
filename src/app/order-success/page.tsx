import Link from "next/link";

export const metadata = { title: "Order confirmed", robots: { index: false } };

export default function Success({ searchParams }: { searchParams: { id?: string } }) {
  return (
    <div className="mx-auto max-w-xl py-24 px-5 text-center">
      <h1 className="font-display text-5xl mb-4">Order confirmed</h1>
      <p className="text-ash mb-2">Your order number is</p>
      <p className="text-2xl text-gold mb-6 select-all">{searchParams.id ?? "—"}</p>
      <p className="text-ash mb-8">We've emailed your receipt. Tailoring starts now. Use your order number with your phone or email to follow progress.</p>
      <div className="flex justify-center gap-3"><Link href="/track-order" className="btn-primary">Track order</Link><Link href="/shop" className="btn-ghost">Keep shopping</Link></div>
    </div>
  );
}

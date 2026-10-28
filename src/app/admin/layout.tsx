import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Providers from "../providers";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

const NAV = [["Dashboard", "/admin"], ["Products", "/admin/products"], ["Inventory", "/admin/inventory"], ["Orders", "/admin/orders"], ["Marketing", "/admin/marketing"]];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Defence in depth: middleware already gates /admin, this re-checks on the server.
  const s = await getSession();
  if (!s?.user || s.user.role !== "admin") redirect("/login?error=forbidden");
  return (
    <div className="mx-auto max-w-[1500px] px-5 py-8 grid md:grid-cols-[200px_1fr] gap-8">
      <aside className="md:sticky md:top-32 self-start">
        <p className="font-display text-2xl mb-4">Back office</p>
        <nav className="flex md:flex-col gap-1 text-sm overflow-x-auto" aria-label="Admin">
          {NAV.map(([l, h]) => <Link key={h} href={h} className="px-3 py-2 text-ash hover:text-bone hover:bg-coal border-l border-platinum whitespace-nowrap">{l}</Link>)}
        </nav>
      </aside>
      <section className="min-w-0"><Providers>{children}</Providers></section>
    </div>
  );
}

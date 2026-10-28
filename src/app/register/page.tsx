"use client";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Register() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const r = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    if (!r.ok) { setErr((await r.json()).error); return setBusy(false); }
    await signIn("credentials", { email: f.email, password: f.password, redirect: false });
    router.push("/"); router.refresh();
  }
  return (
    <div className="mx-auto max-w-sm px-5 py-20">
      <h1 className="font-display text-4xl mb-8">Create account</h1>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label" htmlFor="n">Name</label><input id="n" className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required autoComplete="name" /></div>
        <div><label className="label" htmlFor="e">Email</label><input id="e" type="email" className="field" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required autoComplete="email" /></div>
        <div><label className="label" htmlFor="p">Password (8+ characters)</label><input id="p" type="password" className="field" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required minLength={8} autoComplete="new-password" /></div>
        {err && <p role="alert" className="text-crimson text-sm">{err}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
        <p className="text-sm text-ash">Already registered? <Link href="/login" className="underline">Sign in</Link></p>
      </form>
    </div>
  );
}

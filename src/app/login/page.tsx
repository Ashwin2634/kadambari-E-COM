"use client";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function Form() {
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(sp.get("error") === "forbidden" ? "Admin access only. Sign in with an admin account." : "");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const r = await signIn("credentials", { email, password, redirect: false });
    setBusy(false);
    if (r?.error) return setErr("Email or password is incorrect");
    router.push(sp.get("callbackUrl") || "/"); router.refresh();
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div><label className="label" htmlFor="e">Email</label><input id="e" type="email" className="field" value={email} onChange={(x) => setEmail(x.target.value)} required autoComplete="email" /></div>
      <div><label className="label" htmlFor="p">Password</label><input id="p" type="password" className="field" value={password} onChange={(x) => setPassword(x.target.value)} required autoComplete="current-password" /></div>
      {err && <p role="alert" className="text-crimson text-sm">{err}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      <p className="text-sm text-ash">New here? <Link href="/register" className="underline">Create an account</Link></p>
    </form>
  );
}

export default function Login() {
  return <div className="mx-auto max-w-sm px-5 py-20"><h1 className="font-display text-4xl mb-8">Sign in</h1><Suspense><Form /></Suspense></div>;
}

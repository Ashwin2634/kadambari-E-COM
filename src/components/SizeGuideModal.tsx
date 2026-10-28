"use client";
import { useState } from "react";
import { X } from "lucide-react";

const ROWS = [
  // size, chest, waist, shoulder, sleeve (inches)
  ["36R", 36, 30, 17.0, 24.5], ["38R", 38, 32, 17.5, 25.0], ["40R", 40, 34, 18.0, 25.5],
  ["42R", 42, 36, 18.5, 26.0], ["44R", 44, 38, 19.0, 26.5], ["46R", 46, 40, 19.5, 27.0], ["48R", 48, 42, 20.0, 27.5],
] as const;

export default function SizeGuideModal() {
  const [open, setOpen] = useState(false);
  const [unit, setUnit] = useState<"in" | "cm">("in");
  const v = (n: number) => (unit === "in" ? n : Math.round(n * 2.54 * 10) / 10);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-xs underline text-ash hover:text-bone">Size guide</button>
      {open && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label="Suit size guide" onClick={() => setOpen(false)}>
          <div className="bg-coal border border-platinum w-full max-w-xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display text-2xl">Suit size guide</h3>
              <button onClick={() => setOpen(false)} aria-label="Close size guide"><X /></button>
            </div>
            <div className="flex gap-2 mb-4 text-xs">
              {(["in", "cm"] as const).map((u) => (
                <button key={u} onClick={() => setUnit(u)} className={`px-3 py-1 border ${unit === u ? "border-gold text-gold" : "border-platinum text-ash"}`}>{u === "in" ? "Inches" : "Centimetres"}</button>
              ))}
            </div>
            <table className="w-full text-sm">
              <thead><tr><th className="th">Size</th><th className="th">Chest</th><th className="th">Waist</th><th className="th">Shoulder</th><th className="th">Sleeve</th></tr></thead>
              <tbody>{ROWS.map(([s, c, w, sh, sl]) => <tr key={s}><td className="td">{s}</td><td className="td">{v(c)}</td><td className="td">{v(w)}</td><td className="td">{v(sh)}</td><td className="td">{v(sl)}</td></tr>)}</tbody>
            </table>
            <p className="text-xs text-ash mt-4">Measure your chest under the arms at the fullest point. Between sizes? Take the larger one; we can alter the sleeves and waist on request.</p>
          </div>
        </div>
      )}
    </>
  );
}

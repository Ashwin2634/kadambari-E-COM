"use client";
import Image from "next/image";
import { useState } from "react";
import { cld } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function ProductGallery({ images, title }: { images: any[]; title: string }) {
  const [active, setActive] = useState(Math.max(0, images.findIndex((i) => i.isCover)));
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  if (!images.length) return <div className="aspect-[3/4] bg-platinum" />;
  const img = images[active];
  return (
    <div className="grid grid-cols-[72px_1fr] gap-3">
      <div className="flex flex-col gap-3" role="tablist" aria-label="Product images">
        {images.map((im, i) => (
          <button key={i} role="tab" aria-selected={i === active} onClick={() => setActive(i)} className={`relative aspect-[3/4] border ${i === active ? "border-gold" : "border-platinum"}`}>
            <Image src={cld(im.url, 150)} alt={im.altText || `${title} view ${i + 1}`} fill sizes="72px" className="object-cover" />
          </button>
        ))}
      </div>
      <div
        className="relative aspect-[3/4] overflow-hidden bg-platinum/30 cursor-zoom-in"
        onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }); }}
        onMouseLeave={() => setZoom(null)}
      >
        <Image src={cld(img.url, 1000)} alt={img.altText || title} fill priority sizes="(max-width:1024px) 80vw, 45vw"
          className="object-cover transition-transform duration-150"
          style={zoom ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined} />
      </div>
    </div>
  );
}

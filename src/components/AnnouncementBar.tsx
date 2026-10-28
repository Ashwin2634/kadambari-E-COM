"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

type Banner = { bannerMessage?: string; bannerCtaLink?: string; bannerBgColor?: string; bannerTextColor?: string };

const FALLBACK: Banner = {
  bannerMessage: "UP TO 40% OFF FORMALWEAR  |  CODE: OBSIDIAN  |  FREE WORLDWIDE SHIPPING OVER ₹9,999",
  bannerBgColor: "#B3122B",
  bannerTextColor: "#F5F5F5",
};

export default function AnnouncementBar() {
  const { data } = useQuery({
    queryKey: ["announcement"],
    queryFn: async () => (await (await fetch("/api/announcement")).json()).banner as Banner | null,
  });
  const b = data ?? FALLBACK;
  const text = (b.bannerMessage ?? FALLBACK.bannerMessage!) + "      ·      ";
  const row = Array.from({ length: 6 }, (_, i) => <span key={i} className="px-4">{text}</span>);
  const inner = (
    <div className="flex w-max animate-marquee whitespace-nowrap" aria-hidden>
      <div className="flex">{row}</div>
      <div className="flex">{row}</div>
    </div>
  );
  return (
    <div className="sticky top-0 z-50 overflow-hidden text-xs py-2" style={{ background: b.bannerBgColor, color: b.bannerTextColor }} role="region" aria-label="Announcements">
      <span className="sr-only">{b.bannerMessage}</span>
      {b.bannerCtaLink ? <Link href={b.bannerCtaLink}>{inner}</Link> : inner}
    </div>
  );
}

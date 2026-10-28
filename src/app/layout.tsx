import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Manrope } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import AnnouncementBar from "@/components/AnnouncementBar";
import Header from "@/components/Header";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { SITE_URL } from "@/lib/utils";

const display = Bodoni_Moda({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Manrope({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Obsidian Suits – Bespoke & Luxury Suits", template: "%s | Obsidian Suits" },
  description: "Tailored tuxedos, double-breasted suits, gothic blazers and velvet suits, cut in Italian wool and finished by hand.",
  openGraph: { type: "website", siteName: "Obsidian Suits", url: SITE_URL },
  twitter: { card: "summary_large_image" },
};
export const viewport: Viewport = { themeColor: "#0B0B0B" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: "Obsidian Suits", url: SITE_URL }} />
        <Providers>
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-bone focus:text-obsidian focus:p-3">Skip to content</a>
          <AnnouncementBar />
          <Header />
          <main id="main" className="min-h-[70vh]">{children}</main>
          <Footer />
          <CartDrawer />
        </Providers>
      </body>
    </html>
  );
}

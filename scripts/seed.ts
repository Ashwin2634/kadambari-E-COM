/**
 * Seeds an admin user, sample suits, a banner and a coupon.
 * Usage: npm run seed   (reads .env.local / .env)
 */
import { config } from "dotenv";
config({ path: ".env.local" }); config();
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../src/models/User";
import { Product } from "../src/models/Product";
import { Marketing } from "../src/models/Marketing";

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;
const sizes = ["38R", "40R", "42R", "44R"];
const mk = (color: string, hex: string, stock = [6, 8, 5, 3]) => sizes.map((size, i) => ({ color, colorCodeHex: hex, size, stockQuantity: stock[i], isAvailable: true }));
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const items = [
  { title: "Obsidian Peak Tuxedo", category: "Tuxedos", fitType: "Slim Fit", price: 34999, sale: 27999, tags: ["Bestseller", "New Drop"], v: mk("Black", "#0B0B0B"), photo: "photo-1507679799987-c73779587ccf", mat: "100% Italian Wool" },
  { title: "Midnight Double-Breasted", category: "Double-Breasted", fitType: "Tailored", price: 38999, tags: ["Runway"], v: mk("Midnight Navy", "#14213D"), photo: "photo-1594938298603-c8148c4dae35", mat: "Wool-Silk Blend" },
  { title: "Requiem Gothic Blazer", category: "Gothic Blazers", fitType: "Oversized", price: 24999, tags: ["Editorial", "Gothic Luxury"], v: mk("Ash Black", "#1A1A1A", [2, 3, 1, 0]), photo: "photo-1593030761757-71fae45fa0e7", mat: "Wool Crepe" },
  { title: "Crimson Velvet Suit", category: "Velvet Suits", fitType: "Tailored", price: 42999, sale: 36999, tags: ["New Drop", "Runway"], v: [...mk("Crimson", "#8B0A1A"), ...mk("Emerald", "#0B4F3C", [4, 4, 2, 2])], photo: "photo-1617137968427-85924c800a22", mat: "Cotton Velvet" },
  { title: "Noir Shawl Tuxedo", category: "Tuxedos", fitType: "Classic", price: 31999, tags: ["Bestseller"], v: mk("Black", "#0B0B0B"), photo: "photo-1598808503746-f34c53b9323e", mat: "Barathea Wool" },
  { title: "Slate Windsor Double-Breasted", category: "Double-Breasted", fitType: "Slim Fit", price: 36999, tags: [], v: mk("Slate", "#4A4E57"), photo: "photo-1553484771-371a605b060b", mat: "Super 120s Wool" },
  { title: "Silk Lapel Pin", category: "Accessories", fitType: "One size", price: 1999, tags: ["Editorial"], v: [{ color: "Gold", colorCodeHex: "#C8A24A", size: "OS", stockQuantity: 40, isAvailable: true }], photo: "photo-1507679799987-c73779587ccf", mat: "Brass, gold plated" },
  { title: "Black Silk Tie", category: "Accessories", fitType: "One size", price: 2999, tags: [], v: [{ color: "Black", colorCodeHex: "#0B0B0B", size: "OS", stockQuantity: 25, isAvailable: true }], photo: "photo-1594938298603-c8148c4dae35", mat: "100% Silk" },
];

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("Set MONGODB_URI first");
  await mongoose.connect(process.env.MONGODB_URI);

  const email = (process.env.SEED_ADMIN_EMAIL || "admin@obsidian.test").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe!2026";
  await User.findOneAndUpdate({ email }, { name: "Store Admin", email, role: "admin", passwordHash: await bcrypt.hash(password, 12) }, { upsert: true });

  for (const [i, it] of items.entries()) {
    const url = img(it.photo);
    await Product.findOneAndUpdate({ slug: slug(it.title) }, {
      title: it.title, slug: slug(it.title), sku: `OBS-${String(i + 1).padStart(3, "0")}`, category: it.category, fitType: it.fitType,
      shortDescription: `${it.title}: ${it.fitType.toLowerCase()} cut in ${it.mat.toLowerCase()}.`,
      description: `Made to order and finished by hand.\n\nFabric: ${it.mat}. Fully canvassed jacket, working cuffs, half-lined interior.`,
      fabric: { material: it.mat, care: ["Dry Clean Only", "Do not tumble dry"] },
      pricing: { basePrice: it.price, salePrice: it.sale, isOnSale: !!it.sale, currency: "INR" },
      variants: it.v, images: [{ publicId: "", url, altText: it.title, isCover: true }, { publicId: "", url: img("photo-1490578474895-699cd4e2cf59"), altText: `${it.title} detail`, isCover: false }],
      seo: { metaTitle: `${it.title} | Obsidian Suits`, metaDescription: `Buy the ${it.title}, a ${it.fitType.toLowerCase()} ${it.category.toLowerCase()} in ${it.mat}.`, keywords: [it.category, "luxury suit", "bespoke"] },
      tags: it.tags, isAvailable: true,
    }, { upsert: true });
  }

  if (!(await Marketing.exists({ type: "GLOBAL_BANNER" })))
    await Marketing.create({ type: "GLOBAL_BANNER", title: "Launch banner", bannerMessage: "UP TO 40% OFF FORMALWEAR  |  CODE: OBSIDIAN  |  FREE WORLDWIDE SHIPPING OVER ₹9,999", bannerCtaLink: "/shop", isActive: true });
  if (!(await Marketing.exists({ code: "OBSIDIAN" })))
    await Marketing.create({ type: "COUPON", title: "OBSIDIAN", code: "OBSIDIAN", discountType: "PERCENTAGE", discountValue: 10, minPurchaseAmount: 5000, isActive: true });

  console.log(`Seeded. Admin login: ${email} / ${password}`);
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });

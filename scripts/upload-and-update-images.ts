import { config } from "dotenv";
config({ path: ".env.local" });
config();
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { Product } from "../src/models/Product";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const productSlugs = [
  "obsidian-peak-tuxedo",
  "midnight-double-breasted",
  "requiem-gothic-blazer",
  "crimson-velvet-suit",
  "noir-shawl-tuxedo",
  "slate-windsor-double-breasted",
  "silk-lapel-pin",
  "black-silk-tie",
];

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("Set MONGODB_URI first");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  const productsDir = path.resolve("Products");
  const publicDir = path.resolve("public", "products");

  const results: Record<string, any[]> = {};

  for (let i = 1; i <= 8; i++) {
    const folderPath = path.join(productsDir, String(i));
    if (!fs.existsSync(folderPath)) {
      console.warn(`Folder ${folderPath} does not exist, skipping.`);
      continue;
    }

    const publicFolder = path.join(publicDir, String(i));
    fs.mkdirSync(publicFolder, { recursive: true });

    const files = fs.readdirSync(folderPath);
    // Filter duplicate files (e.g. "xxx (1).webp" when "xxx.webp" exists)
    const uniqueFiles = files.filter((f) => {
      const ext = path.extname(f).toLowerCase();
      if (![".webp", ".jpg", ".jpeg", ".png"].includes(ext)) return false;
      if (f.includes("(1)")) {
        const counterpart = f.replace(" (1)", "");
        if (files.includes(counterpart)) {
          console.log(`Skipping duplicate file: ${f} in favor of ${counterpart}`);
          return false;
        }
      }
      return true;
    });

    console.log(`\nProduct ${i}: uploading ${uniqueFiles.length} images...`);
    const uploadedImages = [];

    for (let idx = 0; idx < uniqueFiles.length; idx++) {
      const file = uniqueFiles[idx];
      const filePath = path.join(folderPath, file);

      // Copy to public/products/<id>/ as well
      const destPath = path.join(publicFolder, file);
      fs.copyFileSync(filePath, destPath);

      console.log(`  Uploading [${idx + 1}/${uniqueFiles.length}]: ${file}`);
      const uploadRes = await cloudinary.uploader.upload(filePath, {
        folder: `obsidian-suits/products/product-${i}`,
        resource_type: "image",
      });

      uploadedImages.push({
        publicId: uploadRes.public_id,
        url: uploadRes.secure_url,
        altText: `Product ${i} view ${idx + 1}`,
        isCover: idx === 0,
      });
    }

    const targetSlug = productSlugs[i - 1];
    const updated = await Product.findOneAndUpdate(
      { slug: targetSlug },
      { $set: { images: uploadedImages } },
      { new: true }
    );

    if (updated) {
      console.log(`✓ Updated Product "${updated.title}" (${targetSlug}) with ${uploadedImages.length} images.`);
    } else {
      console.warn(`! Product with slug "${targetSlug}" not found in DB.`);
    }

    results[targetSlug] = uploadedImages;
  }

  // Save manifest to scripts/seeded-images.json for reference
  fs.writeFileSync(
    path.resolve("scripts", "seeded-images.json"),
    JSON.stringify(results, null, 2)
  );
  console.log("\nImage URLs saved to scripts/seeded-images.json");

  await mongoose.disconnect();
  console.log("Done!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

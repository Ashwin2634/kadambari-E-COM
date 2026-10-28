import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const VariantSchema = new Schema(
  {
    color: { type: String, required: true },
    colorCodeHex: { type: String, default: "#000000" },
    size: { type: String, required: true },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: true }
);

const ImageSchema = new Schema(
  {
    publicId: { type: String, default: "" },
    url: { type: String, required: true },
    altText: { type: String, default: "" },
    isCover: { type: Boolean, default: false },
  },
  { _id: false }
);

const ProductSchema = new Schema(
  {
    title: { type: String, required: true, unique: true, index: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    sku: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    shortDescription: { type: String, default: "" },
    category: { type: String, required: true, index: true },
    fitType: { type: String, default: "Tailored" },
    fabric: {
      material: { type: String, default: "" },
      care: { type: [String], default: [] },
    },
    pricing: {
      basePrice: { type: Number, required: true, min: 0 },
      salePrice: { type: Number, min: 0 },
      isOnSale: { type: Boolean, default: false },
      currency: { type: String, default: "INR" },
    },
    variants: { type: [VariantSchema], default: [] },
    images: { type: [ImageSchema], default: [] },
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: { type: [String], default: [] },
    },
    tags: { type: [String], default: [] },
    isAvailable: { type: Boolean, default: false }, // draft / publish switch
    totalSold: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProductSchema.index({ category: 1, "pricing.basePrice": 1 });

export type ProductDoc = InferSchemaType<typeof ProductSchema> & { _id: mongoose.Types.ObjectId };
export const Product: Model<ProductDoc> =
  (mongoose.models.Product as Model<ProductDoc>) || mongoose.model<ProductDoc>("Product", ProductSchema);

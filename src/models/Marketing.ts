import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const MarketingSchema = new Schema(
  {
    type: { type: String, enum: ["GLOBAL_BANNER", "COUPON", "FLASH_SALE"], required: true, index: true },
    title: { type: String, required: true },
    code: { type: String, uppercase: true, trim: true, index: true, sparse: true },
    discountType: { type: String, enum: ["PERCENTAGE", "FIXED"] },
    discountValue: { type: Number, min: 0 },
    minPurchaseAmount: { type: Number, default: 0 },
    bannerMessage: String,
    bannerCtaLink: String,
    bannerBgColor: { type: String, default: "#B3122B" },
    bannerTextColor: { type: String, default: "#F5F5F5" },
    isActive: { type: Boolean, default: true },
    validFrom: Date,
    validTo: Date,
  },
  { timestamps: true }
);

export type MarketingDoc = InferSchemaType<typeof MarketingSchema> & { _id: mongoose.Types.ObjectId };
export const Marketing: Model<MarketingDoc> =
  (mongoose.models.Marketing as Model<MarketingDoc>) || mongoose.model<MarketingDoc>("Marketing", MarketingSchema);

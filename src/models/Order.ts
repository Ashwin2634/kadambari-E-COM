import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

export const FULFILLMENT_STATUSES = [
  "ORDER_PLACED",
  "TAILORING",
  "DISPATCHED",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
] as const;
export const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const;

const OrderSchema = new Schema(
  {
    customOrderId: { type: String, required: true, unique: true, index: true },
    customer: {
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      email: { type: String, required: true, lowercase: true, index: true },
      phone: { type: String, required: true, index: true },
      shippingAddress: {
        fullName: String,
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: { type: String, default: "India" },
      },
    },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        title: String,
        sku: String,
        selectedVariant: { color: String, size: String },
        unitPrice: Number,
        quantity: Number,
        totalItemPrice: Number,
        imageUrl: String,
        _id: false,
      },
    ],
    pricingSummary: {
      subtotal: Number,
      discountAmount: { type: Number, default: 0 },
      appliedCouponCode: String,
      taxAmount: Number,
      shippingFee: Number,
      grandTotal: Number,
    },
    paymentDetails: {
      provider: { type: String, default: "RAZORPAY" },
      razorpayOrderId: { type: String, required: true, index: true },
      razorpayPaymentId: String,
      razorpaySignature: String,
      status: { type: String, enum: PAYMENT_STATUSES, default: "PENDING" },
    },
    fulfillment: {
      status: { type: String, enum: FULFILLMENT_STATUSES, default: "ORDER_PLACED" },
      courierPartner: String,
      trackingNumber: String,
      trackingUrl: String,
      timeline: [{ status: String, timestamp: { type: Date, default: Date.now }, note: String, _id: false }],
    },
    stockDecremented: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type OrderDoc = InferSchemaType<typeof OrderSchema> & { _id: mongoose.Types.ObjectId };
export const Order: Model<OrderDoc> =
  (mongoose.models.Order as Model<OrderDoc>) || mongoose.model<OrderDoc>("Order", OrderSchema);

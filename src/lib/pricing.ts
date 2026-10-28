import { Product } from "@/models/Product";
import { Marketing } from "@/models/Marketing";

export const FREE_SHIPPING_THRESHOLD = Number(process.env.FREE_SHIPPING_THRESHOLD ?? 9999);
const SHIPPING_FEE = Number(process.env.SHIPPING_FEE ?? 499);
const GST_RATE = Number(process.env.GST_RATE ?? 0.12);

export type CartInput = { productId: string; color: string; size: string; quantity: number }[];

export class CheckoutError extends Error {}

export async function findValidCoupon(code: string, subtotal: number) {
  const now = new Date();
  const c = await Marketing.findOne({
    type: "COUPON",
    code: code.toUpperCase().trim(),
    isActive: true,
    $and: [
      { $or: [{ validFrom: null }, { validFrom: { $exists: false } }, { validFrom: { $lte: now } }] },
      { $or: [{ validTo: null }, { validTo: { $exists: false } }, { validTo: { $gte: now } }] },
    ],
  }).lean();
  if (!c) throw new CheckoutError("Coupon is invalid or expired");
  if (subtotal < (c.minPurchaseAmount ?? 0))
    throw new CheckoutError(`Add items worth ₹${c.minPurchaseAmount} to use this coupon`);
  const raw = c.discountType === "PERCENTAGE" ? (subtotal * (c.discountValue ?? 0)) / 100 : c.discountValue ?? 0;
  return { code: c.code!, discountAmount: Math.min(Math.round(raw), subtotal) };
}

/** Authoritative server-side pricing. Never trusts client prices. */
export async function priceCart(cart: CartInput, couponCode?: string) {
  if (!cart.length) throw new CheckoutError("Cart is empty");
  const products = await Product.find({ _id: { $in: cart.map((i) => i.productId) }, isAvailable: true }).lean();
  const items = cart.map((line) => {
    const p = products.find((x) => String(x._id) === line.productId);
    if (!p) throw new CheckoutError("A product in your cart is no longer available");
    const v = p.variants.find((x) => x.color === line.color && x.size === line.size);
    if (!v || !v.isAvailable) throw new CheckoutError(`${p.title} (${line.color}, ${line.size}) is unavailable`);
    if (v.stockQuantity < line.quantity)
      throw new CheckoutError(`Only ${v.stockQuantity} left of ${p.title} in ${line.size}`);
    const pr = p.pricing!;
    const unitPrice = pr.isOnSale && pr.salePrice != null ? pr.salePrice : pr.basePrice;
    return {
      productId: p._id,
      title: p.title,
      sku: p.sku,
      selectedVariant: { color: line.color, size: line.size },
      unitPrice,
      quantity: line.quantity,
      totalItemPrice: unitPrice * line.quantity,
      imageUrl: (p.images.find((i) => i.isCover) ?? p.images[0])?.url ?? "",
    };
  });
  const subtotal = items.reduce((s, i) => s + i.totalItemPrice, 0);
  let discountAmount = 0;
  let appliedCouponCode: string | undefined;
  if (couponCode) {
    const c = await findValidCoupon(couponCode, subtotal);
    discountAmount = c.discountAmount;
    appliedCouponCode = c.code;
  }
  const afterDiscount = subtotal - discountAmount;
  const shippingFee = afterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const grandTotal = afterDiscount + shippingFee;
  // Prices are GST-inclusive; taxAmount is the embedded portion (for invoices).
  const taxAmount = Math.round(afterDiscount - afterDiscount / (1 + GST_RATE));
  return { items, pricingSummary: { subtotal, discountAmount, appliedCouponCode, taxAmount, shippingFee, grandTotal } };
}

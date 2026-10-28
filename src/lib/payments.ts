import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { sendReceipt } from "./mail";

/**
 * Idempotently marks an order PAID. Called by both the client verify route and the webhook,
 * whichever arrives first wins; the atomic non-PAID -> PAID transition prevents double stock decrement.
 */
export async function markOrderPaid(razorpayOrderId: string, paymentId: string, signature?: string) {
  const order = await Order.findOneAndUpdate(
    { "paymentDetails.razorpayOrderId": razorpayOrderId, "paymentDetails.status": { $ne: "PAID" } },
    {
      $set: {
        "paymentDetails.status": "PAID",
        "paymentDetails.razorpayPaymentId": paymentId,
        ...(signature ? { "paymentDetails.razorpaySignature": signature } : {}),
      },
      $push: { "fulfillment.timeline": { status: "ORDER_PLACED", timestamp: new Date(), note: "Payment received" } },
    },
    { new: true }
  );
  if (!order) return null; // already processed (or unknown)

  for (const it of order.items) {
    await Product.updateOne(
      { _id: it.productId },
      { $inc: { "variants.$[v].stockQuantity": -(it.quantity ?? 0), totalSold: it.quantity ?? 0 } },
      { arrayFilters: [{ "v.color": it.selectedVariant?.color, "v.size": it.selectedVariant?.size }] }
    );
  }
  await Order.updateOne({ _id: order._id }, { stockDecremented: true });
  sendReceipt(order.toObject()).catch((e) => console.error("receipt failed", e));
  return order;
}

export async function markOrderFailed(razorpayOrderId: string, paymentId?: string) {
  await Order.updateOne(
    { "paymentDetails.razorpayOrderId": razorpayOrderId, "paymentDetails.status": "PENDING" },
    { $set: { "paymentDetails.status": "FAILED", ...(paymentId ? { "paymentDetails.razorpayPaymentId": paymentId } : {}) } }
  );
}

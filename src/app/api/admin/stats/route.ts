import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";

export async function GET() {
  const denied = await requireAdmin(); if (denied) return denied;
  await connectDB();
  const paid = { "paymentDetails.status": "PAID" };
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const since = new Date(Date.now() - 29 * 86400000); since.setHours(0, 0, 0, 0);

  const [totals, today, daily, top, outOfStock] = await Promise.all([
    Order.aggregate([{ $match: paid }, { $group: { _id: null, revenue: { $sum: "$pricingSummary.grandTotal" }, orders: { $sum: 1 } } }]),
    Order.aggregate([{ $match: { ...paid, createdAt: { $gte: startOfDay } } }, { $group: { _id: null, revenue: { $sum: "$pricingSummary.grandTotal" } } }]),
    Order.aggregate([
      { $match: { ...paid, createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$pricingSummary.grandTotal" } } },
      { $sort: { _id: 1 } },
    ]),
    Product.find().sort({ totalSold: -1 }).limit(5).select("title totalSold").lean(),
    Product.aggregate([{ $unwind: "$variants" }, { $match: { "variants.stockQuantity": { $lte: 0 } } }, { $count: "n" }]),
  ]);

  const revenue = totals[0]?.revenue ?? 0;
  const orders = totals[0]?.orders ?? 0;
  return NextResponse.json({
    revenue, orders,
    aov: orders ? Math.round(revenue / orders) : 0,
    todaySales: today[0]?.revenue ?? 0,
    outOfStockVariants: outOfStock[0]?.n ?? 0,
    daily: daily.map((d) => ({ date: d._id, revenue: d.revenue })),
    topProducts: top.map((t) => ({ title: t.title, sold: t.totalSold })),
  });
}

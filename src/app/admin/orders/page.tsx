"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/components/admin/api";
import { formatINR } from "@/lib/utils";

const STATUS_CHIP: Record<string, string> = {
  ORDER_PLACED: "border-ash text-ash", TAILORING: "border-gold text-gold", DISPATCHED: "border-blue-400 text-blue-400",
  IN_TRANSIT: "border-blue-400 text-blue-400", DELIVERED: "border-green-500 text-green-500", CANCELLED: "border-crimson text-crimson",
};
const STATUSES = ["ORDER_PLACED", "TAILORING", "DISPATCHED", "IN_TRANSIT", "DELIVERED", "CANCELLED"];

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function Orders() {
  const [status, setStatus] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["admin-orders", status], queryFn: () => api(`/api/admin/orders${status ? `?status=${status}` : ""}`) });
  return (
    <div>
      <h1 className="font-display text-4xl mb-6">Orders</h1>
      <div className="flex flex-wrap gap-2 mb-6 text-xs">
        {["", ...STATUSES].map((s) => <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 border ${status === s ? "border-gold text-gold" : "border-platinum text-ash"}`}>{s ? s.replace("_", " ").toLowerCase() : "all"}</button>)}
      </div>
      {isLoading ? <p className="text-ash">Loading…</p> : (
        <div className="overflow-x-auto border border-platinum">
          <table className="w-full">
            <thead><tr><th className="th">Order</th><th className="th">Customer</th><th className="th">Date</th><th className="th">Total</th><th className="th">Payment</th><th className="th">Status</th></tr></thead>
            <tbody>
              {(data?.orders ?? []).map((o: any) => (
                <tr key={o._id} className="hover:bg-coal">
                  <td className="td"><Link href={`/admin/orders/${o._id}`} className="text-gold hover:underline">{o.customOrderId}</Link></td>
                  <td className="td">{o.customer.shippingAddress?.fullName}<br /><span className="text-xs text-ash">{o.customer.email}</span></td>
                  <td className="td text-ash">{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="td">{formatINR(o.pricingSummary.grandTotal)}</td>
                  <td className="td text-ash">{o.paymentDetails.status}</td>
                  <td className="td"><span className={`border px-2 py-0.5 text-xs ${STATUS_CHIP[o.fulfillment.status]}`}>{o.fulfillment.status.replace("_", " ")}</span></td>
                </tr>
              ))}
              {data?.orders?.length === 0 && <tr><td className="td text-ash" colSpan={6}>No paid orders yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

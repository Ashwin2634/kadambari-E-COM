"use client";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/components/admin/api";
import { formatINR } from "@/lib/utils";

export default function Dashboard() {
  const { data: s, isLoading, error } = useQuery({ queryKey: ["stats"], queryFn: () => api("/api/admin/stats") });
  if (isLoading) return <p className="text-ash">Loading metrics…</p>;
  if (error || !s) return <p className="text-crimson">Could not load metrics.</p>;
  const kpis = [["Gross revenue", formatINR(s.revenue)], ["Today's sales", formatINR(s.todaySales)], ["Average order value", formatINR(s.aov)], ["Total orders", s.orders], ["Out-of-stock variants", s.outOfStockVariants]];
  const tip = { contentStyle: { background: "#141414", border: "1px solid #262626", color: "#F5F5F5" } };
  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl">Dashboard</h1>
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-px bg-platinum border border-platinum">
        {kpis.map(([k, v]) => (
          <div key={k as string} className={`bg-obsidian p-5 ${k === "Out-of-stock variants" && s.outOfStockVariants > 0 ? "text-crimson" : ""}`}>
            <p className="text-xs text-ash">{k}</p><p className="text-2xl mt-1">{v}</p>
          </div>
        ))}
      </div>
      <div className="grid xl:grid-cols-2 gap-6">
        <div className="border border-platinum p-5">
          <h2 className="mb-4">Revenue, last 30 days</h2>
          <div className="h-64"><ResponsiveContainer>
            <AreaChart data={s.daily}><CartesianGrid stroke="#262626" /><XAxis dataKey="date" stroke="#8A8A8A" fontSize={11} tickFormatter={(d) => d.slice(5)} /><YAxis stroke="#8A8A8A" fontSize={11} /><Tooltip {...tip} formatter={(v: number) => formatINR(v)} />
              <Area type="monotone" dataKey="revenue" stroke="#C8A24A" fill="#C8A24A33" /></AreaChart>
          </ResponsiveContainer></div>
        </div>
        <div className="border border-platinum p-5">
          <h2 className="mb-4">Top 5 best-selling cuts</h2>
          <div className="h-64"><ResponsiveContainer>
            <BarChart data={s.topProducts} layout="vertical" margin={{ left: 40 }}><CartesianGrid stroke="#262626" /><XAxis type="number" stroke="#8A8A8A" fontSize={11} allowDecimals={false} /><YAxis type="category" dataKey="title" stroke="#8A8A8A" fontSize={11} width={130} /><Tooltip {...tip} />
              <Bar dataKey="sold" fill="#B3122B" /></BarChart>
          </ResponsiveContainer></div>
        </div>
      </div>
    </div>
  );
}

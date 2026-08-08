"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Brain,
  Zap,
  DollarSign,
  Activity,
  CheckCircle,
  Server,
  Cpu,
  TrendingUp,
} from "lucide-react";
import { getAIOpsOverview } from "@/lib/aiOpsService";

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 group hover:border-white/20 shadow-sm transition-all"
    >
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity ${color}`}
      />
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl ${color} bg-opacity-20`}>
          <Icon size={18} className="text-white" />
        </div>
        <TrendingUp size={14} className="text-emerald-400 opacity-80" />
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-xs text-white/70 mt-1 font-medium">{label}</p>
      {sub && <p className="text-xs text-white/50 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

export function AiOpsHeroBanner() {
  const { data, isLoading } = useQuery({
    queryKey: ["ai-ops-overview"],
    queryFn: getAIOpsOverview,
    refetchInterval: 30000,
  });

  const kpis = data?.kpis;

  const formatNumber = (n: number) =>
    n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
      ? `${(n / 1_000).toFixed(1)}K`
      : String(n);

  const cards = [
    {
      icon: Server,
      label: "AI Providers",
      value: isLoading ? "—" : `${kpis?.online_providers ?? 0}/${kpis?.connected_providers ?? 0}`,
      sub: "Online / Connected",
      color: "bg-emerald-500",
    },
    {
      icon: Cpu,
      label: "Active Models",
      value: isLoading ? "—" : String(kpis?.available_models ?? 0),
      sub: "Across all providers",
      color: "bg-purple-500",
    },
    {
      icon: Activity,
      label: "Monthly Requests",
      value: isLoading ? "—" : formatNumber(kpis?.monthly_requests ?? 0),
      sub: "Last 30 days",
      color: "bg-emerald-500",
    },
    {
      icon: Brain,
      label: "Tokens Processed",
      value: isLoading ? "—" : formatNumber(kpis?.monthly_tokens ?? 0),
      sub: "Last 30 days",
      color: "bg-pink-500",
    },
    {
      icon: DollarSign,
      label: "Monthly Cost",
      value: isLoading ? "—" : `$${(kpis?.monthly_cost_usd ?? 0).toFixed(2)}`,
      sub: `$${(kpis?.avg_cost_per_req ?? 0).toFixed(4)} avg/req`,
      color: "bg-amber-500",
    },
    {
      icon: Zap,
      label: "Avg Latency",
      value: isLoading ? "—" : `${kpis?.avg_latency_ms ?? 0}ms`,
      sub: "P50 response time",
      color: "bg-cyan-500",
    },
    {
      icon: CheckCircle,
      label: "Success Rate",
      value: isLoading ? "—" : `${kpis?.success_rate ?? 0}%`,
      sub: "Uptime SLA",
      color: "bg-green-500",
    },
    {
      icon: Activity,
      label: "Health Score",
      value: isLoading ? "—" : `${kpis?.avg_health_score ?? 0}`,
      sub: "Platform avg / 100",
      color: "bg-indigo-500",
    },
  ];

  return (
    <div className="relative overflow-hidden bg-[#0c402d] rounded-lg mb-8 shadow-xl border border-[#082f22]">
      {/* Animated Particles / Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 pointer-events-none mix-blend-overlay" />

      <div className="relative z-10 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 mb-2"
            >
              <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
                <Brain size={22} className="text-purple-300" />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                AI Infrastructure & Model Operations
              </h1>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-emerald-100/80 text-lg leading-relaxed ml-14 max-w-xl"
            >
              Real-time visibility into every AI provider, model, routing rule, and cost signal
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full"
          >
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 bg-emerald-400 rounded-full"
            />
            <span className="text-emerald-300 text-xs font-medium">Live Monitoring</span>
          </motion.div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {cards.map((card, i) => (
            <KpiCard key={card.label} {...card} delay={0.1 + i * 0.05} />
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Link2, Activity, ShieldCheck, Zap, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getIntegrationOverview } from "@/lib/integrationOpsService";

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
}

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
        <Activity size={14} className="text-emerald-400 opacity-80" />
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-xs text-white/70 mt-1 font-medium">{label}</p>
      {sub && <p className="text-xs text-white/50 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

export function IntegrationsHeroBanner() {
  const { data, isLoading } = useQuery({
    queryKey: ["integration-overview"],
    queryFn: getIntegrationOverview,
    refetchInterval: 15000,
  });

  const kpis = data?.kpis;

  const cards = [
    {
      icon: Link2,
      label: "Active Connections",
      value: isLoading ? "—" : `${kpis?.online_connections ?? 0}/${kpis?.total_connections ?? 0}`,
      sub: "Connected platforms",
      color: "bg-emerald-500",
    },
    {
      icon: Zap,
      label: "API Sync Volume",
      value: isLoading ? "—" : formatNumber(kpis?.total_syncs_30d ?? 0),
      sub: "Last 30 days",
      color: "bg-indigo-500",
    },
    {
      icon: ShieldCheck,
      label: "Global Health",
      value: isLoading ? "—" : `${kpis?.global_health_score ?? 0}%`,
      sub: "Average provider health",
      color: "bg-emerald-500",
    },
    {
      icon: AlertTriangle,
      label: "Failed Syncs",
      value: isLoading ? "—" : formatNumber(kpis?.failed_syncs_30d ?? 0),
      sub: "Requires attention",
      color: "bg-amber-500",
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
                <Link2 size={22} className="text-emerald-400" />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Enterprise Integration Hub
              </h1>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-emerald-100/80 text-lg leading-relaxed ml-14 max-w-xl"
            >
              Manage connected services, API monitoring, workflows, and webhooks in real-time.
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
            <span className="text-emerald-300 text-xs font-medium">Live Telemetry</span>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {cards.map((c, i) => (
            <KpiCard key={c.label} {...c} delay={0.3 + i * 0.1} />
          ))}
        </div>
      </div>
    </div>
  );
}

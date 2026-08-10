"use client";

import { useEffect, useState } from "react";
import {
  HeartPulse, ArrowUpRight, ArrowDownRight, Minus, MoreHorizontal,
  Mail, ShieldAlert, UserX, ExternalLink, Users, TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuHeader,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/api";

interface OrgHealth {
  org_id: string;
  org_name: string;
  plan: string;
  score: number;
  status: string;
  mrr: number;
  users: number;
  sessions_14d: number;
  trend: string;
}

function OrgActionMenu({ org }: { org: OrgHealth }) {
  const handleAction = (label: string, type: "success" | "warning" | "error" | "info") => {
    const messages: Record<string, string> = {
      "Email Admins":      `Re-engagement email queued for ${org.org_name}`,
      "View Details":      `Opening ${org.org_name}...`,
      "Flag At Risk":      `${org.org_name} flagged for customer success review`,
      "Initiate Offboard": `Offboarding process started for ${org.org_name}`,
    };
    toast[type](messages[label] ?? label);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-card/95 dark:backdrop-blur-2xl border-slate-200/60 dark:border-white/10 shadow-2xl">
        <DropdownMenuHeader title={org.org_name} subtitle={`${org.plan} · ${org.status}`} />
        <DropdownMenuItem onClick={() => handleAction("Email Admins", "success")}>
          <Mail className="h-4 w-4 mr-2.5 text-emerald-500" />
          Send Re-engagement Email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction("View Details", "info")}>
          <ExternalLink className="h-4 w-4 mr-2.5 text-slate-500" />
          View Organization
        </DropdownMenuItem>
        <DropdownMenuSeparator className="dark:bg-white/10" />
        <DropdownMenuItem onClick={() => handleAction("Flag At Risk", "warning")}>
          <ShieldAlert className="h-4 w-4 mr-2.5 text-amber-500" />
          Flag as At Risk
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleAction("Initiate Offboard", "error")}
          className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
        >
          <UserX className="h-4 w-4 mr-2.5 text-rose-500" />
          Mark for Offboarding
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CustomerHealthMatrix() {
  const [data, setData] = useState<OrgHealth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/owner/analytics/health")
      .then((res) => setData(res.data.data ?? []))
      .catch(() => toast.error("Failed to load customer health data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const getScoreStyle = (score: number) => {
    if (score >= 75) return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-500/30";
    if (score >= 50) return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 ring-1 ring-amber-500/30";
    return "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 ring-1 ring-rose-500/30";
  };

  const getStatusBadge = (status: string) => {
    const base = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold";
    if (status === "Healthy")  return <span className={`${base} bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400`}><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />Healthy</span>;
    if (status === "At Risk")  return <span className={`${base} bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400`}><span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />At Risk</span>;
    if (status === "Churning") return <span className={`${base} bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400`}><span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block animate-pulse" />Churning</span>;
    return null;
  };

  const getPlanBadge = (plan: string) => {
    const base = "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold";
    if (plan.toLowerCase() === "enterprise")    return <span className={`${base} bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400`}>{plan}</span>;
    if (plan.toLowerCase() === "professional")  return <span className={`${base} bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400`}>{plan}</span>;
    return <span className={`${base} bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300`}>{plan}</span>;
  };

  const getTrend = (trend: string) => {
    if (trend === "up")   return <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />;
    if (trend === "down") return <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />;
    return <Minus className="h-3.5 w-3.5 text-slate-400" />;
  };

  return (
    <div className="w-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-rose-500" />
            Customer Health Matrix
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Live org data · Scored by activity, sessions &amp; MRR
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Healthy ≥75</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" />At Risk ≥50</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" />Churning &lt;50</span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Users className="h-14 w-14 mb-4 opacity-20" />
          <p className="font-semibold text-slate-600 dark:text-slate-300">No organizations found</p>
          <p className="text-sm mt-1">Organizations will appear here once they sign up.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200/60 dark:border-white/10">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Organization</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Plan</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Health Score</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Users</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Sessions (14d)</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">MRR</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((org, i) => (
                <motion.tr
                  key={org.org_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50/70 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-slate-900 dark:text-white">{org.org_name}</span>
                      {getStatusBadge(org.status)}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">{getPlanBadge(org.plan)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold ${getScoreStyle(org.score)}`}>
                        {org.score}
                      </span>
                      {getTrend(org.trend)}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center font-medium text-slate-700 dark:text-slate-300">
                    {org.users}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`font-semibold ${org.sessions_14d === 0 ? "text-rose-400" : "text-slate-700 dark:text-slate-300"}`}>
                      {org.sessions_14d}
                      {org.sessions_14d === 0 && <span className="ml-1 text-[10px] font-normal text-rose-400">No activity</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {org.mrr > 0 ? `$${org.mrr.toLocaleString()}` : <span className="text-slate-400 font-normal text-xs">Free</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <OrgActionMenu org={org} />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

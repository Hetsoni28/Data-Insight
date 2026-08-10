import React from "react";
import { Inbox, AlertCircle, ShieldAlert, Cpu, CreditCard, Layers } from "lucide-react";
import { NotificationStats } from "@/lib/notification.service";

interface Props {
  stats?: NotificationStats | null;
}

export function NotificationStatsRow({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <StatCard label="Unread" value={stats?.unread || 0} icon={Inbox} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-950/40" border="border-emerald-100 dark:border-emerald-900/30" />
      <StatCard label="Critical" value={stats?.critical || 0} icon={AlertCircle} color="text-rose-600 dark:text-rose-400" bg="bg-rose-50 dark:bg-rose-950/40" border="border-rose-100 dark:border-rose-900/30" />
      <StatCard label="Security" value={stats?.security || 0} icon={ShieldAlert} color="text-teal-600 dark:text-teal-400" bg="bg-teal-50 dark:bg-teal-950/40" border="border-teal-100 dark:border-teal-900/30" />
      <StatCard label="AI Ops" value={stats?.ai || 0} icon={Cpu} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-950/40" border="border-emerald-100 dark:border-emerald-900/30" />
      <StatCard label="Billing" value={stats?.billing || 0} icon={CreditCard} color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-950/40" border="border-amber-100 dark:border-amber-900/30" />
      <StatCard label="Total" value={stats?.total || 0} icon={Layers} color="text-slate-600 dark:text-slate-400" bg="bg-slate-50 dark:bg-white/5" border="border-slate-200/60 dark:border-white/10" />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg, border }: any) {
  return (
    <div className={`p-4 rounded-2xl bg-white dark:bg-white/5 border ${border} shadow-sm flex flex-col justify-between`}>
      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-4`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-1">{label}</div>
      </div>
    </div>
  );
}

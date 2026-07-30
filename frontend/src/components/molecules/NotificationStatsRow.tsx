import React from "react";
import { Inbox, AlertCircle, ShieldAlert, Cpu, CreditCard, Layers } from "lucide-react";
import { NotificationStats } from "@/lib/notification.service";

interface Props {
  stats?: NotificationStats | null;
}

export function NotificationStatsRow({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <StatCard label="Unread" value={stats?.unread || 0} icon={Inbox} color="text-blue-600" bg="bg-blue-50" border="border-blue-100" />
      <StatCard label="Critical" value={stats?.critical || 0} icon={AlertCircle} color="text-red-600" bg="bg-red-50" border="border-red-100" />
      <StatCard label="Security" value={stats?.security || 0} icon={ShieldAlert} color="text-purple-600" bg="bg-purple-50" border="border-purple-100" />
      <StatCard label="AI Ops" value={stats?.ai || 0} icon={Cpu} color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-100" />
      <StatCard label="Billing" value={stats?.billing || 0} icon={CreditCard} color="text-amber-600" bg="bg-amber-50" border="border-amber-100" />
      <StatCard label="Total" value={stats?.total || 0} icon={Layers} color="text-slate-600 dark:text-slate-400" bg="bg-slate-50 dark:bg-white/5" border="border-slate-200 dark:border-white/10" />
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

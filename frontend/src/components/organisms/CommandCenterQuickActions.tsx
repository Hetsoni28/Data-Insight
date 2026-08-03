"use client";

import { motion } from "framer-motion";
import { CreditCard, ShieldAlert, BarChart3, FileText, LucideIcon } from "lucide-react";

interface ActionItem {
  id: string;
  title: string;
  desc: string;
  prompt: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

const QUICK_ACTIONS: ActionItem[] = [
  {
    id: "revenue",
    title: "Analyze Platform MRR",
    desc: "Scan subscription breakdown and platform growth trend.",
    prompt: "Give me a detailed breakdown of our current MRR, subscription distribution, and highlight our top-paying organizations.",
    icon: CreditCard,
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
  },
  {
    id: "security",
    title: "Audit Security standing",
    desc: "Verify unresolved security incident score and postures.",
    prompt: "What is our current security posture? List any unresolved events sorted by severity and check the compliance framework standing.",
    icon: ShieldAlert,
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-500/10",
  },
  {
    id: "organizations",
    title: "Org Storage & Usage",
    desc: "Find which organizations are using the most storage resources.",
    prompt: "Scan our organizations and identify which ones have the largest storage footprint (GB) and the most active users.",
    icon: BarChart3,
    color: "text-indigo-500 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-500/10",
  },
  {
    id: "report",
    title: "Platform Executive Report",
    desc: "Draft a comprehensive summary of platform stats for board review.",
    prompt: "Draft a comprehensive Platform Executive Summary suitable for board review, compiling MRR, storage growth, SOC standing, and AI operations costs.",
    icon: FileText,
    color: "text-sky-500 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-500/10",
  },
];

interface CommandCenterQuickActionsProps {
  onActionClick: (prompt: string) => void;
}

export function CommandCenterQuickActions({ onActionClick }: CommandCenterQuickActionsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full mx-auto p-4 shrink-0">
      {QUICK_ACTIONS.map((action, idx) => (
        <motion.div
          key={action.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: idx * 0.05 }}
          onClick={() => onActionClick(action.prompt)}
          className="flex gap-4 p-4 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500/50 hover:shadow-md transition-all duration-300 group"
        >
          <div className={`p-3 rounded-xl ${action.bg} ${action.color} group-hover:scale-110 transition-transform duration-300 flex items-center justify-center shrink-0 h-12 w-12`}>
            <action.icon className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {action.title}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
              {action.desc}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

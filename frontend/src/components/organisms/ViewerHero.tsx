"use client";

import { motion } from "framer-motion";
import {
  Brain, FileText, LayoutDashboard, Database, User, Calendar, Clock,
  Building2, Briefcase, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import type { ViewerWelcomeInfo } from "@/lib/tenant-dashboard.service";
import { Logo } from "@/components/atoms/Logo";

interface ViewerHeroProps {
  welcome: ViewerWelcomeInfo | undefined;
  isLoading: boolean;
  onOpenCopilot: () => void;
}

export function ViewerHero({ welcome, isLoading, onOpenCopilot }: ViewerHeroProps) {
  const router = useRouter();

  const initials = welcome?.greeting
    ? welcome.greeting.split(",")[0]
    : "Welcome";

  if (isLoading) {
    return (
      <div className="h-56 w-full rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden bg-gradient-to-br from-[#083324] via-[#0c402d] to-[#041a12] rounded-3xl p-8 md:p-10 shadow-2xl border border-emerald-500/30"
    >
      {/* Ambient Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/25 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-teal-500/20 rounded-full blur-[90px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 pointer-events-none mix-blend-overlay" />

      <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-start lg:items-end justify-between">
        {/* Left — Identity */}
        <div className="space-y-4 max-w-2xl">
          {/* Avatar + Greeting */}
          <div className="flex items-center gap-4">
            {welcome?.avatar_url ? (
              <img
                src={welcome.avatar_url}
                alt="Avatar"
                className="w-16 h-16 rounded-2xl border-2 border-emerald-400/50 object-cover shadow-lg shadow-emerald-950/50"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center backdrop-blur-md shadow-lg shadow-emerald-950/50">
                <User className="w-8 h-8 text-emerald-400" />
              </div>
            )}
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="text-3xl md:text-4xl font-extrabold text-white tracking-tight"
              >
                {welcome?.greeting} 👋
              </motion.h1>
              <p className="text-emerald-200/80 text-sm mt-1 font-medium flex items-center gap-2">
                <span>{welcome?.role}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                <span>{welcome?.organization_name || "Your Organization"}</span>
              </p>
            </div>
          </div>

          {/* Meta Info Pills */}
          <div className="flex flex-wrap gap-2 text-xs font-medium pt-1">
            {welcome?.department && (
              <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 border border-white/15 rounded-xl text-white/90 backdrop-blur-md shadow-sm">
                <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                {welcome.department}
              </span>
            )}
            {welcome?.workspace_name && (
              <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 border border-white/15 rounded-xl text-white/90 backdrop-blur-md shadow-sm">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                {welcome.workspace_name}
              </span>
            )}
            {welcome?.today_date && (
              <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 border border-white/15 rounded-xl text-white/90 backdrop-blur-md shadow-sm">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                {welcome.today_date}
              </span>
            )}
            {welcome?.recent_login && (
              <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 border border-white/15 rounded-xl text-white/90 backdrop-blur-md shadow-sm">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Last login: {welcome.recent_login}
              </span>
            )}
          </div>
        </div>

        {/* Right — Action Buttons */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-3"
        >
          <Button
            onClick={onOpenCopilot}
            className="bg-emerald-500 hover:bg-emerald-400 text-white h-11 px-6 rounded-xl border-t border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all font-semibold hover:scale-105 active:scale-95"
          >
            <Logo size={18} showText={false} href={null} whiteMode className="mr-2.5 brightness-0 invert drop-shadow-sm" />
            Open AI Copilot
          </Button>
          <Button
            onClick={() => router.push("/dashboard/reports")}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 h-11 px-5 rounded-xl transition-all backdrop-blur-md hover:scale-105 active:scale-95"
          >
            <FileText className="w-4 h-4 mr-2" />
            View Reports
          </Button>
          <Button
            onClick={() => router.push("/dashboard/datasets")}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 h-11 px-5 rounded-xl transition-all backdrop-blur-md hover:scale-105 active:scale-95"
          >
            <Database className="w-4 h-4 mr-2" />
            Open Dataset
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}

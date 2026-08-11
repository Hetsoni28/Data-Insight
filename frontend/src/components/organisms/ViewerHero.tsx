"use client";

import { motion } from "framer-motion";
import {
  Brain, FileText, LayoutDashboard, Database, User, Calendar, Clock,
  Building2, Briefcase, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import type { ViewerWelcomeInfo } from "@/lib/viewer.service";

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
      className="relative overflow-hidden bg-[#0c402d] rounded-lg p-8 md:p-10 shadow-xl border border-[#082f22]"
    >
      {/* Ambient Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-teal-500/15 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
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
                className="w-14 h-14 rounded-full border-2 border-emerald-400/40 object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                <User className="w-7 h-7 text-emerald-400" />
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
              <p className="text-emerald-200/70 text-sm mt-0.5">
                {welcome?.role} · {welcome?.organization_name || "Your Organization"}
              </p>
            </div>
          </div>

          {/* Meta Info Pills */}
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            {welcome?.department && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/15 rounded-full text-white/80 backdrop-blur-sm">
                <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                {welcome.department}
              </span>
            )}
            {welcome?.workspace_name && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/15 rounded-full text-white/80 backdrop-blur-sm">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                {welcome.workspace_name}
              </span>
            )}
            {welcome?.today_date && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/15 rounded-full text-white/80 backdrop-blur-sm">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                {welcome.today_date}
              </span>
            )}
            {welcome?.recent_login && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/15 rounded-full text-white/80 backdrop-blur-sm">
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
            className="bg-emerald-500 hover:bg-emerald-400 text-white h-11 px-5 rounded-md border-t border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all font-semibold"
          >
            <Brain className="w-4 h-4 mr-2" />
            Open AI Copilot
          </Button>
          <Button
            onClick={() => router.push("/dashboard/reports")}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 h-11 px-5 rounded-md transition-all backdrop-blur-md"
          >
            <FileText className="w-4 h-4 mr-2" />
            View Reports
          </Button>
          <Button
            onClick={() => router.push("/dashboard/datasets")}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 h-11 px-5 rounded-md transition-all backdrop-blur-md"
          >
            <Database className="w-4 h-4 mr-2" />
            Open Dataset
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}

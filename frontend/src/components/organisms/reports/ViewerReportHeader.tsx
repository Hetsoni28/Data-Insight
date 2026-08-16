"use client";

import { Search, Loader2, FileText, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

interface ViewerReportHeaderProps {
  workspaceName?: string;
  search: string;
  setSearch: (val: string) => void;
  isLoading: boolean;
}

export function ViewerReportHeader({ workspaceName, search, setSearch, isLoading }: ViewerReportHeaderProps) {
  const { data: user } = useAuth();
  
  const today = new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-900 p-8 md:p-10 mb-8 shadow-2xl border border-white/10"
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 text-white/5 blur-sm pointer-events-none">
        <FileText className="w-96 h-96 transform rotate-12" />
      </div>
      <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6"
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span className="text-xs font-medium text-emerald-100 tracking-wide uppercase">
              {user?.tenant_id ? "Enterprise Reports" : "Reports Center"}
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2 drop-shadow-lg"
          >
            {workspaceName ? `${workspaceName} Reports` : "Intelligence Reports"}
          </motion.h1>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3 text-sm text-emerald-100/80 font-medium"
          >
            <span>{user?.full_name || user?.email}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
            <span>Viewer Access</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
            <span>{today}</span>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="relative max-w-md w-full"
        >
          <div className="absolute inset-0 bg-white/10 blur-xl rounded-full" />
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-emerald-100/50" />
            <Input
              placeholder="Search reports by name, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-14 w-full rounded-full border-white/20 bg-black/20 text-white placeholder:text-emerald-100/50 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:border-transparent backdrop-blur-md shadow-inner text-base transition-all hover:bg-black/30"
            />
            {isLoading && (
              <div className="absolute right-4">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

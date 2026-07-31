"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LifeBuoy, Plus, Megaphone, Bell, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function SupportHero() {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="relative overflow-hidden bg-[#0A3A2A] rounded-2xl border border-emerald-900/30 p-8 shadow-sm mb-8">
      {/* Decorative Background Elements */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500 rounded-full blur-3xl pointer-events-none"
      />
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
              Systems Operational
            </Badge>
            <span className="text-sm font-medium text-emerald-100/70">{currentDate}</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Platform Support Center
          </h1>
          <p className="text-emerald-100/80 max-w-xl text-sm leading-relaxed">
            Manage customer issues, track system incidents, and monitor platform health across all active Data Insight organizations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            onClick={() => toast.info("Incident reporting form will open here")}
          >
            <ShieldAlert className="w-4 h-4 mr-2 text-rose-400" />
            Report Incident
          </Button>
          <Button 
            variant="outline" 
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            onClick={() => toast.info("Broadcast messaging modal will open here")}
          >
            <Megaphone className="w-4 h-4 mr-2 text-indigo-300" />
            Broadcast
          </Button>
          <Button 
            className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm border-none"
            onClick={() => toast.info("Ticket creation modal will open here")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Ticket
          </Button>
        </div>
      </div>
    </div>
  );
}

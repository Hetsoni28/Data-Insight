"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Command, FileText, Settings, Users, Database, Activity, HardDrive, Brain, Building, CreditCard, LayoutDashboard, Code, ShieldCheck, Link, Receipt, Zap, PieChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function CommandPalette({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Global hotkey to open
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setIsOpen]);

  const items = [
    { icon: LayoutDashboard, label: "Dashboard Overview", desc: "Go to main dashboard", action: () => router.push("/owner/dashboard") },
    { icon: Database, label: "Datasets", desc: "View and manage datasets", action: () => router.push("/owner/dashboard/datasets") },
    { icon: Brain, label: "AI Copilot", desc: "Chat with your data", action: () => router.push("/owner/dashboard/ai") },
    { icon: FileText, label: "Reports", desc: "View generated reports", action: () => router.push("/owner/dashboard/reports") },
    { icon: Settings, label: "System Settings", desc: "Manage workspace settings", action: () => router.push("/owner/dashboard/settings") },
    { icon: Users, label: "Users & Team", desc: "Manage team members", action: () => router.push("/owner/dashboard/users") },
    { icon: Building, label: "Organizations", desc: "Manage tenants", action: () => router.push("/owner/dashboard/organizations") },
    { icon: CreditCard, label: "Subscriptions", desc: "Manage billing", action: () => router.push("/owner/dashboard/subscriptions") },
    { icon: Activity, label: "Audit Logs", desc: "View system events", action: () => router.push("/owner/dashboard/audit-logs") },
    { icon: HardDrive, label: "Storage", desc: "Manage storage quota", action: () => router.push("/owner/dashboard/storage") },
    { icon: Brain, label: "AI Providers", desc: "Configure LLMs", action: () => router.push("/owner/dashboard/ai-providers") },
    { icon: Code, label: "API Management", desc: "Manage developer keys", action: () => router.push("/owner/dashboard/api") },
    { icon: ShieldCheck, label: "Security", desc: "Access control and MFA", action: () => router.push("/owner/dashboard/security") },
    { icon: Link, label: "Integrations", desc: "Connect data sources", action: () => router.push("/owner/dashboard/integrations") },
    { icon: Receipt, label: "Revenue Analytics", desc: "View financial data", action: () => router.push("/owner/dashboard/revenue") },
    { icon: Zap, label: "AI Usage", desc: "Monitor token consumption", action: () => router.push("/owner/dashboard/ai-usage") },
    { icon: PieChart, label: "Platform Analytics", desc: "View platform usage", action: () => router.push("/owner/dashboard/analytics") },
  ];

  const filteredItems = items.filter(item => 
    item.label.toLowerCase().includes(query.toLowerCase()) || 
    item.desc.toLowerCase().includes(query.toLowerCase())
  );

  // Handle keyboard navigation inside the palette
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      return;
    }
    const down = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
        // Scroll into view logic could be added here
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
          setIsOpen(false);
        }
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isOpen, setIsOpen, filteredItems, selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] sm:pt-[20vh]">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dialog */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="relative w-full max-w-xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
          >
            <div className="flex items-center px-4 py-3 border-b border-slate-100">
              <Search className="w-5 h-5 text-slate-400 mr-3" />
              <input
                autoFocus
                className="flex-1 bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400 text-base"
                placeholder="Search commands, pages, and settings..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono text-slate-500">ESC</kbd>
              </div>
            </div>

            <div className="max-h-[350px] overflow-y-auto p-2" ref={listRef}>
              {filteredItems.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  No results found for "{query}"
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredItems.map((item, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          item.action();
                          setIsOpen(false);
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left group transition-colors outline-none",
                          isSelected ? "bg-emerald-50" : "hover:bg-slate-100"
                        )}
                      >
                        <div className="flex items-center">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors mr-3 shadow-sm border",
                            isSelected 
                              ? "bg-emerald-100 border-emerald-200 text-emerald-600" 
                              : "bg-white border-slate-200 text-slate-500"
                          )}>
                            <item.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className={cn("text-sm font-medium", isSelected ? "text-emerald-900" : "text-slate-900")}>
                              {item.label}
                            </p>
                            <p className={cn("text-xs", isSelected ? "text-emerald-600/80" : "text-slate-500")}>
                              {item.desc}
                            </p>
                          </div>
                        </div>
                        <Command className={cn("w-4 h-4 transition-opacity", isSelected ? "text-emerald-500 opacity-100" : "text-slate-300 opacity-0")} />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded shadow-sm font-mono font-medium">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded shadow-sm font-mono font-medium">↓</kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded shadow-sm font-mono font-medium">↵</kbd>
                to select
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

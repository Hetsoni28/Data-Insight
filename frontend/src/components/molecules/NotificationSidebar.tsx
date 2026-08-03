import React from "react";
import { Filter } from "lucide-react";
import { NotificationStats } from "@/lib/notification.service";

interface Props {
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  stats?: NotificationStats | null;
}

export function NotificationSidebar({ activeCategory, setActiveCategory, stats }: Props) {
  const categories = ['All', 'Security', 'AI', 'Billing', 'System', 'Organization'];

  return (
    <div className="w-full lg:w-64 shrink-0 space-y-6">
      <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-4 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <Filter className="w-4 h-4"/> Filters
        </h3>
        <div className="space-y-1">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between
                ${activeCategory === cat ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
            >
              <span>{cat}</span>
              {cat === 'All' && <span className="text-xs bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">{stats?.total || 0}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

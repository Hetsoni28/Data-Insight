import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Pin, Archive, Info, ShieldAlert, Server, Cpu, CreditCard, Building } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Notification } from "@/lib/notification.service";
import { PriorityBadge } from "../atoms/PriorityBadge";

export const CATEGORY_ICONS: Record<string, any> = {
  Security: ShieldAlert,
  System: Server,
  AI: Cpu,
  Billing: CreditCard,
  Organization: Building,
};

export const PRIORITY_COLORS: Record<string, string> = {
  Critical: "border-red-500 bg-red-50 text-red-700",
  High: "border-orange-500 bg-orange-50 text-orange-700",
  Medium: "border-blue-500 bg-blue-50 text-blue-700",
  Low: "border-slate-300 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300",
};

interface Props {
  notification: Notification;
  isSelected: boolean;
  onToggleRead: () => void;
  onTogglePin: () => void;
  onArchive: () => void;
  onClick: () => void;
}

export function NotificationCard({ notification, isSelected, onToggleRead, onTogglePin, onArchive, onClick }: Props) {
  const isUnread = !notification.is_read;
  const priorityColor = PRIORITY_COLORS[notification.priority] || PRIORITY_COLORS['Medium'];
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group relative flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer
        ${isUnread ? 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 shadow-sm' : 'bg-slate-50/50 border-slate-100 dark:border-white/5'}
        ${isSelected ? 'ring-2 ring-indigo-500 border-transparent' : 'hover:border-indigo-200'}
      `}
    >
      {/* Priority Border indicator */}
      <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${priorityColor.split(' ')[0].replace('border-', 'bg-')}`} />

      {/* Checkbox / Read Toggle */}
      <div className="pt-1 flex-shrink-0 z-10" onClick={(e) => { e.stopPropagation(); onToggleRead(); }}>
        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors cursor-pointer
          ${isUnread ? 'border-slate-300 hover:border-indigo-400 bg-white dark:bg-white/5' : 'border-indigo-500 bg-indigo-500 text-white'}
        `}>
          {!isUnread && <CheckCircle2 className="w-3.5 h-3.5" />}
        </div>
      </div>

      <div className="flex-1 min-w-0" onClick={onClick}>
        <div className="flex items-start justify-between gap-4 mb-1">
          <div className="flex items-center gap-2 truncate">
            <PriorityBadge priority={notification.priority} category={notification.category} />
            <h4 className={`text-sm font-semibold truncate ${isUnread ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
              {notification.title}
            </h4>
          </div>
          <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className={`text-sm line-clamp-2 pr-12 ${isUnread ? 'text-slate-600 dark:text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
          {notification.message}
        </p>
      </div>

      {/* Hover Actions */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm p-1.5 rounded-lg border border-slate-100 dark:border-white/5 shadow-sm z-10">
        <button 
          onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
          className={`p-1.5 rounded-md transition-colors ${notification.is_pinned ? 'text-orange-500 bg-orange-50' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'}`}
          title="Pin"
        >
          <Pin className="w-4 h-4" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onArchive(); }}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          title="Archive"
        >
          <Archive className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

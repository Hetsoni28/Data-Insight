import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ChevronRight, Archive, Info } from "lucide-react";
import { Notification } from "@/lib/notification.service";
import { CATEGORY_ICONS, PRIORITY_COLORS } from "../molecules/NotificationCard";
import { PRIORITY_BADGE_COLORS } from "../atoms/PriorityBadge";

interface Props {
  selectedNotification: Notification | null;
  onClose: () => void;
  onArchive: (id: string) => void;
  onMarkRead: (id: string, currentStatus: boolean) => void;
}

export function NotificationDrawer({ selectedNotification, onClose, onArchive, onMarkRead }: Props) {
  if (!selectedNotification) return null;

  const Icon = CATEGORY_ICONS[selectedNotification.category] || Info;
  const priorityColor = PRIORITY_COLORS[selectedNotification.priority] || PRIORITY_COLORS['Medium'];
  const priorityBadge = PRIORITY_BADGE_COLORS[selectedNotification.priority] || PRIORITY_BADGE_COLORS['Medium'];
  
  return (
    <AnimatePresence>
      <motion.div 
        key="notification-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <motion.div 
        key="notification-panel"
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-white/5 shadow-2xl z-50 border-l border-slate-200 dark:border-white/10 overflow-y-auto"
      >
        <div className="p-6">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
          
          <div className="mb-8 pr-12">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${priorityColor}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${priorityBadge}`}>
                {selectedNotification.priority || "Medium"}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{selectedNotification.category}</span>
            </div>
            
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{selectedNotification.title}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{selectedNotification.message}</p>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 border border-slate-100 dark:border-white/5">
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white mb-3 uppercase tracking-wider">Event Metadata</h4>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Timestamp</dt>
                  <dd className="font-medium text-slate-900 dark:text-white">{formatDistanceToNow(new Date(selectedNotification.created_at), { addSuffix: true })}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Event ID</dt>
                  <dd className="font-mono text-xs text-slate-900 dark:text-white">{selectedNotification.id.split('-')[0]}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Status</dt>
                  <dd className="font-medium text-slate-900 dark:text-white">{selectedNotification.status}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Event Type</dt>
                  <dd className="font-mono text-xs text-slate-900 dark:text-white bg-white dark:bg-white/5 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10">{selectedNotification.type || 'unknown'}</dd>
                </div>
              </dl>
            </div>

            {selectedNotification.metadata_json && (
              <div className="bg-slate-900 rounded-xl p-4 overflow-hidden">
                <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <CodeIcon className="w-4 h-4"/> Raw Payload
                </h4>
                <pre className="text-[11px] text-emerald-400 font-mono whitespace-pre-wrap break-all">
                  {JSON.stringify(selectedNotification.metadata_json, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-6 border-t border-slate-100 dark:border-white/5">
              {!selectedNotification.is_read && (
                <button onClick={() => { onMarkRead(selectedNotification.id, false); onClose(); }} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors text-sm shadow-sm">
                  Mark as Resolved
                </button>
              )}
              <button onClick={() => onArchive(selectedNotification.id)} className="w-full py-2.5 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors text-sm border border-slate-200 dark:border-white/10 shadow-sm flex items-center justify-center gap-2">
                <Archive className="w-4 h-4"/> Archive Event
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function CodeIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>;
}

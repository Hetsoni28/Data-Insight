import React from "react";
import { Search, Inbox } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Pin } from "lucide-react";
import { Notification } from "@/lib/notification.service";
import { NotificationCard } from "../molecules/NotificationCard";

interface Props {
  notifications: Notification[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onMarkAllRead: () => void;
  selectedNotificationId?: string;
  onSelect: (n: Notification) => void;
  onToggleRead: (id: string, current: boolean) => void;
  onTogglePin: (id: string, current: boolean) => void;
  onArchive: (id: string) => void;
}

export function NotificationFeed({ 
  notifications, isLoading, searchQuery, setSearchQuery, onMarkAllRead,
  selectedNotificationId, onSelect, onToggleRead, onTogglePin, onArchive
}: Props) {
  const pinnedNotifications = notifications.filter(n => n.is_pinned && !n.is_archived);
  const regularNotifications = notifications.filter(n => !n.is_pinned && !n.is_archived);

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between bg-white dark:bg-white/5 p-2 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="relative flex-1 max-w-md ml-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search operations logs..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-sm pl-9 py-2 text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-2 pr-2">
          <button onClick={onMarkAllRead} className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
            Mark All Read
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-white/10 rounded-xl animate-pulse"></div>)}
          </div>
        ) : (
          <>
            {pinnedNotifications.length > 0 && (
              <div className="space-y-4 mb-8">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2 ml-1">
                  <Pin className="w-4 h-4 text-orange-500" /> Pinned Alerts
                </h3>
                <AnimatePresence>
                  {pinnedNotifications.map(n => (
                    <NotificationCard 
                      key={n.id} 
                      notification={n} 
                      onToggleRead={() => onToggleRead(n.id, n.is_read)}
                      onTogglePin={() => onTogglePin(n.id, n.is_pinned)}
                      onArchive={() => onArchive(n.id)}
                      onClick={() => onSelect(n)}
                      isSelected={selectedNotificationId === n.id}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            <div className="space-y-4">
              {pinnedNotifications.length > 0 && <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Recent Activity</h3>}
              <AnimatePresence>
                {regularNotifications.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
                    <div className="bg-slate-50 dark:bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Inbox className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white">All caught up</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">No operations events match your criteria.</p>
                  </motion.div>
                ) : (
                  regularNotifications.map(n => (
                    <NotificationCard 
                      key={n.id} 
                      notification={n} 
                      onToggleRead={() => onToggleRead(n.id, n.is_read)}
                      onTogglePin={() => onTogglePin(n.id, n.is_pinned)}
                      onArchive={() => onArchive(n.id)}
                      onClick={() => onSelect(n)}
                      isSelected={selectedNotificationId === n.id}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

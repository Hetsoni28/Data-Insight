import React, { useState, useMemo } from "react";
import { Search, Inbox, Pin, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Notification } from "@/lib/notification.service";
import { NotificationCard } from "../molecules/NotificationCard";

const PAGE_SIZE_OPTIONS = [5, 10, 20];

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Always reset to page 1 when search changes
  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setPage(1);
  };

  const pinnedNotifications = useMemo(
    () => notifications.filter(n => n.is_pinned && !n.is_archived),
    [notifications]
  );
  const regularNotifications = useMemo(
    () => notifications.filter(n => !n.is_pinned && !n.is_archived),
    [notifications]
  );

  // Paginate only regular (non-pinned) items
  const totalItems = regularNotifications.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalItems);
  const pagedRegular = regularNotifications.slice(startIdx, endIdx);

  const goTo = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  // Generate page number buttons (show up to 5 pages centered around current)
  const pageNumbers = useMemo(() => {
    const delta = 2;
    const range: number[] = [];
    for (
      let i = Math.max(1, safePage - delta);
      i <= Math.min(totalPages, safePage + delta);
      i++
    ) {
      range.push(i);
    }
    return range;
  }, [safePage, totalPages]);

  return (
    <div className="flex-1 space-y-4">
      {/* Search + controls bar */}
      <div className="flex items-center justify-between bg-white dark:bg-white/5 p-2 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="relative flex-1 max-w-md ml-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search operations logs..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-sm pl-9 py-2 text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-2 pr-2">
          {/* Per-page selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="hidden sm:inline">Per page:</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="h-7 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 text-xs px-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              {PAGE_SIZE_OPTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="w-px h-5 bg-slate-200 dark:bg-white/10" />
          <button
            onClick={onMarkAllRead}
            className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            Mark All Read
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-slate-100 dark:bg-white/10 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Pinned section — always shown fully, no pagination */}
            {pinnedNotifications.length > 0 && (
              <div className="space-y-3 mb-6">
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

            {/* Paginated regular section */}
            <div className="space-y-3">
              {pinnedNotifications.length > 0 && totalItems > 0 && (
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                  Recent Activity
                </h3>
              )}

              <AnimatePresence mode="wait">
                {totalItems === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-20 text-center"
                  >
                    <div className="bg-slate-50 dark:bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Inbox className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white">All caught up</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">No operations events match your criteria.</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`page-${safePage}-${pageSize}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-3"
                  >
                    {pagedRegular.map(n => (
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* ── Pagination Bar ── */}
      {!isLoading && totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 pb-2 border-t border-slate-100 dark:border-white/5">
          {/* Left: count info */}
          <p className="text-xs text-slate-500 dark:text-slate-400 order-2 sm:order-1">
            Showing{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {startIdx + 1}–{endIdx}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">{totalItems}</span>{" "}
            events
          </p>

          {/* Right: controls */}
          <div className="flex items-center gap-1 order-1 sm:order-2">
            {/* First page */}
            <button
              onClick={() => goTo(1)}
              disabled={safePage === 1}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="First page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Prev */}
            <button
              onClick={() => goTo(safePage - 1)}
              disabled={safePage === 1}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* First page ellipsis */}
            {pageNumbers[0] > 1 && (
              <>
                <button
                  onClick={() => goTo(1)}
                  className="w-8 h-8 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 transition-all"
                >
                  1
                </button>
                {pageNumbers[0] > 2 && (
                  <span className="w-8 h-8 flex items-center justify-center text-xs text-slate-400">…</span>
                )}
              </>
            )}

            {/* Page numbers */}
            {pageNumbers.map(p => (
              <button
                key={p}
                onClick={() => goTo(p)}
                className={`w-8 h-8 rounded-md text-xs font-semibold transition-all ${
                  p === safePage
                    ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200 dark:shadow-none"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
                }`}
              >
                {p}
              </button>
            ))}

            {/* Last page ellipsis */}
            {pageNumbers[pageNumbers.length - 1] < totalPages && (
              <>
                {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                  <span className="w-8 h-8 flex items-center justify-center text-xs text-slate-400">…</span>
                )}
                <button
                  onClick={() => goTo(totalPages)}
                  className="w-8 h-8 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 transition-all"
                >
                  {totalPages}
                </button>
              </>
            )}

            {/* Next */}
            <button
              onClick={() => goTo(safePage + 1)}
              disabled={safePage === totalPages}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Last page */}
            <button
              onClick={() => goTo(totalPages)}
              disabled={safePage === totalPages}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Last page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

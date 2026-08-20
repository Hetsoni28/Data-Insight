/**
 * useRealtimeSync.ts
 *
 * Central real-time sync hook. Mount this ONCE per dashboard layout.
 * It connects to the backend WebSocket tenant-events stream and
 * automatically invalidates the right React Query caches when any
 * member of the org creates/updates/deletes a dataset, report, or dashboard.
 *
 * Result: every user in the org sees live data updates with zero manual refresh.
 */
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/useWebSocket";
import { toast } from "sonner";

// Maps every backend event type to the React Query keys that need invalidating.
// Add new event types here as the backend grows.
const EVENT_QUERY_MAP: Record<string, string[][]> = {
  // ─── Dataset events ───────────────────────────────────────────────────────
  dataset_uploaded: [
    ["analystDatasets"],
    ["manager-datasets-list"],
    ["admin-datasets"],
    ["owner-analytics-overview"],
    ["analystOverview"],
    ["manager-overview"],
    ["admin-overview"],
  ],
  dataset_processed: [
    ["analystDatasets"],
    ["manager-datasets-list"],
    ["admin-datasets"],
  ],
  dataset_deleted: [
    ["analystDatasets"],
    ["manager-datasets-list"],
    ["admin-datasets"],
    ["owner-analytics-overview"],
  ],

  // ─── Report events ────────────────────────────────────────────────────────
  report_created: [
    ["analystReports"],
    ["manager-reports-list"],
    ["admin-reports"],
    ["owner-analytics-overview"],
    ["analystOverview"],
    ["manager-overview"],
    ["admin-overview"],
  ],
  report_updated: [
    ["analystReports"],
    ["manager-reports-list"],
    ["admin-reports"],
  ],
  report_deleted: [
    ["analystReports"],
    ["manager-reports-list"],
    ["admin-reports"],
    ["owner-analytics-overview"],
  ],
  report_shared: [
    ["analystReports"],
    ["manager-reports-list"],
    ["admin-reports"],
  ],

  // ─── Dashboard / Builder events ───────────────────────────────────────────
  dashboard_created: [["dashboards"]],
  dashboard_updated: [["dashboards"]],
  dashboard_deleted: [["dashboards"]],

  // ─── Chart events ─────────────────────────────────────────────────────────
  chart_created: [["tenant-charts"]],
  chart_updated: [["tenant-charts"]],
  chart_deleted: [["tenant-charts"]],

  // ─── Schedule events ──────────────────────────────────────────────────────
  schedule_created: [["analystSchedules"], ["manager-schedules"]],
  schedule_updated: [["analystSchedules"], ["manager-schedules"]],
  schedule_deleted: [["analystSchedules"], ["manager-schedules"]],

  // ─── Team / User events ───────────────────────────────────────────────────
  member_invited: [["team-members"], ["admin-users"]],
  member_removed: [["team-members"], ["admin-users"]],
  member_role_changed: [["team-members"], ["admin-users"]],
};

// Toast messages for important events (optional UX polish)
const EVENT_TOASTS: Record<string, (payload: any) => string | null> = {
  dataset_uploaded: (p) => p?.name ? `📂 New dataset uploaded: "${p.name}"` : null,
  dataset_processed: (p) => p?.workflow_type ? `✅ Dataset ${p.workflow_type} completed` : null,
  report_created: (p) => p?.title ? `📊 New report created: "${p.title}"` : null,
  dashboard_created: (p) => p?.name ? `🎛️ New dashboard created: "${p.name}"` : null,
};

export function useRealtimeSync() {
  const queryClient = useQueryClient();

  const onMessage = useCallback(
    (message: any) => {
      if (!message?.type) return;

      const { type, payload } = message;

      // Invalidate all relevant query caches for this event
      const keysToInvalidate = EVENT_QUERY_MAP[type];
      if (keysToInvalidate) {
        keysToInvalidate.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      // Show a toast for user-facing events (only for other users' actions,
      // not the user who triggered it — the backend only broadcasts to others)
      const toastFn = EVENT_TOASTS[type];
      if (toastFn) {
        const msg = toastFn(payload);
        if (msg) toast.info(msg, { duration: 3000 });
      }
    },
    [queryClient]
  );

  const { isConnected } = useWebSocket({ onMessage });

  return { isConnected };
}

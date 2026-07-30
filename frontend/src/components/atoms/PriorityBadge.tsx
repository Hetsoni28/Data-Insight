import React from "react";

export const PRIORITY_BADGE_COLORS: Record<string, string> = {
  Critical: "bg-red-100 text-red-700 ring-red-500/20",
  High: "bg-orange-100 text-orange-700 ring-orange-500/20",
  Medium: "bg-blue-100 text-blue-700 ring-blue-500/20",
  Low: "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 ring-slate-500/20",
};

interface Props {
  priority: string;
  category?: string;
}

export function PriorityBadge({ priority, category }: Props) {
  const badgeClass = PRIORITY_BADGE_COLORS[priority] || PRIORITY_BADGE_COLORS["Medium"];
  const displayLabel = category || priority || "Medium";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${badgeClass}`}>
      {displayLabel}
    </span>
  );
}

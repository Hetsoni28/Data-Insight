"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Loader2, Mail, Megaphone, Shield, BarChart3, Database, Layout, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ViewerProfileService } from "@/lib/viewer-profile.service";
import type { ViewerNotificationPreferences as PrefsType } from "@/lib/viewer-profile.service";

const DEFAULT_PREFS: PrefsType = {
  email_notifications: true,
  push_notifications: true,
  report_ready: true,
  dataset_updated: true,
  dashboard_shared: true,
  ai_generation_complete: true,
  security_alerts: true,
  organization_announcements: true,
};

interface Props {
  preferences: PrefsType | null;
  isLoading: boolean;
  onUpdated: (p: PrefsType) => void;
}

export function ViewerNotificationPrefs({ preferences, isLoading, onUpdated }: Props) {
  const [saving, setSaving] = useState(false);
  // Use defaults when API data is unavailable
  const prefs = preferences ?? DEFAULT_PREFS;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
        <Skeleton className="h-6 w-48" />
        {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  const handleToggle = async (key: string, value: boolean) => {
    setSaving(true);
    try {
      const updated = await ViewerProfileService.updateNotificationPreferences({ [key]: value });
      onUpdated(updated);
    } catch {
      toast.error("Failed to update preferences.");
    } finally {
      setSaving(false);
    }
  };

  const items = [
    { key: "email_notifications", label: "Email Notifications", desc: "Receive updates via email", icon: Mail, locked: false },
    { key: "push_notifications", label: "In-App Notifications", desc: "Show push notifications", icon: Bell, locked: false },
    { key: "report_ready", label: "Report Ready", desc: "When a shared report is ready", icon: BarChart3, locked: false },
    { key: "dataset_updated", label: "Dataset Updated", desc: "When a shared dataset is refreshed", icon: Database, locked: false },
    { key: "dashboard_shared", label: "Dashboard Shared", desc: "When a dashboard is shared with you", icon: Layout, locked: false },
    { key: "ai_generation_complete", label: "AI Generation Complete", desc: "When an AI analysis finishes", icon: Sparkles, locked: false },
    { key: "security_alerts", label: "Security Alerts", desc: "Critical security notifications", icon: Shield, locked: true },
    { key: "organization_announcements", label: "Organization Announcements", desc: "Updates from your organization", icon: Megaphone, locked: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-6">
        <Bell className="w-5 h-5 text-emerald-500" />
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Notification Preferences</h2>
        {saving && <Loader2 className="w-4 h-4 animate-spin text-emerald-500 ml-auto" />}
      </div>

      <div className="space-y-1">
        {items.map(({ key, label, desc, icon: Icon, locked }) => (
          <div key={key} className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
            <div className="flex items-center gap-3">
              <Icon className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {locked && <span className="text-[10px] text-slate-400 uppercase">Required</span>}
              <Switch
                checked={(prefs as any)[key] ?? true}
                onCheckedChange={(val) => !locked && handleToggle(key, val)}
                disabled={locked || saving}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

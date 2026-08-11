"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Monitor, Palette, Eye, Zap, Minimize2, Maximize2, Sparkles, Globe, Clock, Hash } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ViewerProfileService } from "@/lib/viewer-profile.service";
import type { ViewerPreferences as PrefsType } from "@/lib/viewer-profile.service";

interface Props {
  preferences: PrefsType | null;
  isLoading: boolean;
  onUpdated: (p: PrefsType) => void;
}

export function ViewerAppearancePrefs({ preferences, isLoading, onUpdated }: Props) {
  const [saving, setSaving] = useState(false);

  if (isLoading || !preferences) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-3 gap-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
      </div>
    );
  }

  const handleUpdate = async (key: string, value: any) => {
    setSaving(true);
    try {
      const updated = await ViewerProfileService.updatePreferences({ [key]: value });
      onUpdated(updated);
    } catch { toast.error("Failed to update."); }
    finally { setSaving(false); }
  };

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6"
    >
      {/* Theme */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Appearance & Accessibility</h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {themes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => handleUpdate("theme", value)}
              disabled={saving}
              className={`p-4 rounded-xl border-2 text-center transition-all ${preferences.theme === value ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20" : "border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}
            >
              <Icon className={`w-6 h-6 mx-auto mb-2 ${preferences.theme === value ? "text-indigo-600" : "text-slate-400"}`} />
              <span className={`text-sm font-medium ${preferences.theme === value ? "text-indigo-600" : "text-slate-600 dark:text-slate-400"}`}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Density & Motion */}
      <div className="space-y-1 border-t border-slate-100 dark:border-slate-800 pt-5">
        <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/30">
          <div className="flex items-center gap-3">
            {preferences.density === "compact" ? <Minimize2 className="w-4 h-4 text-slate-500" /> : <Maximize2 className="w-4 h-4 text-slate-500" />}
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Compact Mode</p>
              <p className="text-xs text-slate-500">Reduce spacing for denser layouts</p>
            </div>
          </div>
          <Switch checked={preferences.density === "compact"} onCheckedChange={(v) => handleUpdate("density", v ? "compact" : "comfortable")} disabled={saving} />
        </div>

        <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <Zap className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Reduced Motion</p>
              <p className="text-xs text-slate-500">Minimize animations</p>
            </div>
          </div>
          <Switch checked={preferences.reduced_motion} onCheckedChange={(v) => handleUpdate("reduced_motion", v)} disabled={saving} />
        </div>

        <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <Eye className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">High Contrast</p>
              <p className="text-xs text-slate-500">Increase contrast for better readability</p>
            </div>
          </div>
          <Switch checked={preferences.high_contrast} onCheckedChange={(v) => handleUpdate("high_contrast", v)} disabled={saving} />
        </div>
      </div>

      {/* Language & Region */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-slate-500" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Language & Region</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { key: "language", label: "Language", value: preferences.language, options: ["en", "es", "fr", "de", "ja", "zh"] },
            { key: "timezone", label: "Timezone", value: preferences.timezone, options: ["UTC", "America/New_York", "America/Chicago", "America/Los_Angeles", "Europe/London", "Asia/Tokyo", "Asia/Kolkata"] },
            { key: "date_format", label: "Date Format", value: preferences.date_format, options: ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"] },
            { key: "time_format", label: "Time Format", value: preferences.time_format, options: ["12h", "24h"] },
          ].map(({ key, label, value, options }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs text-slate-500 font-medium">{label}</label>
              <select
                value={value}
                onChange={(e) => handleUpdate(key, e.target.value)}
                disabled={saving}
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

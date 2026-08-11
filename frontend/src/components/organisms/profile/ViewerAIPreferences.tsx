"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, MessageSquare, Languages, Lightbulb, Zap, History } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ViewerProfileService } from "@/lib/viewer-profile.service";
import type { ViewerPreferences as PrefsType } from "@/lib/viewer-profile.service";

interface Props {
  preferences: PrefsType | null;
  isLoading: boolean;
  onUpdated: (p: PrefsType) => void;
}

export function ViewerAIPreferences({ preferences, isLoading, onUpdated }: Props) {
  const [saving, setSaving] = useState(false);

  if (isLoading || !preferences) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
        <Skeleton className="h-6 w-48" />
        {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  const handleUpdate = async (key: string, value: any) => {
    setSaving(true);
    try {
      const updated = await ViewerProfileService.updatePreferences({ [key]: value });
      onUpdated(updated);
    } catch { toast.error("Failed to update AI preferences."); }
    finally { setSaving(false); }
  };

  const styles = [
    { value: "concise", label: "Concise", desc: "Short, direct answers" },
    { value: "balanced", label: "Balanced", desc: "Standard detail level" },
    { value: "detailed", label: "Detailed", desc: "Comprehensive explanations" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-purple-500" />
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">AI Preferences</h2>
      </div>

      {/* Response Style */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Response Style</h3>
        <div className="grid grid-cols-3 gap-3">
          {styles.map(({ value, label, desc }) => (
            <button
              key={value}
              onClick={() => handleUpdate("ai_response_style", value)}
              disabled={saving}
              className={`p-3 rounded-xl border-2 text-center transition-all ${preferences.ai_response_style === value ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20" : "border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}
            >
              <span className={`text-sm font-medium block ${preferences.ai_response_style === value ? "text-purple-600" : "text-slate-600 dark:text-slate-400"}`}>{label}</span>
              <span className="text-[10px] text-slate-400 block mt-1">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-1">
        {[
          { key: "ai_show_suggestions", label: "Show Suggested Questions", desc: "AI suggests follow-up questions", icon: Lightbulb },
          { key: "ai_show_explanations", label: "Show AI Explanations", desc: "Include reasoning with answers", icon: MessageSquare },
          { key: "ai_streaming", label: "Stream Responses", desc: "Show AI responses as they generate", icon: Zap },
          { key: "ai_conversation_history", label: "Conversation History", desc: "Remember past conversations", icon: History },
        ].map(({ key, label, desc, icon: Icon }) => (
          <div key={key} className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/30">
            <div className="flex items-center gap-3">
              <Icon className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            </div>
            <Switch checked={(preferences as any)[key]} onCheckedChange={(v) => handleUpdate(key, v)} disabled={saving} />
          </div>
        ))}
      </div>

      {/* Language */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Languages className="w-4 h-4 text-slate-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900 dark:text-white">AI Preferred Language</p>
            <p className="text-xs text-slate-500">Language for AI responses</p>
          </div>
          <select
            value={preferences.ai_preferred_language}
            onChange={(e) => handleUpdate("ai_preferred_language", e.target.value)}
            disabled={saving}
            className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {["en", "es", "fr", "de", "ja", "zh", "hi"].map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
          </select>
        </div>
      </div>

      <p className="mt-4 text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-lg">
        These preferences customize your personal AI experience only. Organization-level AI configuration is managed by your administrator.
      </p>
    </motion.div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ViewerProfileService } from "@/lib/viewer-profile.service";
import type {
  ViewerProfile,
  ViewerSecurityOverview,
  ViewerSession,
  ViewerLoginHistoryEntry,
  ViewerNotificationPreferences,
  ViewerPreferences,
} from "@/lib/viewer-profile.service";

import { ViewerProfileHeader } from "./ViewerProfileHeader";
import { ViewerPersonalInfo } from "./ViewerPersonalInfo";
import { ViewerSecurityCenter } from "./ViewerSecurityCenter";
import { ViewerSessionManager } from "./ViewerSessionManager";
import { ViewerLoginHistory } from "./ViewerLoginHistory";
import { ViewerNotificationPrefs } from "./ViewerNotificationPrefs";
import { ViewerAppearancePrefs } from "./ViewerAppearancePrefs";
import { ViewerAIPreferences } from "./ViewerAIPreferences";
import { ViewerDangerZone } from "./ViewerDangerZone";

export function ViewerProfileCenter() {
  const [loading, setLoading] = useState(true);

  // State
  const [profile, setProfile] = useState<ViewerProfile | null>(null);
  const [security, setSecurity] = useState<ViewerSecurityOverview | null>(null);
  const [sessions, setSessions] = useState<ViewerSession[]>([]);
  const [loginHistory, setLoginHistory] = useState<ViewerLoginHistoryEntry[]>([]);
  const [loginHistoryTotal, setLoginHistoryTotal] = useState(0);
  const [loginHistoryPage, setLoginHistoryPage] = useState(1);
  const [notifPrefs, setNotifPrefs] = useState<ViewerNotificationPreferences | null>(null);
  const [preferences, setPreferences] = useState<ViewerPreferences | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, securityRes, sessionsRes, historyRes, notifRes, prefsRes] = await Promise.allSettled([
        ViewerProfileService.getProfile(),
        ViewerProfileService.getSecurity(),
        ViewerProfileService.getSessions(),
        ViewerProfileService.getLoginHistory(1, 10),
        ViewerProfileService.getNotificationPreferences(),
        ViewerProfileService.getPreferences(),
      ]);

      if (profileRes.status === "fulfilled") setProfile(profileRes.value);
      if (securityRes.status === "fulfilled") setSecurity(securityRes.value);
      if (sessionsRes.status === "fulfilled") setSessions(sessionsRes.value);
      if (historyRes.status === "fulfilled") {
        setLoginHistory(historyRes.value.entries);
        setLoginHistoryTotal(historyRes.value.total);
      }
      if (notifRes.status === "fulfilled") setNotifPrefs(notifRes.value);
      if (prefsRes.status === "fulfilled") setPreferences(prefsRes.value);

      // Log any individual failures for debugging without crashing
      [profileRes, securityRes, sessionsRes, historyRes, notifRes, prefsRes].forEach((r, i) => {
        if (r.status === "rejected") {
          console.warn(`Profile section ${i} failed to load:`, r.reason);
        }
      });
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleLoginHistoryPage = async (page: number) => {
    setLoginHistoryPage(page);
    try {
      const res = await ViewerProfileService.getLoginHistory(page, 10);
      setLoginHistory(res.entries);
      setLoginHistoryTotal(res.total);
    } catch {
      console.error("Failed to load login history");
    }
  };

  const refreshSecurity = async () => {
    try {
      const [secRes, sessRes] = await Promise.all([
        ViewerProfileService.getSecurity(),
        ViewerProfileService.getSessions(),
      ]);
      setSecurity(secRes);
      setSessions(sessRes);
    } catch {}
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 space-y-6 pb-12">
      {/* Back Navigation */}
      <div className="flex items-center gap-2">
        <Link href="/viewer/dashboard">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-slate-500 hover:text-slate-900 dark:hover:text-white -ml-2">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Profile Header */}
      <ViewerProfileHeader profile={profile} isLoading={loading} />

      {/* Main Content - Two Column on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <ViewerPersonalInfo profile={profile} isLoading={loading} onUpdated={setProfile} />
          <ViewerSecurityCenter security={security} isLoading={loading} onRefresh={refreshSecurity} />
          <ViewerSessionManager sessions={sessions} isLoading={loading} onRefresh={refreshSecurity} />
          <ViewerLoginHistory
            entries={loginHistory}
            total={loginHistoryTotal}
            page={loginHistoryPage}
            size={10}
            isLoading={loading}
            onPageChange={handleLoginHistoryPage}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <ViewerNotificationPrefs preferences={notifPrefs} isLoading={loading} onUpdated={setNotifPrefs} />
          <ViewerAppearancePrefs preferences={preferences} isLoading={loading} onUpdated={setPreferences} />
          <ViewerAIPreferences preferences={preferences} isLoading={loading} onUpdated={setPreferences} />
          <ViewerDangerZone isLoading={loading} />
        </div>
      </div>
    </div>
  );
}

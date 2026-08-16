"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { User, Shield, Laptop, Bell, Settings } from "lucide-react";
import { ViewerProfileService } from "@/lib/viewer-profile.service";
import type {
  ViewerProfile,
  ViewerSecurityOverview,
  ViewerSession,
  ViewerLoginHistoryEntry,
  ViewerNotificationPreferences,
  ViewerPreferences,
  ViewerActivityEntry,
} from "@/lib/viewer-profile.service";

import { ViewerProfileHeader } from "./ViewerProfileHeader";
import { ViewerPersonalInfo } from "./ViewerPersonalInfo";
import { ViewerSecurityCenter } from "./ViewerSecurityCenter";
import { ViewerSessionManager } from "./ViewerSessionManager";
import { ViewerLoginHistory } from "./ViewerLoginHistory";
import { ViewerNotificationPrefs } from "./ViewerNotificationPrefs";
import { ViewerDangerZone } from "./ViewerDangerZone";
import { ViewerActivity } from "./ViewerActivity";

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
  const [activity, setActivity] = useState<ViewerActivityEntry[]>([]);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityPage, setActivityPage] = useState(1);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, securityRes, sessionsRes, historyRes, notifRes, prefsRes, activityRes] = await Promise.allSettled([
        ViewerProfileService.getProfile(),
        ViewerProfileService.getSecurity(),
        ViewerProfileService.getSessions(),
        ViewerProfileService.getLoginHistory(1, 10),
        ViewerProfileService.getNotificationPreferences(),
        ViewerProfileService.getPreferences(),
        ViewerProfileService.getActivity(activityPage, 10),
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
      if (activityRes.status === "fulfilled") {
        setActivity(activityRes.value.entries);
        setActivityTotal(activityRes.value.total);
      }

      // Log any individual failures for debugging without crashing
      [profileRes, securityRes, sessionsRes, historyRes, notifRes, prefsRes, activityRes].forEach((r, i) => {
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

  const handleActivityPage = async (page: number) => {
    setActivityPage(page);
    setLoading(true);
    try {
      const res = await ViewerProfileService.getActivity(page, 10);
      setActivity(res.entries);
      setActivityTotal(res.total);
    } catch {
      toast.error("Failed to load activity.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full animate-in fade-in duration-500 space-y-6 pb-12">
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

      {/* Main Content - Tabs Layout */}
      <Tabs defaultValue="profile" className="w-full space-y-6">
        <TabsList variant="line" className="w-full justify-start border-b border-slate-200 dark:border-slate-800 mb-6 overflow-x-auto flex-nowrap sm:flex-wrap">
          <TabsTrigger value="profile" className="px-4 py-2.5">
            <User className="w-4 h-4 mr-2" /> Profile Details
          </TabsTrigger>
          <TabsTrigger value="security" className="px-4 py-2.5">
            <Shield className="w-4 h-4 mr-2" /> Security & Sessions
          </TabsTrigger>
          <TabsTrigger value="activity" className="px-4 py-2.5">
            <Laptop className="w-4 h-4 mr-2" /> Activity Log
          </TabsTrigger>
          <TabsTrigger value="settings" className="px-4 py-2.5">
            <Settings className="w-4 h-4 mr-2" /> Settings & Privacy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <ViewerPersonalInfo profile={profile} isLoading={loading} onUpdated={setProfile} />
        </TabsContent>

        <TabsContent value="security" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <ViewerSecurityCenter security={security} isLoading={loading} onRefresh={refreshSecurity} />
          <ViewerSessionManager sessions={sessions} isLoading={loading} onRefresh={refreshSecurity} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <ViewerLoginHistory
            entries={loginHistory}
            total={loginHistoryTotal}
            page={loginHistoryPage}
            size={10}
            isLoading={loading}
            onPageChange={handleLoginHistoryPage}
          />
          <ViewerActivity 
            entries={activity} 
            total={activityTotal}
            page={activityPage}
            size={10}
            isLoading={loading} 
            onPageChange={handleActivityPage}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <ViewerNotificationPrefs preferences={notifPrefs} isLoading={loading} onUpdated={setNotifPrefs} />
          <ViewerDangerZone isLoading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

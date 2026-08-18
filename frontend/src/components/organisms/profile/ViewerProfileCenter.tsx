"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { User, Shield, Laptop, Bell, Settings } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TenantProfileService } from "@/lib/tenant-profile.service";
import type {
  ViewerProfile,
  ViewerSecurityOverview,
  ViewerSession,
  ViewerLoginHistoryEntry,
  ViewerNotificationPreferences,
  ViewerPreferences,
  ViewerActivityEntry,
} from "@/lib/tenant-profile.service";

import { ViewerProfileHeader } from "./ViewerProfileHeader";
import { ViewerPersonalInfo } from "./ViewerPersonalInfo";
import { ViewerSecurityCenter } from "./ViewerSecurityCenter";
import { ViewerSessionManager } from "./ViewerSessionManager";
import { ViewerLoginHistory } from "./ViewerLoginHistory";
import { ViewerNotificationPrefs } from "./ViewerNotificationPrefs";
import { ViewerDangerZone } from "./ViewerDangerZone";
import { ViewerActivity } from "./ViewerActivity";

export function ViewerProfileCenter() {
  const queryClient = useQueryClient();
  const [loginHistoryPage, setLoginHistoryPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['viewer-profile'],
    queryFn: () => TenantProfileService.getProfile(),
  });

  const { data: security, isLoading: loadingSecurity } = useQuery({
    queryKey: ['viewer-security'],
    queryFn: () => TenantProfileService.getSecurity(),
  });

  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['viewer-sessions'],
    queryFn: () => TenantProfileService.getSessions(),
  });

  const { data: loginHistoryData, isLoading: loadingHistory } = useQuery({
    queryKey: ['viewer-login-history', loginHistoryPage],
    queryFn: () => TenantProfileService.getLoginHistory(loginHistoryPage, 10),
  });
  const loginHistory = loginHistoryData?.entries || [];
  const loginHistoryTotal = loginHistoryData?.total || 0;

  const { data: notifPrefs, isLoading: loadingNotifs } = useQuery({
    queryKey: ['viewer-notification-prefs'],
    queryFn: () => TenantProfileService.getNotificationPreferences(),
  });

  const { data: preferences, isLoading: loadingPrefs } = useQuery({
    queryKey: ['viewer-preferences'],
    queryFn: () => TenantProfileService.getPreferences(),
  });

  const { data: activityData, isLoading: loadingActivity } = useQuery({
    queryKey: ['viewer-activity', activityPage],
    queryFn: () => TenantProfileService.getActivity(activityPage, 10),
  });
  const activity = activityData?.entries || [];
  const activityTotal = activityData?.total || 0;

  const loading = loadingProfile || loadingSecurity || loadingSessions || loadingHistory || loadingNotifs || loadingPrefs || loadingActivity;

  const handleLoginHistoryPage = useCallback((page: number) => {
    setLoginHistoryPage(page);
  }, []);

  const refreshSecurity = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['viewer-security'] });
    await queryClient.invalidateQueries({ queryKey: ['viewer-sessions'] });
  }, [queryClient]);

  const handleActivityPage = useCallback((page: number) => {
    setActivityPage(page);
  }, []);

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
      <ViewerProfileHeader profile={profile || null} isLoading={loading} />

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
          <ViewerPersonalInfo profile={profile || null} isLoading={loading} onUpdated={(newProfile) => queryClient.setQueryData(['viewer-profile'], newProfile)} />
        </TabsContent>

        <TabsContent value="security" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <ViewerSecurityCenter security={security || null} isLoading={loading} onRefresh={refreshSecurity} />
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
          <ViewerNotificationPrefs preferences={notifPrefs || null} isLoading={loading} onUpdated={(newPrefs) => queryClient.setQueryData(['viewer-notification-prefs'], newPrefs)} />
          <ViewerDangerZone isLoading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

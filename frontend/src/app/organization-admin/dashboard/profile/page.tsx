"use client";

import React, { useState, useEffect } from "react";
import { User as UserIcon, Shield, Laptop, Bell, Settings } from "lucide-react";
import { ProfileService, FullProfile, UserSession } from "@/lib/profile.service";
import { getLoginHistory, LoginHistoryItem } from "@/lib/auth.service";
import { useAuthStore } from "@/store/authStore";

import { ProfileHero } from "@/components/organisms/profile/ProfileHero";
import { PersonalInfoCard } from "@/components/organisms/profile/PersonalInfoCard";
import { SecuritySettingsCard } from "@/components/organisms/profile/SecuritySettingsCard";
import { ActiveSessionsCard } from "@/components/organisms/profile/ActiveSessionsCard";
import { LoginHistoryTable } from "@/components/organisms/profile/LoginHistoryTable";
import { NotificationPreferencesCard } from "@/components/organisms/profile/NotificationPreferencesCard";
import { AccountPreferencesCard } from "@/components/organisms/profile/AccountPreferencesCard";
import { DangerZoneCard } from "@/components/organisms/profile/DangerZoneCard";
import { AvatarModal } from "@/components/organisms/profile/AvatarModal";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function OrgAdminProfilePage() {
  const { logout } = useAuthStore();
  const [profileData, setProfileData] = useState<FullProfile | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  const fetchAllData = async () => {
    try {
      // Fetch profile + sessions together — these must succeed
      const [profRes, sessRes] = await Promise.all([
        ProfileService.getFullProfile(),
        ProfileService.getSessions(),
      ]);
      setProfileData(profRes);
      setSessions(sessRes);
    } catch (error) {
      console.error("Failed to load profile data:", error);
    } finally {
      setLoading(false);
    }

    // Login history is fetched separately — a 401 here should NOT crash the page
    try {
      const histRes = await getLoginHistory();
      setHistory(histRes);
    } catch (error) {
      console.warn("Login history unavailable (401 or network error) — showing empty list.");
      setHistory([]);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const user = profileData?.user;

  return (
    <ScrollArea className="h-full">
      <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Profile & Account Center</h1>
          <p className="text-slate-500 mt-1">Manage your identity, security settings, and active sessions.</p>
        </div>

        <ProfileHero 
          user={user} 
          profileData={profileData} 
          avatarUrl={user?.avatar_url || ""} 
          setIsAvatarModalOpen={setAvatarModalOpen} 
        />

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-5 h-auto rounded-xl p-1 bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10">
            <TabsTrigger value="personal" className="py-2 rounded-lg data-active:bg-white dark:data-active:bg-white/10 data-active:shadow-sm data-active:text-emerald-700 dark:data-active:text-emerald-400 transition-colors">
              <UserIcon className="w-4 h-4 mr-2" /> Personal
            </TabsTrigger>
            <TabsTrigger value="security" className="py-2 rounded-lg data-active:bg-white dark:data-active:bg-white/10 data-active:shadow-sm data-active:text-emerald-700 dark:data-active:text-emerald-400 transition-colors">
              <Shield className="w-4 h-4 mr-2" /> Security
            </TabsTrigger>
            <TabsTrigger value="sessions" className="py-2 rounded-lg data-active:bg-white dark:data-active:bg-white/10 data-active:shadow-sm data-active:text-emerald-700 dark:data-active:text-emerald-400 transition-colors">
              <Laptop className="w-4 h-4 mr-2" /> Sessions
            </TabsTrigger>
            <TabsTrigger value="notifications" className="py-2 rounded-lg data-active:bg-white dark:data-active:bg-white/10 data-active:shadow-sm data-active:text-emerald-700 dark:data-active:text-emerald-400 transition-colors">
              <Bell className="w-4 h-4 mr-2" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="preferences" className="py-2 rounded-lg data-active:bg-white dark:data-active:bg-white/10 data-active:shadow-sm data-active:text-emerald-700 dark:data-active:text-emerald-400 transition-colors">
              <Settings className="w-4 h-4 mr-2" /> Preferences
            </TabsTrigger>
          </TabsList>

          <div className="mt-8">
            <TabsContent value="personal" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <div className="w-full max-w-5xl space-y-8">
                <PersonalInfoCard user={user} profileData={profileData?.profile || null} onUpdate={fetchAllData} />
              </div>
            </TabsContent>

            <TabsContent value="security" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <div className="w-full max-w-5xl space-y-8">
                <SecuritySettingsCard user={user} onUpdate={fetchAllData} />
                <DangerZoneCard />
              </div>
            </TabsContent>

            <TabsContent value="sessions" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <div className="space-y-8">
                <ActiveSessionsCard sessions={sessions} onUpdate={fetchAllData} />
                <LoginHistoryTable history={history} />
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <div className="w-full max-w-5xl space-y-8">
                <NotificationPreferencesCard user={user} profileData={profileData?.profile || null} onUpdate={fetchAllData} />
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <div className="w-full max-w-5xl space-y-8">
                <AccountPreferencesCard profileData={profileData?.profile || null} onUpdate={fetchAllData} />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <AvatarModal 
        open={avatarModalOpen} 
        onOpenChange={setAvatarModalOpen} 
        currentAvatarUrl={user?.avatar_url || ""} 
        onUpdate={fetchAllData} 
      />
    </ScrollArea>
  );
}

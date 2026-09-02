import dynamic from "next/dynamic"
﻿"use client";

import { useState, useEffect } from "react";
import { Bell, Mail, MessageSquare, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/molecules/PageHeader";
import { SettingCard } from "@/components/molecules/SettingCard";
import { ActionToggle } from "@/components/molecules/ActionToggle";
import { NotificationService, Notification, NotificationStats } from "@/lib/notification.service";

import { NotificationStatsRow } from "@/components/molecules/NotificationStatsRow";
import { NotificationSidebar } from "@/components/molecules/NotificationSidebar";
import { useAuth } from "@/hooks/useAuth";

const NotificationFeed = dynamic(() => import('@/components/organisms/NotificationFeed').then(m => m.NotificationFeed), { ssr: false })
const NotificationDrawer = dynamic(() => import('@/components/organisms/NotificationDrawer').then(m => m.NotificationDrawer), { ssr: false })


export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<"feed" | "preferences">("feed");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);

  const { data: user, refetch: refetchUser } = useAuth();

  const fetchFeed = async () => {
    setIsLoadingFeed(true);
    try {
      const data = await NotificationService.getNotifications({ search: searchQuery, category: activeCategory !== 'All' ? activeCategory : undefined });
      setNotifications(data);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  const fetchStats = async () => {
    try { setStats(await NotificationService.getStats()); } catch (e) {}
  };

  useEffect(() => { fetchFeed(); }, [searchQuery, activeCategory]);
  useEffect(() => { fetchStats(); }, []);

  const handleAction = async (action: Promise<any>, successMsg: string) => {
    toast.promise(action.then(() => { fetchFeed(); fetchStats(); }), {
      loading: 'Processing...', success: successMsg, error: 'Action failed'
    });
  };

  const handleTogglePref = (prefKey: string, label: string) => async (newState: boolean) => {
    try {
      await NotificationService.updatePreferences({ [prefKey]: newState })
      toast.success(`${label} alerts ${newState ? "enabled" : "disabled"}.`)
      await refetchUser() // Refresh user data to get updated preferences
    } catch {
      toast.error(`Failed to update ${label} preference.`)
      throw new Error("API failed") // Re-throw so ActionToggle can revert
    }
  }

  const prefs = (user as any)?.notification_preferences || { email_notifications: true, slack_notifications: false, push_notifications: true };

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <PageHeader title="Platform Operations Center" description="Real-time monitoring and intelligence hub." icon={Bell} />
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 dark:bg-white/5 p-1 rounded-xl flex border border-slate-200/60 dark:border-white/10">
            <button onClick={() => setActiveTab("feed")} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'feed' ? 'bg-white dark:bg-white/10 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Operations Feed</button>
            <button onClick={() => setActiveTab("preferences")} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'preferences' ? 'bg-white dark:bg-white/10 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Preferences</button>
          </div>
        </div>
      </div>

      {activeTab === 'preferences' ? (
        <div className="grid md:grid-cols-3 gap-6">
          <SettingCard title="Email Alerts" delay={0.1} icon={Mail} className="h-full"><ActionToggle initialState={prefs.email_notifications} onToggle={handleTogglePref('email_notifications', 'Email')} activeLabel="Enabled" inactiveLabel="Disabled" /></SettingCard>
          <SettingCard title="Slack Notifications" delay={0.2} icon={MessageSquare} className="h-full"><ActionToggle initialState={prefs.slack_notifications} onToggle={handleTogglePref('slack_notifications', 'Slack')} activeLabel="Enabled" inactiveLabel="Disabled" /></SettingCard>
          <SettingCard title="Push Notifications" delay={0.3} icon={Smartphone} className="h-full"><ActionToggle initialState={prefs.push_notifications} onToggle={handleTogglePref('push_notifications', 'Push')} activeLabel="Enabled" inactiveLabel="Disabled" /></SettingCard>
        </div>
      ) : (
        <div className="space-y-8">
          <NotificationStatsRow stats={stats} />
          <div className="flex flex-col lg:flex-row gap-8">
            <NotificationSidebar activeCategory={activeCategory} setActiveCategory={setActiveCategory} stats={stats} />
            <NotificationFeed 
              notifications={notifications} isLoading={isLoadingFeed} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
              onMarkAllRead={() => handleAction(NotificationService.markAllAsRead(), 'Inbox cleared!')}
              selectedNotificationId={selectedNotification?.id} onSelect={setSelectedNotification}
              onToggleRead={(id, isRead) => handleAction(NotificationService.updateNotification(id, { is_read: !isRead }), 'Status updated')}
              onTogglePin={(id, isPinned) => { NotificationService.updateNotification(id, { is_pinned: !isPinned }); fetchFeed(); }}
              onArchive={(id) => { handleAction(NotificationService.updateNotification(id, { is_archived: true }), 'Archived'); if (selectedNotification?.id === id) setSelectedNotification(null); }}
            />
          </div>
        </div>
      )}
      <NotificationDrawer 
        selectedNotification={selectedNotification} onClose={() => setSelectedNotification(null)}
        onArchive={(id) => { handleAction(NotificationService.updateNotification(id, { is_archived: true }), 'Archived'); setSelectedNotification(null); }}
        onMarkRead={(id, isRead) => { handleAction(NotificationService.updateNotification(id, { is_read: !isRead }), 'Status updated'); setSelectedNotification(null); }}
      />
    </div>
  );
}

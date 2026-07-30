"use client";

import { Bell, Mail, MessageSquare, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/molecules/PageHeader";
import { SettingCard } from "@/components/molecules/SettingCard";
import { ActionToggle } from "@/components/molecules/ActionToggle";

export default function NotificationsPage() {
  const handleToggle = (pref: string) => async (newState: boolean) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        toast.success(`Notification preference updated`, {
          description: `You will ${newState ? 'now' : 'no longer'} receive alerts via ${pref}.`
        });
        resolve();
      }, 800);
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
      <PageHeader 
        title="Notification Preferences" 
        description="Control how and when you receive alerts for system events and AI insights."
        icon={Bell}
      />

      <div className="grid md:grid-cols-3 gap-6">
        <SettingCard title="Email Alerts" delay={0.1} icon={Mail} className="h-full">
          <div className="flex flex-col h-full">
            <p className="text-sm text-slate-500 mb-6 flex-1">
              Receive daily digests, billing alerts, and critical system updates via email.
            </p>
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <ActionToggle initialState={true} onToggle={handleToggle('Email')} activeLabel="Enabled" inactiveLabel="Disabled" />
            </div>
          </div>
        </SettingCard>

        <SettingCard title="Slack Notifications" delay={0.2} icon={MessageSquare} className="h-full">
          <div className="flex flex-col h-full">
            <p className="text-sm text-slate-500 mb-6 flex-1">
              Direct messages for completed reports and AI anomaly detections.
            </p>
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <ActionToggle initialState={false} onToggle={handleToggle('Slack')} activeLabel="Enabled" inactiveLabel="Disabled" />
            </div>
          </div>
        </SettingCard>

        <SettingCard title="Push Notifications" delay={0.3} icon={Smartphone} className="h-full">
          <div className="flex flex-col h-full">
            <p className="text-sm text-slate-500 mb-6 flex-1">
              In-app browser push notifications for real-time task completions.
            </p>
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <ActionToggle initialState={true} onToggle={handleToggle('Push')} activeLabel="Enabled" inactiveLabel="Disabled" />
            </div>
          </div>
        </SettingCard>
      </div>
    </div>
  );
}

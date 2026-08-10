import React, { useState } from "react";
import { Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ProfileService, UserProfile } from "@/lib/profile.service";
import api from "@/lib/api";
import { toast } from "sonner";

interface Props {
  user: any;
  profileData: UserProfile | null;
  onUpdate: () => void;
}

export function NotificationPreferencesCard({ user, profileData, onUpdate }: Props) {
  const defaultPrefs = {
    security_alerts: true,
    billing_notifs: false,
    report_generation: true,
    system_announcements: true,
    marketing_emails: false,
    ...(user?.notification_preferences || {}),
  };

  const [prefs, setPrefs] = useState(defaultPrefs);
  const [loading, setLoading] = useState(false);

  const togglePref = async (key: string) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    setLoading(true);
    try {
      await api.patch("/users/me", { notification_preferences: newPrefs });
      toast.success("Notification preferences updated.");
      onUpdate();
    } catch (error: any) {
      toast.error("Failed to update preferences.");
      setPrefs(prefs); // revert on failure
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-200/60 dark:border-white/10 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-emerald-600" />
          <CardTitle className="text-xl">Notification Preferences</CardTitle>
        </div>
        <CardDescription>
          Choose what events you want to be notified about.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Security Alerts</Label>
            <p className="text-sm text-slate-500">Receive emails about new logins from unknown devices or password changes.</p>
          </div>
          <Switch checked={!!prefs.security_alerts} disabled={loading} onCheckedChange={() => togglePref("security_alerts")} />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Report Generation</Label>
            <p className="text-sm text-slate-500">Get notified when your scheduled reports finish processing.</p>
          </div>
          <Switch checked={!!prefs.report_generation} disabled={loading} onCheckedChange={() => togglePref("report_generation")} />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Billing & Subscription</Label>
            <p className="text-sm text-slate-500">Important notices regarding your organization's subscription and invoices.</p>
          </div>
          <Switch checked={!!prefs.billing_notifs} disabled={loading} onCheckedChange={() => togglePref("billing_notifs")} />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">System Announcements</Label>
            <p className="text-sm text-slate-500">Updates about platform maintenance and new features.</p>
          </div>
          <Switch checked={!!prefs.system_announcements} disabled={loading} onCheckedChange={() => togglePref("system_announcements")} />
        </div>
      </CardContent>
    </Card>
  );
}

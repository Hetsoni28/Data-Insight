import React, { useState } from "react";
import { Settings, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ProfileService, UserProfile } from "@/lib/profile.service";
import { toast } from "sonner";

interface Props {
  profileData: UserProfile | null;
  onUpdate: () => void;
}

export function AccountPreferencesCard({ profileData, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState<{ language: string; timezone: string }>({
    language: profileData?.language || "en",
    timezone: profileData?.timezone || "UTC",
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await ProfileService.updateProfile(prefs);
      toast.success("Account preferences updated.");
      onUpdate();
    } catch (error: any) {
      toast.error("Failed to update preferences.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-200/50 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Account Preferences</CardTitle>
        </div>
        <CardDescription className="text-slate-500 dark:text-slate-400">
          Customize your regional settings and language.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2.5">
            <Label className="text-slate-700 dark:text-slate-300 font-medium">Language</Label>
            <Select value={prefs.language} onValueChange={(val) => setPrefs({ ...prefs, language: val || "en" })}>
              <SelectTrigger className="border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-200">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English (US)</SelectItem>
                <SelectItem value="en-gb">English (UK)</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2.5">
            <Label className="text-slate-700 dark:text-slate-300 font-medium">Timezone</Label>
            <Select value={prefs.timezone} onValueChange={(val) => setPrefs({ ...prefs, timezone: val || "UTC" })}>
              <SelectTrigger className="border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-200">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC (Universal Time)</SelectItem>
                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                <SelectItem value="Europe/London">London (GMT)</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t border-slate-100 dark:border-white/5 pt-6 mt-2 bg-slate-50/30 dark:bg-white/[0.02] rounded-b-xl">
        <Button 
          onClick={handleSave} 
          disabled={loading} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-emerald-600/20 transition-all min-w-[150px]"
        >
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
          ) : "Save Preferences"}
        </Button>
      </CardFooter>
    </Card>
  );
}

import React, { useState } from "react";
import { Settings } from "lucide-react";
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
    <Card className="border-slate-200/60 dark:border-white/10 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-600" />
          <CardTitle className="text-xl">Account Preferences</CardTitle>
        </div>
        <CardDescription>
          Customize your regional settings and language.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Language</Label>
            <Select value={prefs.language} onValueChange={(val) => setPrefs({ ...prefs, language: val || "en" })}>
              <SelectTrigger>
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
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select value={prefs.timezone} onValueChange={(val) => setPrefs({ ...prefs, timezone: val || "UTC" })}>
              <SelectTrigger>
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
      <CardFooter className="flex justify-end border-t border-slate-100 dark:border-white/5 pt-6 mt-2">
        <Button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          {loading ? "Saving..." : "Save Preferences"}
        </Button>
      </CardFooter>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { User, ShieldAlert, KeyRound, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/molecules/PageHeader";
import { SettingCard } from "@/components/molecules/SettingCard";
import { FormInput } from "@/components/molecules/FormInput";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function ProfilePage() {
  const { data: user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSaveProfile = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Profile Updated", {
        description: "Your personal information has been saved."
      });
    }, 1000);
  };

  const handlePasswordReset = () => {
    setIsResetting(true);
    setTimeout(() => {
      setIsResetting(false);
      toast.info("Password Reset Email Sent", {
        description: "Please check your inbox for instructions to reset your password."
      });
    }, 1500);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
      <PageHeader 
        title="My Profile" 
        description="Manage your personal account settings, credentials, and avatar."
        icon={User}
        action={
          <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        }
      />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <SettingCard 
          title="Personal Information" 
          description="Update your name, email, and avatar." 
          icon={User} 
          delay={0.1}
        >
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-2xl font-bold border-2 border-emerald-500/20">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <Button variant="outline" size="sm" onClick={() => toast.info("Avatar upload opened")}>Change Avatar</Button>
                <p className="text-xs text-slate-500 mt-2">JPG, GIF or PNG. 1MB max.</p>
              </div>
            </div>
            
            <FormInput 
              label="Full Name" 
              defaultValue={user?.full_name || ""} 
              placeholder="Enter your full name"
            />
            <FormInput 
              label="Email Address" 
              type="email" 
              defaultValue={user?.email || ""} 
              disabled 
              description="To change your email, please contact an organization administrator."
            />
          </div>
        </SettingCard>

        {/* Security & Credentials */}
        <div className="space-y-6">
          <SettingCard 
            title="Password & Security" 
            description="Manage your password and security credentials." 
            icon={KeyRound} 
            delay={0.2}
          >
            <div className="space-y-4 mt-4">
              <div className="flex flex-col gap-2">
                <Button onClick={handlePasswordReset} disabled={isResetting} variant="outline" className="w-full justify-start">
                  <KeyRound className="w-4 h-4 mr-2" />
                  {isResetting ? "Sending Email..." : "Send Password Reset Email"}
                </Button>
                <Button onClick={() => toast.info("2FA Setup Flow")} variant="outline" className="w-full justify-start">
                  <ShieldAlert className="w-4 h-4 mr-2" />
                  Setup Two-Factor Authentication
                </Button>
              </div>
            </div>
          </SettingCard>

          <SettingCard 
            title="Danger Zone" 
            delay={0.3}
            className="border-red-100 bg-red-50/30"
          >
            <div className="flex items-center justify-between mt-2">
              <div>
                <h4 className="text-sm font-medium text-slate-900">Delete Account</h4>
                <p className="text-xs text-slate-500 mt-1">Permanently remove your personal account.</p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => toast.error("Cannot delete account while you are an active Organization Owner.")}>Delete Account</Button>
            </div>
          </SettingCard>
        </div>
      </div>
    </div>
  );
}

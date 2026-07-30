"use client";

import { ShieldCheck, ShieldAlert, Fingerprint, Lock } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/molecules/PageHeader";
import { SettingCard } from "@/components/molecules/SettingCard";
import { Button } from "@/components/ui/button";
import { ActionToggle } from "@/components/molecules/ActionToggle";

export default function SecurityPage() {
  const handleMfaToggle = async (newState: boolean) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        toast[newState ? "success" : "info"](`MFA Enforcement ${newState ? "Enabled" : "Disabled"}`, {
          description: newState 
            ? "All users will be required to set up MFA on their next login."
            : "Users will no longer be forced to use Two-Factor Authentication."
        });
        resolve();
      }, 1000);
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
      <PageHeader 
        title="Security Posture" 
        description="Manage authentication policies, session lifetimes, and security enforcement."
        icon={ShieldCheck}
      />

      <div className="grid md:grid-cols-2 gap-6">
        {/* MFA Enforcement */}
        <SettingCard 
          title="Multi-Factor Authentication" 
          description="Enforce 2FA/MFA across all users in your organization."
          icon={Fingerprint}
          delay={0.1}
        >
          <div className="mt-6 p-4 rounded-xl border border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Enforce Organization-wide MFA</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Status will be applied globally.</p>
            </div>
            <ActionToggle 
              initialState={false} 
              onToggle={handleMfaToggle} 
              activeLabel="Enforced" 
              inactiveLabel="Optional" 
            />
          </div>
        </SettingCard>

        {/* Session Management */}
        <SettingCard 
          title="Session Management" 
          description="Control how long users stay logged in before requiring re-authentication."
          icon={Lock}
          delay={0.2}
        >
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Idle Session Timeout (Minutes)</label>
              <div className="flex gap-3 mt-1">
                <input type="number" defaultValue={30} className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 max-w-[120px]" />
                <Button variant="outline" onClick={() => toast.success("Session timeout updated")}>Save</Button>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white text-sm">Force Log Out All Users</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Immediately invalidates all active sessions.</p>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => toast.success("All sessions terminated")}
              >
                Terminate All
              </Button>
            </div>
          </div>
        </SettingCard>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { ToggleLeft, Sparkles, Zap, Beaker } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/molecules/PageHeader";
import { SettingCard } from "@/components/molecules/SettingCard";
import { ActionToggle } from "@/components/molecules/ActionToggle";

export default function FeatureFlagsPage() {
  const handleToggle = (flagName: string) => async (newState: boolean) => {
    // Simulate API call
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        toast.success(`Feature flag ${newState ? 'enabled' : 'disabled'}`, {
          description: `Changes to ${flagName} will propagate to all tenants within 60 seconds.`
        });
        resolve();
      }, 800);
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
      <PageHeader 
        title="Feature Flags" 
        description="Enable or disable experimental and premium features across the platform."
        icon={ToggleLeft}
      />

      <div className="grid md:grid-cols-3 gap-6">
        <SettingCard title="AI Copilot V2" delay={0.1} icon={Sparkles} className="h-full">
          <div className="flex flex-col h-full">
            <p className="text-sm text-slate-500 mb-6 flex-1">
              Enable the new Framer Motion powered AI Copilot interface for all users.
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <ActionToggle 
                initialState={true} 
                onToggle={handleToggle("AI Copilot V2")} 
              />
            </div>
          </div>
        </SettingCard>

        <SettingCard title="Advanced Exports" delay={0.2} icon={Zap} className="h-full">
          <div className="flex flex-col h-full">
            <p className="text-sm text-slate-500 mb-6 flex-1">
              Allow exporting reports directly to Google Sheets and Tableau formats.
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <ActionToggle 
                initialState={false} 
                onToggle={handleToggle("Advanced Exports")} 
              />
            </div>
          </div>
        </SettingCard>

        <SettingCard title="Beta Analytics (V3)" delay={0.3} icon={Beaker} className="h-full">
          <div className="flex flex-col h-full">
            <p className="text-sm text-slate-500 mb-6 flex-1">
              Test the new experimental data visualization engine (unstable).
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <ActionToggle 
                initialState={false} 
                onToggle={handleToggle("Beta Analytics")} 
              />
            </div>
          </div>
        </SettingCard>
      </div>
    </div>
  );
}

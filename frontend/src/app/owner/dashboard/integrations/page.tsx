"use client";

import { Link, Database, Code, Cloud } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/molecules/PageHeader";
import { SettingCard } from "@/components/molecules/SettingCard";
import { ActionToggle } from "@/components/molecules/ActionToggle";

export default function IntegrationsPage() {
  const handleToggle = (integration: string) => async (newState: boolean) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        toast.success(`${integration} Integration ${newState ? 'Connected' : 'Disconnected'}`, {
          description: `Data sync has been ${newState ? 'started' : 'stopped'}.`
        });
        resolve();
      }, 800);
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
      <PageHeader 
        title="Integrations" 
        description="Connect your data sources, CRMs, and external analytics tools."
        icon={Link}
      />

      <div className="grid md:grid-cols-3 gap-6">
        <SettingCard title="Salesforce CRM" delay={0.1} icon={Cloud} className="h-full">
          <div className="flex flex-col h-full">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-1">
              Sync accounts, opportunities, and custom objects in real-time.
            </p>
            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-white/5">
              <ActionToggle initialState={true} onToggle={handleToggle('Salesforce')} activeLabel="Connected" inactiveLabel="Disconnected" />
            </div>
          </div>
        </SettingCard>

        <SettingCard title="Snowflake Data Cloud" delay={0.2} icon={Database} className="h-full">
          <div className="flex flex-col h-full">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-1">
              Directly query your data warehouse without moving data.
            </p>
            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-white/5">
              <ActionToggle initialState={false} onToggle={handleToggle('Snowflake')} activeLabel="Connected" inactiveLabel="Disconnected" />
            </div>
          </div>
        </SettingCard>

        <SettingCard title="Stripe Billing" delay={0.3} icon={Code} className="h-full">
          <div className="flex flex-col h-full">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-1">
              Import transaction history and subscription metrics.
            </p>
            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-white/5">
              <ActionToggle initialState={true} onToggle={handleToggle('Stripe')} activeLabel="Connected" inactiveLabel="Disconnected" />
            </div>
          </div>
        </SettingCard>
      </div>
    </div>
  );
}

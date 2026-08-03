"use client";

import { useState } from "react";
import { AnalyticsHeroBanner } from "@/components/organisms/AnalyticsHeroBanner";
import { ExecutiveKpiGrid } from "@/components/organisms/ExecutiveKpiGrid";
import { RevenueTrendChart } from "@/components/organisms/RevenueTrendChart";
import { PlatformGrowthChart } from "@/components/organisms/PlatformGrowthChart";
import { ForecastingChart } from "@/components/organisms/ForecastingChart";
import { AnomalyDetectionFeed } from "@/components/organisms/AnomalyDetectionFeed";
import { CustomerHealthMatrix } from "@/components/organisms/CustomerHealthMatrix";
import { toast } from "sonner";

export default function AnalyticsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    toast.success("Dashboard metrics refreshed");
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto min-h-[calc(100vh-theme(spacing.16))] pb-20 space-y-8">
      <AnalyticsHeroBanner onRefresh={handleRefresh} />
      
      {/* KPI Grid */}
      <ExecutiveKpiGrid key={`kpi-${refreshKey}`} />

      {/* Deep Analytics Modules (Phase 2 & 3) */}
      <div className="pt-6 space-y-8">
        
        {/* Row 1: Historical Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-white/5 rounded-3xl border border-slate-200/60 dark:border-white/10 p-6 shadow-sm">
            <RevenueTrendChart key={`revenue-${refreshKey}`} />
          </div>
          <div className="bg-white dark:bg-white/5 rounded-3xl border border-slate-200/60 dark:border-white/10 p-6 shadow-sm">
            <PlatformGrowthChart key={`growth-${refreshKey}`} />
          </div>
        </div>

        {/* Row 2: Predictive & Risk */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 bg-white dark:bg-white/5 rounded-3xl border border-slate-200/60 dark:border-white/10 p-6 shadow-sm">
            <ForecastingChart key={`forecast-${refreshKey}`} />
          </div>
          
          <div className="bg-white dark:bg-white/5 rounded-3xl border border-slate-200/60 dark:border-white/10 p-6 shadow-sm">
            <AnomalyDetectionFeed key={`anomaly-${refreshKey}`} />
          </div>
          
        </div>

        {/* Row 3: Customer Health */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white dark:bg-white/5 rounded-3xl border border-slate-200/60 dark:border-white/10 p-6 shadow-sm">
            <CustomerHealthMatrix key={`health-${refreshKey}`} />
          </div>
        </div>

      </div>
    </div>
  );
}

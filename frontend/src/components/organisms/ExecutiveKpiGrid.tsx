"use client";

import { useEffect, useState } from "react";
import { Users, Building2, Banknote, BrainCircuit, Activity } from "lucide-react";
import { MetricCard } from "@/components/molecules/MetricCard";
import { ExecutiveInsightCard } from "@/components/molecules/ExecutiveInsightCard";
import api from "@/lib/api";

export function ExecutiveKpiGrid() {
  const [data, setData] = useState<any>(null);
  const [briefing, setBriefing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, summaryRes] = await Promise.all([
          api.get("/owner/analytics/overview"),
          api.get("/owner/analytics/ai-summary")
        ]);
        
        setData(overviewRes.data.data);
        setBriefing(summaryRes.data.briefing);
      } catch (error) {
        console.error("Failed to load executive analytics", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 bg-slate-100 dark:bg-white/10 rounded-2xl animate-pulse" />
          ))}
        </div>
        <ExecutiveInsightCard briefing={null} loading={true} />
      </div>
    );
  }

  const generateSparkline = (base: number, _volatility: number) => Array.from({ length: 14 }).map((_, i) => ({ value: base, day: i }));

  return (
    <div className="space-y-8">
      {/* Top 4 Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={data.users.total.toLocaleString()}
          trend={parseFloat(data.users.trend)}
          icon={<Users className="h-5 w-5" />}
          color="blue"
          sparklineData={generateSparkline(100, 0.2)}
          delay={0.1}
        />
        
        <MetricCard
          title="Monthly Recurring Revenue"
          value={`$${data.revenue.mrr.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          trend={data.revenue.growth}
          icon={<Banknote className="h-5 w-5" />}
          color="emerald"
          sparklineData={generateSparkline(5000, 0.1)}
          delay={0.2}
        />

        <MetricCard
          title="AI Tokens Processed"
          value={data.ai.total_requests.toLocaleString()}
          trend={data.ai.growth}
          icon={<BrainCircuit className="h-5 w-5" />}
          color="violet"
          sparklineData={generateSparkline(1000, 0.4)}
          delay={0.3}
        />

        <MetricCard
          title="Active Organizations"
          value={data.organizations.active.toLocaleString()}
          trend={data.organizations.growth}
          icon={<Building2 className="h-5 w-5" />}
          color="amber"
          sparklineData={generateSparkline(50, 0.1)}
          delay={0.4}
        />
      </div>

      {/* Secondary 4 KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Monthly Active Users (MAU)"
          value={data.users.mau.toLocaleString()}
          trend={12.4}
          icon={<Activity className="h-5 w-5" />}
          color="blue"
          delay={0.5}
        />
        <MetricCard
          title="Annual Run Rate (ARR)"
          value={`$${data.revenue.arr.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          trend={data.revenue.growth}
          icon={<Banknote className="h-5 w-5" />}
          color="emerald"
          delay={0.6}
        />
        <MetricCard
          title="AI Feature Adoption"
          value={`${data.ai.feature_adoption}%`}
          trend={5.1}
          icon={<BrainCircuit className="h-5 w-5" />}
          color="violet"
          delay={0.7}
        />
        <MetricCard
          title="User Bounce Rate"
          value={`${data.platform.bounce_rate}%`}
          trend={-2.4}
          icon={<Activity className="h-5 w-5" />}
          color="rose"
          delay={0.8}
        />
      </div>

      {/* AI Executive Briefing */}
      <div className="pt-4">
        <ExecutiveInsightCard briefing={briefing} />
      </div>
    </div>
  );
}

import { MetricCard } from "@/components/molecules/MetricCard"
import { Building2, Users, Database, FileSpreadsheet, Zap, DollarSign, Activity, Server, Clock, Code, AlertTriangle, Layers, RefreshCw } from "lucide-react"

interface LiveKpiGridProps {
  analytics: any;
  aiOverview: any;
}

export function LiveKpiGrid({ analytics, aiOverview }: LiveKpiGridProps) {
  if (!analytics || !aiOverview) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="h-28 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-center"
        >
          {i === 5 ? (
            <div className="flex flex-col items-center gap-1 text-center px-4">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Metrics unavailable</p>
            </div>
          ) : (
            <div className="w-full h-full animate-pulse" />
          )}
        </div>
      ))}
    </div>
  );

  const aiKpis = aiOverview.kpis;
  const aiSparklines = aiOverview.sparklines;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      <MetricCard 
        title="Total Organizations" 
        value={analytics.organizations.total} 
        icon={<Building2 className="h-5 w-5" />} 
        trend={analytics.organizations.growth} 
        sparklineData={analytics.organizations.sparkline}
        delay={0.1} 
      />
      <MetricCard 
        title="Active Users" 
        value={analytics.users.total} 
        icon={<Users className="h-5 w-5" />} 
        trend={parseFloat(analytics.users.trend)} 
        sparklineData={analytics.users.sparkline}
        color="blue"
        delay={0.15} 
      />
      <MetricCard 
        title="Monthly Revenue (MRR)" 
        value={`$${analytics.revenue.mrr.toLocaleString()}`} 
        icon={<DollarSign className="h-5 w-5" />} 
        trend={analytics.revenue.growth} 
        sparklineData={analytics.revenue.sparkline}
        color="emerald"
        delay={0.2} 
      />
      <MetricCard 
        title="AI Tokens Used" 
        value={(aiKpis.monthly_tokens / 1000).toFixed(1) + "k"} 
        icon={<Zap className="h-5 w-5" />} 
        trend={aiOverview.sparklines?.requests ? 12.5 : 0} 
        sparklineData={aiSparklines?.requests}
        color="violet"
        delay={0.25} 
      />
      
      <MetricCard 
        title="AI Requests" 
        value={aiKpis.monthly_requests.toLocaleString()} 
        icon={<Activity className="h-5 w-5" />} 
        trend={5.2}
        trendLabel="vs last 30d" 
        sparklineData={aiSparklines?.requests}
        color="amber"
        delay={0.3} 
      />
      <MetricCard 
        title="Total Datasets" 
        value={analytics.platform.datasets} 
        icon={<Database className="h-5 w-5" />} 
        trend={5.1} 
        sparklineData={analytics.platform.sparkline}
        color="blue"
        delay={0.35} 
      />
      <MetricCard 
        title="Generated Reports" 
        value={analytics.platform.reports} 
        icon={<FileSpreadsheet className="h-5 w-5" />} 
        trend={22.4} 
        sparklineData={analytics.platform.sparkline}
        delay={0.4} 
      />
      <MetricCard 
        title="Avg Response Time" 
        value={`${aiKpis.avg_latency_ms}ms`} 
        icon={<Clock className="h-5 w-5" />} 
        trend={-12.5}
        trendLabel="faster than last week"
        sparklineData={aiSparklines?.latency}
        color="emerald"
        delay={0.45} 
      />

      <MetricCard 
        title="Active AI Models" 
        value={aiKpis.available_models} 
        icon={<Layers className="h-5 w-5" />} 
        delay={0.5} 
      />
      <MetricCard 
        title="AI Cost" 
        value={`$${aiKpis.monthly_cost_usd}`} 
        icon={<DollarSign className="h-5 w-5" />} 
        trend={-3.2}
        trendLabel="vs last month" 
        sparklineData={aiSparklines?.cost}
        color="rose"
        delay={0.55} 
      />
      <MetricCard 
        title="Success Rate" 
        value={`${aiKpis.success_rate}%`} 
        icon={<Code className="h-5 w-5" />} 
        trend={0.5} 
        sparklineData={aiSparklines?.uptime}
        color="emerald"
        delay={0.6} 
      />
      <MetricCard 
        title="Platform Bounce" 
        value={`${analytics.platform.bounce_rate}%`} 
        icon={<AlertTriangle className="h-5 w-5" />} 
        trend={-0.2} 
        color="rose"
        delay={0.65} 
      />
    </div>
  )
}

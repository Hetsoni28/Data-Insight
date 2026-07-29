import { MetricCard } from "@/components/molecules/MetricCard"
import { Building2, Users, Database, FileSpreadsheet, Zap, DollarSign, Activity, Server, Clock, Code, AlertTriangle, Layers } from "lucide-react"

interface LiveKpiGridProps {
  kpis: any;
}

export function LiveKpiGrid({ kpis }: LiveKpiGridProps) {
  if (!kpis) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      <MetricCard 
        title="Total Organizations" 
        value={kpis.organizations.total} 
        icon={Building2} 
        trend={12} 
        delay={0.1} 
      />
      <MetricCard 
        title="Active Users" 
        value={kpis.users.total} 
        icon={Users} 
        trend={8.5} 
        delay={0.15} 
      />
      <MetricCard 
        title="Monthly Revenue (MRR)" 
        value={`$${kpis.billing.mrr.toLocaleString()}`} 
        icon={DollarSign} 
        trend={15.2} 
        delay={0.2} 
      />
      <MetricCard 
        title="Active Sessions" 
        value={kpis.users.active_sessions} 
        icon={Activity} 
        trend={-2.4}
        trendLabel="vs yesterday" 
        delay={0.25} 
      />
      
      <MetricCard 
        title="AI Tokens Used" 
        value={(kpis.ai.tokens_this_month / 1000).toFixed(1) + "k"} 
        icon={Zap} 
        trend={45.8} 
        delay={0.3} 
      />
      <MetricCard 
        title="Total Datasets" 
        value={kpis.usage.total_datasets} 
        icon={Database} 
        trend={5.1} 
        delay={0.35} 
      />
      <MetricCard 
        title="Generated Reports" 
        value={kpis.usage.total_reports} 
        icon={FileSpreadsheet} 
        trend={22.4} 
        delay={0.4} 
      />
      <MetricCard 
        title="Storage Used" 
        value={`${(kpis.usage.storage_bytes / 1024 / 1024).toFixed(1)} MB`} 
        icon={Server} 
        delay={0.45} 
      />

      <MetricCard 
        title="Avg Response Time" 
        value={`${kpis.system.avg_response_time_ms}ms`} 
        icon={Clock} 
        trend={-12.5}
        trendLabel="faster than last week"
        delay={0.5} 
      />
      <MetricCard 
        title="API Requests" 
        value={kpis.ai.requests_today} 
        icon={Code} 
        trend={3.2}
        trendLabel="today" 
        delay={0.55} 
      />
      <MetricCard 
        title="Active AI Models" 
        value={kpis.ai.active_models} 
        icon={Layers} 
        delay={0.6} 
      />
      <MetricCard 
        title="Error Rate" 
        value={`${kpis.system.error_rate_percentage}%`} 
        icon={AlertTriangle} 
        trend={0.01} 
        delay={0.65} 
      />
    </div>
  )
}

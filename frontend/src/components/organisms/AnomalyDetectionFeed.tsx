"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, Activity, Cpu, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import api from "@/lib/api";

export function AnomalyDetectionFeed() {
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/owner/analytics/anomalies");
        setAnomalies(res.data.data);
      } catch (error) {
        console.error("Failed to load anomalies", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-slate-100 dark:bg-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "security": return <ShieldAlert className="h-5 w-5" />;
      case "performance": return <Activity className="h-5 w-5" />;
      default: return <Cpu className="h-5 w-5" />;
    }
  };

  const getColor = (severity: string, resolved: boolean) => {
    if (resolved) return "text-slate-400 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10";
    switch (severity) {
      case "high": return "text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20";
      case "medium": return "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20";
      default: return "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20";
    }
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-500" />
            Anomaly Detection
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Real-time platform threat and performance alerts.</p>
        </div>
      </div>
      
      <div className="flex-1 space-y-4 max-h-[380px] overflow-y-auto pr-1">
        {anomalies.map((anomaly) => {
          const theme = getColor(anomaly.severity, anomaly.resolved);
          
          return (
            <div 
              key={anomaly.id} 
              className={`p-4 rounded-2xl border transition-all ${
                anomaly.resolved 
                  ? "bg-slate-50/50 dark:bg-white/[0.02] border-slate-100 dark:border-white/5 opacity-60" 
                  : "bg-white dark:bg-white/5 shadow-sm border-slate-200/60 dark:border-white/10 hover:shadow-md"
              }`}
            >
              <div className="flex gap-4">
                <div className={`p-2.5 rounded-xl h-fit border ${theme}`}>
                  {getIcon(anomaly.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-semibold ${anomaly.resolved ? "text-slate-500 dark:text-slate-400 line-through" : "text-slate-900 dark:text-white"}`}>
                      {anomaly.title}
                    </h4>
                    <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
                      <Clock className="h-3 w-3" />
                      {new Date(anomaly.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                    {anomaly.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${theme}`}>
                      {anomaly.severity}
                    </span>
                    {anomaly.resolved && (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-500">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Resolved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

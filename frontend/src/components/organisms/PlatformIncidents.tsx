"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, Activity, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PlatformIncidentsProps {
  incidents: any[];
}

export function PlatformIncidents({ incidents }: PlatformIncidentsProps) {
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "critical": return "border-rose-500 bg-rose-50 dark:bg-rose-950/20";
      case "major": return "border-orange-500 bg-orange-50 dark:bg-orange-950/20";
      default: return "border-blue-500 bg-blue-50 dark:bg-blue-950/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "investigating": return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case "monitoring": return <Activity className="w-5 h-5 text-blue-500" />;
      case "resolved": return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      default: return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Platform Incidents</h2>
          <p className="text-sm text-slate-500 mt-0.5">Active outages and service degradation.</p>
        </div>
        <Button variant="outline" size="sm" className="h-8 w-fit shrink-0">View Status Page</Button>
      </div>

      <div className="p-6">
        {(!incidents || incidents.length === 0) ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-slate-900 dark:text-white font-medium">All Systems Operational</p>
            <p className="text-slate-500 text-sm mt-1">No active incidents reported in the last 24 hours.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {incidents.map((incident, i) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                key={incident.id}
                className={`border-l-4 rounded-r-xl p-5 border-y border-r border-slate-100 dark:border-slate-800 ${getSeverityStyles(incident.severity)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(incident.status)}
                    <h3 className="font-semibold text-slate-900 dark:text-white">{incident.title}</h3>
                  </div>
                  <Badge variant="outline" className="bg-white dark:bg-slate-900">
                    {incident.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-y-3 gap-x-6 mt-4 pt-4 border-t border-black/5 dark:border-white/5 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <Clock className="w-4 h-4" />
                    Started: {new Date(incident.started_at).toLocaleString()}
                  </div>
                  {incident.impact && (
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span className="font-medium">Impact:</span> {incident.impact}
                    </div>
                  )}
                  {incident.affected_services && incident.affected_services.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Affected:</span> 
                      <div className="flex flex-wrap gap-1.5">
                        {incident.affected_services.map((s: string) => (
                          <span key={s} className="px-2 py-0.5 bg-black/5 dark:bg-white/10 rounded text-xs font-medium text-slate-700 dark:text-slate-300">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

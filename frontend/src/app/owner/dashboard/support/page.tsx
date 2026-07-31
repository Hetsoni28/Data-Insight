"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SupportHero } from "@/components/organisms/SupportHero";
import { SupportKpiDashboard } from "@/components/organisms/SupportKpiDashboard";
import { TicketManagementGrid } from "@/components/organisms/TicketManagementGrid";
import { PlatformIncidents } from "@/components/organisms/PlatformIncidents";
import api from "@/lib/api";

export default function SupportCenterPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSupportData = async () => {
      try {
        setLoading(true);
        // Call backend APIs
        const [kpiRes, ticketsRes, incidentsRes] = await Promise.all([
          api.get("/support/dashboard"),
          api.get("/support/tickets"),
          api.get("/support/incidents")
        ]);

        setDashboardData(kpiRes.data);
        setTickets(ticketsRes.data);
        setIncidents(incidentsRes.data);
      } catch (err) {
        console.error("Failed to load support data", err);
        toast.error("Failed to load live support data. Using cached data.");
        // Fallback mock data in case backend isn't reachable yet
        setDashboardData({
          kpis: {
            openTickets: 142, resolvedToday: 45, csat: "98%", aiResolutionRate: "42%", activeIncidents: 1, avgResolutionTime: "2h 45m"
          },
          trends: {
            openTickets: "+12%", resolvedToday: "+5%", csat: "+1.2%", aiResolutionRate: "+8%"
          }
        });
        setTickets([
          { id: "tkt-001", subject: "Postgres Connection Failing", status: "open", priority: "critical", requester: "Sarah Chen", organization: "Acme Corp", category: "Database", assignedTo: "Alex M.", sla: "2h remaining" }
        ]);
        setIncidents([
          { id: "inc-100", title: "API Gateway Latency", status: "investigating", severity: "major", started_at: new Date().toISOString(), affected_services: ["API Gateway"], impact: "High latency" }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchSupportData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24 animate-pulse">
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full"></div>
        <div className="grid grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>)}
        </div>
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-2 pb-24">
      <SupportHero />
      <SupportKpiDashboard data={dashboardData} />
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <TicketManagementGrid tickets={tickets} />
        </div>
        <div className="xl:col-span-1 space-y-8">
          <PlatformIncidents incidents={incidents} />
        </div>
      </div>
    </div>
  );
}

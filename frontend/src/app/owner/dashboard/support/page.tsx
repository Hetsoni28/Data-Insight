"use client";

import { toast } from "sonner";
import { SupportHero } from "@/components/organisms/SupportHero";
import { SupportKpiDashboard } from "@/components/organisms/SupportKpiDashboard";
import { TicketManagementGrid } from "@/components/organisms/TicketManagementGrid";
import { PlatformIncidents } from "@/components/organisms/PlatformIncidents";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export default function SupportCenterPage() {
  const { data: dashboardData, isLoading: loadingDashboard } = useQuery({
    queryKey: ['support-dashboard'],
    queryFn: async () => {
      const res = await api.get("/support/dashboard");
      return res.data;
    }
  });

  const { data: tickets, isLoading: loadingTickets } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: async () => {
      const res = await api.get("/support/tickets");
      return res.data;
    }
  });

  const { data: incidents, isLoading: loadingIncidents } = useQuery({
    queryKey: ['support-incidents'],
    queryFn: async () => {
      const res = await api.get("/support/incidents");
      return res.data;
    }
  });

  const loading = loadingDashboard || loadingTickets || loadingIncidents;

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
          <TicketManagementGrid tickets={tickets || []} />
        </div>
        <div className="xl:col-span-1 space-y-8">
          <PlatformIncidents incidents={incidents || []} />
        </div>
      </div>
    </div>
  );
}

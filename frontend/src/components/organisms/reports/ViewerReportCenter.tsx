"use client";

import { useState, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ViewerReportHeader } from "./ViewerReportHeader";
import { ViewerReportKPIs } from "./ViewerReportKPIs";
import { ViewerReportFilters } from "./ViewerReportFilters";
import { ViewerReportExplorer } from "./ViewerReportExplorer";
import { ViewerReportPreview } from "./ViewerReportPreview";
import { TenantDashboardService } from "@/lib/tenant-dashboard.service";
import type { 
  ViewerReport, 
  ViewerDashboardOverview, 
  ViewerReportFiltersResponse 
} from "@/lib/tenant-dashboard.service";
import { useDebounce } from "@/hooks/useDebounce";

interface ViewerReportCenterProps {
  workspaceId: string;
}

export function ViewerReportCenter({ workspaceId }: ViewerReportCenterProps) {
  // Filters State
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [activeCategory, setActiveCategory] = useState("");
  const [activeDepartment, setActiveDepartment] = useState("");
  const [activeStatus, setActiveStatus] = useState("");
  const [isBookmarked, setIsBookmarked] = useState<boolean | undefined>(undefined);
  
  // Preview State
  const [previewReport, setPreviewReport] = useState<ViewerReport | null>(null);

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['viewer-dashboard-overview', workspaceId],
    queryFn: () => TenantDashboardService.getDashboardOverview(workspaceId),
  });

  const { data: filtersData, isLoading: loadingFilters } = useQuery({
    queryKey: ['viewer-report-filters', workspaceId],
    queryFn: () => TenantDashboardService.getReportFilters(workspaceId),
  });

  const { data: reportsData, isLoading: loadingReports, refetch: fetchReports } = useQuery({
    queryKey: ['viewer-reports', workspaceId, debouncedSearch, activeCategory, activeDepartment, activeStatus, isBookmarked],
    queryFn: () => TenantDashboardService.listReports(workspaceId, {
      search: debouncedSearch,
      category: activeCategory,
      department: activeDepartment,
      status: activeStatus,
      is_bookmarked: isBookmarked,
    }),
  });

  const reports = reportsData?.items || [];
  const loading = loadingOverview || loadingFilters || loadingReports;
  const refreshing = false; // With React Query, we can use isFetching if needed, but we'll simplify this

  const handleFilterChange = useCallback((key: string, value: any) => {
    if (key === "category") setActiveCategory(value);
    else if (key === "department") setActiveDepartment(value);
    else if (key === "status") setActiveStatus(value);
    else if (key === "is_bookmarked") setIsBookmarked(value);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setActiveCategory("");
    setActiveDepartment("");
    setActiveStatus("");
    setIsBookmarked(undefined);
  }, []);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <ViewerReportHeader 
        workspaceName={overview?.welcome?.workspace_name || ""}
        search={search}
        setSearch={setSearch}
        isLoading={loading || refreshing}
      />
      
      <ViewerReportKPIs 
        kpis={overview?.kpis}
        isLoading={!overview}
        onFilterChange={handleFilterChange}
      />
      
      <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/10 p-6 shadow-sm min-h-[500px]">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Report Explorer</h2>
          <ViewerReportFilters 
            filters={filtersData || null}
            activeCategory={activeCategory}
            activeDepartment={activeDepartment}
            activeStatus={activeStatus}
            onChange={handleFilterChange}
          />
        </div>
        
        <ViewerReportExplorer 
          reports={reports}
          isLoading={loading}
          onRefresh={handleClearFilters}
          onPreview={setPreviewReport}
        />
      </div>

      {previewReport && (
        <ViewerReportPreview 
          report={previewReport} 
          onClose={() => setPreviewReport(null)} 
        />
      )}
    </div>
  );
}

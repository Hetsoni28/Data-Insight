"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ViewerReportHeader } from "./ViewerReportHeader";
import { ViewerReportKPIs } from "./ViewerReportKPIs";
import { ViewerReportFilters } from "./ViewerReportFilters";
import { ViewerReportExplorer } from "./ViewerReportExplorer";
import { ViewerReportPreview } from "./ViewerReportPreview";
import { ViewerService } from "@/lib/viewer.service";
import type { 
  ViewerReport, 
  ViewerDashboardOverview, 
  ViewerReportFiltersResponse 
} from "@/lib/viewer.service";
import { useDebounce } from "@/hooks/useDebounce";

interface ViewerReportCenterProps {
  workspaceId: string;
}

export function ViewerReportCenter({ workspaceId }: ViewerReportCenterProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data
  const [reports, setReports] = useState<ViewerReport[]>([]);
  const [overview, setOverview] = useState<ViewerDashboardOverview | null>(null);
  const [filtersData, setFiltersData] = useState<ViewerReportFiltersResponse | null>(null);
  
  // Filters State
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [activeCategory, setActiveCategory] = useState("");
  const [activeDepartment, setActiveDepartment] = useState("");
  const [activeStatus, setActiveStatus] = useState("");
  const [isBookmarked, setIsBookmarked] = useState<boolean | undefined>(undefined);
  
  // Preview State
  const [previewReport, setPreviewReport] = useState<ViewerReport | null>(null);

  const fetchReports = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await ViewerService.listReports(workspaceId, {
        search: debouncedSearch,
        category: activeCategory,
        department: activeDepartment,
        status: activeStatus,
        is_bookmarked: isBookmarked,
      });
      setReports(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workspaceId, debouncedSearch, activeCategory, activeDepartment, activeStatus, isBookmarked]);

  const fetchStaticData = useCallback(async () => {
    try {
      const [o, f] = await Promise.all([
        ViewerService.getDashboardOverview(workspaceId),
        ViewerService.getReportFilters(workspaceId)
      ]);
      setOverview(o);
      setFiltersData(f);
    } catch (err) {
      console.error(err);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchStaticData();
  }, [fetchStaticData]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleFilterChange = (key: string, value: any) => {
    if (key === "category") setActiveCategory(value);
    else if (key === "department") setActiveDepartment(value);
    else if (key === "status") setActiveStatus(value);
    else if (key === "is_bookmarked") setIsBookmarked(value);
  };

  const handleClearFilters = () => {
    setSearch("");
    setActiveCategory("");
    setActiveDepartment("");
    setActiveStatus("");
    setIsBookmarked(undefined);
    fetchReports(true);
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <ViewerReportHeader 
        workspaceName={overview?.welcome.workspace_name || ""}
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
            filters={filtersData}
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

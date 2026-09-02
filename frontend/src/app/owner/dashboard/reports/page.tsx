import dynamic from "next/dynamic"
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Plus, FileSpreadsheet } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { Report, ReportService } from "@/lib/report.service";
import { Button } from "@/components/ui/button";



const ReportTable = dynamic(() => import('@/components/organisms/ReportTable').then(m => m.ReportTable), { ssr: false })
const GenerateReportDialog = dynamic(() => import('@/components/organisms/GenerateReportDialog').then(m => m.GenerateReportDialog), { ssr: false })

export default function ReportsPage() {
  const { activeWs } = useWorkspaceStore();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchReports = async () => {
    if (!activeWs?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await ReportService.list(activeWs.id);
      setReports(data);
    } catch (error) {
      console.error("Failed to fetch reports", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch when workspace changes
    fetchReports();
  }, [activeWs?.id]); // Only run when workspace changes

  useEffect(() => {
    // Polling mechanism if any report is still generating
    const hasPendingReports = Array.isArray(reports) && reports.some(
      (r) => r.status?.toUpperCase() === "PENDING" || r.status?.toUpperCase() === "GENERATING"
    );

    let intervalId: NodeJS.Timeout;
    if (hasPendingReports && activeWs?.id) {
      intervalId = setInterval(() => {
        ReportService.list(activeWs.id).then(setReports).catch(console.error);
      }, 5000); // poll every 5 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeWs?.id, reports]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
            AI Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate executive summaries, financial breakdowns, and AI insights from your datasets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReports}
            disabled={isLoading || !activeWs}
            className="h-9 px-3 gap-2 rounded-lg"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="h-9 px-4 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
            disabled={!activeWs}
          >
            <Plus className="h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <ReportTable 
          reports={reports} 
          isLoading={isLoading} 
          onRefresh={fetchReports}
          onGenerate={() => setIsDialogOpen(true)}
        />
      </motion.div>

      <GenerateReportDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        onReportGenerated={fetchReports} 
      />
    </div>
  );
}

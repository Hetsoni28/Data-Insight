"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2, FileSpreadsheet, Download, Trash2, FileText, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Report, ReportService } from "@/lib/report.service";
import { StateLayout } from "@/components/molecules/StateLayout";
import { NoReportsIllustration } from "@/components/molecules/NoReportsIllustration";
import { LoadingPulse } from "@/components/molecules/LoadingPulse";
import api from "@/lib/api";
import { Plus } from "lucide-react";
import { PaginationControls } from "@/components/molecules/PaginationControls";

interface ReportTableProps {
  reports: Report[];
  isLoading: boolean;
  onRefresh: () => void;
  onGenerate?: () => void;
}

export function ReportTable({ reports, isLoading, onRefresh, onGenerate }: ReportTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const safeReports = Array.isArray(reports) ? reports : [];
  const totalItems = safeReports.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedReports = safeReports.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const handleDelete = async (reportId: string) => {
    if (!window.confirm("Are you sure you want to delete this report?")) {
      return;
    }
    try {
      await ReportService.delete(reportId);
      toast.success("Report deleted successfully");
      onRefresh();
    } catch (error) {
      console.error("Failed to delete report", error);
    }
  };

  const handleDownload = async (reportId: string, reportTitle?: string) => {
    const toastId = `dl-${reportId}`
    toast.loading("Preparing download...", { id: toastId })
    try {
      const res = await api.get(`/tenant-reports/${reportId}/download`, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${(reportTitle || "Report").replace(/[^a-z0-9_\-]/gi, "_")}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success("Download complete!", { id: toastId })
    } catch (e: any) {
      const detail = e?.response?.data instanceof Blob
        ? await e.response.data.text().then((t: string) => { try { return JSON.parse(t).detail } catch { return t } })
        : e?.message
      toast.error(detail || "Failed to download report", { id: toastId })
    }
  };

  const getStatusBadge = (status: string, progress: number) => {
    switch (status.toUpperCase()) {
      case "PENDING":
      case "GENERATING":
        return (
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-800 border-emerald-200">
            <Loader2 className="mr-1 h-3 w-3 animate-spin inline-block" /> 
            {progress}%
          </Badge>
        );
      case "COMPLETED":
      case "READY":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Ready
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" /> Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5">
        <LoadingPulse messages={["Fetching reports...", "Analyzing insights...", "Generating executive summaries..."]} />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5">
        <StateLayout
          illustration={<NoReportsIllustration />}
          headline="No Reports Yet"
          description="Generate your first AI-powered executive report from your uploaded datasets."
          primaryAction={{
            label: "Generate Report",
            icon: <Plus className="w-4 h-4" />,
            onClick: onGenerate || (() => {}),
          }}
          secondaryAction={{
            label: "Upload Dataset",
            icon: <FileSpreadsheet className="w-4 h-4" />,
            onClick: () => { window.location.href = "/dashboard/datasets"; },
          }}
          aiSuggestion="AI can automatically find correlations in your dataset."
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50 dark:bg-white/5 border-b border-slate-200/60 dark:border-white/10">
          <TableRow>
            <TableHead>Report Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>AI Tokens</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[120px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedReports.map((report) => (
            <TableRow key={report.id}>
              <TableCell className="font-medium">
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  <span>{report.title}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="uppercase text-xs">{report.report_type}</Badge>
              </TableCell>
              <TableCell>{getStatusBadge(report.status, report.progress)}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {(report.ai_tokens_used || 0).toLocaleString()}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {report.created_at ? format(new Date(report.created_at), "MMM d, yyyy") : "N/A"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                    disabled={report.status.toUpperCase() !== "READY" && report.status.toUpperCase() !== "COMPLETED"}
                    onClick={() => handleDownload(report.id, report.title)}
                    title="Download Report"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(report.id)}
                    title="Delete Report"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {reports.length > 0 && (
        <PaginationControls 
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}

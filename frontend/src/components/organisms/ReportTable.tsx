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

interface ReportTableProps {
  reports: Report[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function ReportTable({ reports, isLoading, onRefresh }: ReportTableProps) {
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

  const handleDownload = (outputUrl: string | null) => {
    if (!outputUrl) {
      toast.error("Download link is not available yet.");
      return;
    }
    window.open(outputUrl, "_blank");
  };

  const getStatusBadge = (status: string, progress: number) => {
    switch (status.toUpperCase()) {
      case "PENDING":
      case "GENERATING":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
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
      <div className="rounded-xl border p-12 flex flex-col items-center justify-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary/50" />
        <p className="text-sm">Loading reports...</p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 flex flex-col items-center justify-center text-center">
        <div className="rounded-full bg-muted p-3 mb-4">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-lg mb-1">No reports generated</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Select a dataset and click "Generate Report" to let AI create an executive summary for you.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
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
          {reports.map((report) => (
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
                {report.ai_tokens_used.toLocaleString()}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {format(new Date(report.created_at), "MMM d, yyyy")}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                    disabled={!report.output_url || report.status.toUpperCase() !== "READY" && report.status.toUpperCase() !== "COMPLETED"}
                    onClick={() => handleDownload(report.output_url)}
                    title="Download Report"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-destructive hover:bg-destructive/10"
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
    </div>
  );
}

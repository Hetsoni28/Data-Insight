"use client";

import { useState, useEffect } from "react";
import { Loader2, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReportService } from "@/lib/report.service";
import { DatasetService, Dataset } from "@/lib/dataset.service";
import { useWorkspaceStore } from "@/store/workspaceStore";

interface GenerateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReportGenerated: () => void;
  defaultCategory?: string;
  defaultDatasetId?: string;
}

export function GenerateReportDialog({ open, onOpenChange, onReportGenerated, defaultCategory = "executive", defaultDatasetId }: GenerateReportDialogProps) {
  const { activeWs } = useWorkspaceStore();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(false);

  const [selectedDatasetId, setSelectedDatasetId] = useState(defaultDatasetId || "");
  const [title, setTitle] = useState("");
  const [reportType, setReportType] = useState("excel");
  const [reportCategory, setReportCategory] = useState(defaultCategory);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && activeWs) {
      fetchDatasets();
      setReportCategory(defaultCategory);
      if (defaultDatasetId) setSelectedDatasetId(defaultDatasetId);
    }
  }, [open, activeWs, defaultCategory, defaultDatasetId]);

  const fetchDatasets = async () => {
    if (!activeWs) return;
    setIsLoadingDatasets(true);
    try {
      const data = await DatasetService.list(activeWs.id);
      setDatasets(data);
      if (!defaultDatasetId && data.length > 0) {
        setSelectedDatasetId(data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch datasets", error);
    } finally {
      setIsLoadingDatasets(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDatasetId) {
      toast.error("Please select a dataset.");
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter a report title.");
      return;
    }

    setIsSubmitting(true);
    try {
      await ReportService.generate(selectedDatasetId, title, reportType, reportCategory);
      toast.success("Report generation started! This may take a minute.");
      onReportGenerated();
      onOpenChange(false);
      setTitle("");
    } catch (error: any) {
      console.error("Failed to generate report", error);
      toast.error(error.response?.data?.detail || "Failed to generate report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            Generate New Report
          </DialogTitle>
          <DialogDescription>
            Our AI will analyze your dataset and generate a professional report.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="dataset">Source Dataset</Label>
            {isLoadingDatasets ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading datasets...
              </div>
            ) : datasets.length === 0 ? (
              <div className="text-sm text-destructive border border-destructive/20 bg-destructive/10 p-2 rounded-md">
                No datasets found. Please upload a dataset first.
              </div>
            ) : (
              <select
                id="dataset"
                value={selectedDatasetId}
                onChange={(e) => setSelectedDatasetId(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled>Select a dataset...</option>
                {datasets.map((ds) => (
                  <option key={ds.id} value={ds.id}>
                    {ds.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Report Title</Label>
            <Input
              id="title"
              placeholder="e.g. Q3 Sales Analysis"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Report Type</Label>
            <select
              id="category"
              value={reportCategory}
              onChange={(e) => setReportCategory(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              disabled={isSubmitting}
            >
              <option value="executive">Executive Summary (JSON + UI)</option>
              <option value="ai-insight">AI Analysis Report (JSON + UI)</option>
              <option value="dashboard">BI Dashboard Layout (JSON + UI)</option>
              <option value="forecast">Trend Forecast (JSON + UI)</option>
              <option value="excel">Full AI Excel Workbook (.xlsx)</option>
            </select>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || datasets.length === 0} className="bg-emerald-600 hover:bg-emerald-700">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                </>
              ) : (
                "Generate Report"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

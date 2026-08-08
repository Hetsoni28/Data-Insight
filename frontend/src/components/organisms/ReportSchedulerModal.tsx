"use client";

import { useState, useEffect } from "react";
import { Loader2, CalendarClock } from "lucide-react";
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
import { ReportScheduleService } from "@/lib/report.service";
import { DatasetService, Dataset } from "@/lib/dataset.service";
import { useWorkspaceStore } from "@/store/workspaceStore";

interface ReportSchedulerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScheduleCreated: () => void;
}

export function ReportSchedulerModal({ open, onOpenChange, onScheduleCreated }: ReportSchedulerModalProps) {
  const { activeWs } = useWorkspaceStore();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(false);

  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [name, setName] = useState("");
  const [reportCategory, setReportCategory] = useState("executive");
  const [cronExpression, setCronExpression] = useState("0 9 * * 1"); // Default: Monday at 9AM
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && activeWs) {
      fetchDatasets();
    }
  }, [open, activeWs]);

  const fetchDatasets = async () => {
    if (!activeWs) return;
    setIsLoadingDatasets(true);
    try {
      const data = await DatasetService.list(activeWs.id);
      setDatasets(data);
      if (data.length > 0) {
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
    if (!name.trim()) {
      toast.error("Please enter a schedule name.");
      return;
    }

    setIsSubmitting(true);
    try {
      await ReportScheduleService.create({
        name,
        dataset_id: selectedDatasetId,
        report_category: reportCategory,
        cron_expression: cronExpression
      });
      toast.success("Report schedule created successfully!");
      onScheduleCreated();
      onOpenChange(false);
      setName("");
    } catch (error: any) {
      console.error("Failed to create schedule", error);
      toast.error(error.response?.data?.detail || "Failed to create schedule");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-emerald-600" />
            Schedule AI Report
          </DialogTitle>
          <DialogDescription>
            Configure a template to automatically generate AI reports on a recurring schedule.
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
            <Label htmlFor="name">Schedule Name</Label>
            <Input
              id="name"
              placeholder="e.g. Weekly Sales Summary"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Report Category / Template</Label>
            <select
              id="category"
              value={reportCategory}
              onChange={(e) => setReportCategory(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              disabled={isSubmitting}
            >
              <option value="executive">Executive Summary</option>
              <option value="dashboard">BI Dashboard Data</option>
              <option value="forecast">Trend & Forecast</option>
              <option value="ai-insight">Deep AI Insight</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cron">Schedule Interval (CRON Format)</Label>
            <select
              id="cron"
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              disabled={isSubmitting}
            >
              <option value="0 9 * * *">Daily at 9:00 AM</option>
              <option value="0 9 * * 1">Weekly (Monday 9:00 AM)</option>
              <option value="0 9 1 * *">Monthly (1st of Month 9:00 AM)</option>
              <option value="0 * * * *">Every Hour</option>
            </select>
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || datasets.length === 0} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Schedule"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

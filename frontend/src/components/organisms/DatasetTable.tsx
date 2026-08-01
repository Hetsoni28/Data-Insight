"use client";

import * as React from "react";
import { format } from "date-fns";
import { Loader2, FileText, Download, Trash2, Database, AlertCircle } from "lucide-react";
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
import { Dataset, DatasetService } from "@/lib/dataset.service";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { StateLayout } from "@/components/molecules/StateLayout";
import { NoDatasetsIllustration } from "@/components/molecules/NoDatasetsIllustration";
import { Plus } from "lucide-react";
import { LoadingPulse } from "@/components/molecules/LoadingPulse";
import { useState, useMemo } from "react";
import { PaginationControls } from "@/components/molecules/PaginationControls";

interface DatasetTableProps {
  datasets: Dataset[];
  isLoading: boolean;
  onRefresh: () => void;
  onUpload?: () => void;
}

export function DatasetTable({ datasets, isLoading, onRefresh, onUpload }: DatasetTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const totalItems = datasets.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedDatasets = useMemo(() =>
    datasets.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [datasets, currentPage, pageSize]
  );
  const handleDelete = async (datasetId: string) => {
    if (!window.confirm("Are you sure you want to delete this dataset? This action cannot be undone.")) {
      return;
    }
    
    try {
      await DatasetService.delete(datasetId);
      toast.success("Dataset deleted successfully");
      onRefresh();
    } catch (error) {
      console.error("Failed to delete dataset", error);
    }
  };

  const handleDownload = async (datasetId: string) => {
    try {
      const url = await DatasetService.getDownloadUrl(datasetId);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Failed to get download URL", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "PROFILING":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">Profiling <Loader2 className="ml-1 h-3 w-3 animate-spin inline-block" /></Badge>;
      case "READY":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200">Ready</Badge>;
      case "FAILED":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50">
        <LoadingPulse messages={["Fetching datasets...", "Connecting to secure vault...", "Preparing workspace..."]} />
      </div>
    );
  }

  if (datasets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50">
        <StateLayout
          illustration={<NoDatasetsIllustration />}
          headline="Your Workspace is Ready"
          description="Upload your first dataset and let AI discover meaningful insights automatically."
          primaryAction={{
            label: "Upload Dataset",
            icon: <Plus className="w-4 h-4" />,
            onClick: onUpload || (() => {}),
          }}
          aiSuggestion="CSV, Excel, JSON, and SQL formats are fully supported."
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Dataset Name</TableHead>
            <TableHead>Format</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Rows</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedDatasets.map((dataset) => (
            <TableRow key={dataset.id}>
              <TableCell className="font-medium">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{dataset.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="uppercase text-xs">{dataset.file_type}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatBytes(dataset.file_size_bytes)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {dataset.row_count ? dataset.row_count.toLocaleString() : "-"}
              </TableCell>
              <TableCell>{getStatusBadge(dataset.status)}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {format(new Date(dataset.created_at), "MMM d, yyyy")}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleDownload(dataset.id)}>
                      <Download className="mr-2 h-4 w-4" /> Download Raw File
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled>
                      <AlertCircle className="mr-2 h-4 w-4" /> View AI Profile (Soon)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDelete(dataset.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Dataset
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {datasets.length > 0 && (
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

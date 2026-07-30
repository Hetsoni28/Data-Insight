"use client";

import { useState } from "react";
import { HardDrive, UploadCloud, FileType, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/molecules/PageHeader";
import { SettingCard } from "@/components/molecules/SettingCard";
import { DataTable, Column } from "@/components/molecules/DataTable";
import { Button } from "@/components/ui/button";

const MOCK_FILES = [
  { id: "f1", name: "q3_financial_report.csv", size: "2.4 MB", uploaded: "2 hours ago", type: "CSV" },
  { id: "f2", name: "user_metrics_2025.json", size: "15.1 MB", uploaded: "1 day ago", type: "JSON" },
  { id: "f3", name: "marketing_campaigns.xlsx", size: "8.9 MB", uploaded: "3 days ago", type: "XLSX" },
];

export default function StoragePage() {
  const handleDownload = () => toast.success("Download started");
  const handleDelete = () => toast.error("File deleted permanently");

  const columns: Column<typeof MOCK_FILES[0]>[] = [
    { 
      header: "File Name", 
      className: "font-medium text-slate-900",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileType className="h-4 w-4" />
          </div>
          {row.name}
        </div>
      )
    },
    { header: "Type", accessorKey: "type", className: "text-slate-500" },
    { header: "Size", accessorKey: "size", className: "text-slate-500 font-mono text-xs" },
    { header: "Uploaded", accessorKey: "uploaded", className: "text-slate-500" },
    { 
      header: "Actions", 
      className: "text-right",
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={handleDownload} className="h-8 w-8 text-slate-400 hover:text-emerald-600 transition-colors">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDelete} className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
      <PageHeader 
        title="Storage & Data" 
        description="Manage datasets, view storage quotas, and handle file retention."
        icon={HardDrive}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <SettingCard title="Storage Quota" delay={0.1} className="lg:col-span-1 h-fit">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Used Storage</span>
              <span className="font-semibold text-slate-900">45.2 GB <span className="text-slate-400 font-normal">/ 100 GB</span></span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '45%' }}></div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              You have used 45% of your Enterprise plan storage quota.
            </p>
            <Button variant="outline" className="w-full mt-4" onClick={() => toast.info("Upgrade dialog opened")}>
              <UploadCloud className="w-4 h-4 mr-2" />
              Upgrade Storage
            </Button>
          </div>
        </SettingCard>

        <SettingCard title="Uploaded Datasets" delay={0.2} className="lg:col-span-2">
          <DataTable 
            columns={columns} 
            data={MOCK_FILES} 
            emptyMessage="No files uploaded yet." 
          />
        </SettingCard>
      </div>
    </div>
  );
}

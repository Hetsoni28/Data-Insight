"use client";

import { Activity, Search, Filter, Download } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/molecules/PageHeader";
import { SettingCard } from "@/components/molecules/SettingCard";
import { DataTable, Column } from "@/components/molecules/DataTable";
import { Button } from "@/components/ui/button";

const MOCK_LOGS = [
  { id: 1, action: "API Key Generated", user: "Admin", ip: "192.168.1.1", time: "2 mins ago", status: "success" },
  { id: 2, action: "Failed Login Attempt", user: "unknown@example.com", ip: "45.22.11.9", time: "15 mins ago", status: "failed" },
  { id: 3, action: "Dataset Uploaded", user: "Data Scientist", ip: "192.168.1.5", time: "1 hour ago", status: "success" },
  { id: 4, action: "Workspace Settings Changed", user: "Admin", ip: "192.168.1.1", time: "3 hours ago", status: "success" },
  { id: 5, action: "User Invited", user: "Admin", ip: "192.168.1.1", time: "1 day ago", status: "success" },
];

export default function AuditLogsPage() {
  const handleExport = () => {
    toast.success("Audit Logs Exported", {
      description: "A CSV file has been downloaded to your machine."
    });
  };

  const columns: Column<typeof MOCK_LOGS[0]>[] = [
    { header: "Action", accessorKey: "action", className: "font-medium text-slate-900" },
    { header: "User", accessorKey: "user", className: "text-slate-500" },
    { header: "IP Address", accessorKey: "ip", className: "font-mono text-slate-400 text-xs" },
    { header: "Time", accessorKey: "time", className: "text-slate-500" },
    { 
      header: "Status", 
      className: "text-right",
      cell: (row) => (
        <div className="flex justify-end">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            row.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}>
            {row.status === 'success' ? 'Success' : 'Failed'}
          </span>
        </div>
      )
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
      <PageHeader 
        title="Audit Logs" 
        description="Track all administrative actions, security events, and data modifications."
        icon={Activity}
        action={
          <Button onClick={handleExport} variant="outline" className="bg-white">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        }
      />

      <SettingCard title="System Events" delay={0.1}>
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search logs by action, user, or IP..." 
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
            />
          </div>
          <Button variant="outline" className="rounded-xl" onClick={() => toast.info("Filter menu opened")}>
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        <DataTable 
          columns={columns} 
          data={MOCK_LOGS} 
          emptyMessage="No audit logs recorded yet." 
        />
      </SettingCard>
    </div>
  );
}

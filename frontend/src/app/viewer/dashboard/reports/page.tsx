"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { ViewerReportCenter } from "@/components/organisms/reports/ViewerReportCenter";
import { AlertCircle } from "lucide-react";

export default function ViewerReportsPage() {
  const { activeWs } = useWorkspaceStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!activeWs) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Select a Workspace</h2>
        <p className="text-slate-500 mt-2 text-center max-w-md">
          Please select an active workspace from the sidebar to view your reports.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full min-h-screen">
      <ViewerReportCenter workspaceId={activeWs.id} />
    </div>
  );
}

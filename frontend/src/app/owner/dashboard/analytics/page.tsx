"use client";

import { StateLayout } from "@/components/molecules/StateLayout";
import { AnalyticsComingSoonIllustration } from "@/components/molecules/AnalyticsComingSoonIllustration";
import { LineChart } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AnalyticsPage() {
  const router = useRouter();

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-theme(spacing.16))] flex flex-col">
      <div className="flex items-center justify-between shrink-0 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <LineChart className="h-6 w-6 text-orange-600" />
            Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Deep dive into your organization's KPIs and predictive models.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <StateLayout
          illustration={<AnalyticsComingSoonIllustration />}
          headline="Analytics Coming Soon"
          description="We're currently training our AI models to provide you with advanced predictive analytics. In the meantime, upload your data to unlock insights."
          primaryAction={{
            label: "Upload Data",
            onClick: () => router.push("/dashboard/datasets"),
          }}
          aiSuggestion="AI models are training on your uploaded datasets."
        />
      </div>
    </div>
  );
}

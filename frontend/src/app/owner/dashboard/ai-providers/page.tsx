"use client";

import { AiOpsHeroBanner } from "@/components/organisms/AiOpsHeroBanner";
import { AiOpsOperationsCenter } from "@/components/organisms/AiOpsOperationsCenter";

export default function AiProvidersPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-br dark:from-[#0a0a0f] dark:via-[#0f0e1a] dark:to-[#0a0a0f]">
      <div className="p-6 max-w-7xl mx-auto pb-24 space-y-6">
        {/* Hero Banner with Live KPIs */}
        <AiOpsHeroBanner />

        {/* Operations Center: Providers, Models, Routing */}
        <AiOpsOperationsCenter />
      </div>
    </div>
  );
}

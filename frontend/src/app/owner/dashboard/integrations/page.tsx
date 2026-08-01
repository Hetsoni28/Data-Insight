"use client";

import { IntegrationsHeroBanner } from "@/components/organisms/IntegrationsHeroBanner";
import { IntegrationsOperationsCenter } from "@/components/organisms/IntegrationsOperationsCenter";

export default function IntegrationsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24 min-h-screen">
      <IntegrationsHeroBanner />
      <IntegrationsOperationsCenter />
    </div>
  );
}

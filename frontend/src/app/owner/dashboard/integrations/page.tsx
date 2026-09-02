"use client";
import dynamic from "next/dynamic"




const IntegrationsHeroBanner = dynamic(() => import('@/components/organisms/IntegrationsHeroBanner').then(m => m.IntegrationsHeroBanner), { ssr: false })
const IntegrationsOperationsCenter = dynamic(() => import('@/components/organisms/IntegrationsOperationsCenter').then(m => m.IntegrationsOperationsCenter), { ssr: false })

export default function IntegrationsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24 min-h-screen">
      <IntegrationsHeroBanner />
      <IntegrationsOperationsCenter />
    </div>
  );
}

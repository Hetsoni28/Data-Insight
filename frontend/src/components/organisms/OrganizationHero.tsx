import { Button } from "@/components/ui/button"
import { Building2, UploadCloud, FileSpreadsheet, LayoutDashboard, Sparkles, Plus } from "lucide-react"

export function OrganizationHero({ overview, user }: { overview: any, user: any }) {
  if (!overview) return null

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#133E2E] dark:bg-emerald-950/30 border-0 dark:border dark:border-emerald-900/50 p-8 md:p-10 shadow-xl">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3">
        <div className="h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl"></div>
      </div>
      
      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {overview.platform_status}
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              {overview.greeting}
            </h1>
            
            <p className="text-emerald-100 text-lg max-w-xl">
              You are managing <span className="font-semibold text-white">{overview.organization_name}</span> on the <span className="font-semibold text-white capitalize">{overview.subscription_plan}</span> plan. Here&apos;s your enterprise command center.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <Button size="lg" className="bg-white text-emerald-500 hover:bg-emerald-50 shadow-lg rounded-xl h-12 px-6 font-semibold">
              <UploadCloud className="mr-2 h-5 w-5" />
              Upload Dataset
            </Button>
            <Button size="lg" className="bg-emerald-500/20 hover:bg-emerald-500/30 text-white border-0 shadow-none backdrop-blur-md rounded-xl h-12 px-6">
              <Sparkles className="mr-2 h-5 w-5 text-emerald-200" />
              Ask AI Copilot
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

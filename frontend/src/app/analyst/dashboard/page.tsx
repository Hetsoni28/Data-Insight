import { Building2 } from "lucide-react"

export default function AnalystDashboard() {
  return (
    <div className="flex-1 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Analyst Dashboard</h1>
          <p className="text-slate-500 mt-2">Welcome to the Analyst view.</p>
        </div>
        
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Clean Canvas</h2>
          <p className="text-slate-500 max-w-sm mx-auto mt-2">
            This dashboard is completely isolated for the Analyst role. You can start adding components specific to this role here.
          </p>
        </div>
      </div>
    </div>
  )
}

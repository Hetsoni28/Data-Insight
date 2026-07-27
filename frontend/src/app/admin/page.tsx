"use client"
import { motion } from "framer-motion"
import { Users, Building2, Activity, Database } from "lucide-react"
import { DashboardStatCard } from "@/components/organisms/DashboardStatCard"

export default function AdminDashboardPage() {
  return (
    <div className="px-8 py-7 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor all platform metrics and tenant activity.</p>
      </div>

      {/* Stat cards using the existing reusable DashboardStatCard */}
      <div className="grid grid-cols-4 gap-4">
        <DashboardStatCard icon={Building2}  label="Total Tenants"   value="24"     sub="+3 this week"      color="bg-indigo-500"  />
        <DashboardStatCard icon={Users}      label="Active Users"    value="1,204"  sub="+124 this week"    color="bg-purple-500"  />
        <DashboardStatCard icon={Database}   label="Data Processed"  value="1.2 TB" sub="+50 GB today"      color="bg-blue-500"    />
        <DashboardStatCard icon={Activity}   label="System Status"   value="99.9%"  sub="All systems operational" color="bg-emerald-500" />
      </div>

      {/* Placeholder for Recent Activity Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Recent Tenant Activity</h2>
          <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700">View all</button>
        </div>
        <div className="p-12 flex flex-col items-center justify-center text-center">
          <Activity className="h-10 w-10 text-slate-300 mb-3" />
          <h3 className="text-sm font-medium text-slate-900">No recent activity</h3>
          <p className="text-xs text-slate-500 mt-1">When tenants perform actions, they will appear here.</p>
        </div>
      </motion.div>
    </div>
  )
}

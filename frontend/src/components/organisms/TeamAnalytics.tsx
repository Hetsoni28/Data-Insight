"use client"

import { motion } from "framer-motion"
import { BarChart3, PieChart } from "lucide-react"
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartTooltip } from "@/components/molecules/ChartTooltip"

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#06B6D4', '#F43F5E']

export function TeamAnalytics({ members, departments }: { members: any[], departments: any[] }) {
  // Aggregate data for roles
  const roleCounts: Record<string, number> = {}
  members.forEach(m => {
    const formattedRole = m.role ? m.role.replace(/_/g, ' ').toUpperCase() : 'UNKNOWN'
    roleCounts[formattedRole] = (roleCounts[formattedRole] || 0) + 1
  })
  
  const roleData = Object.keys(roleCounts).map(role => ({
    name: role,
    value: roleCounts[role]
  }))

  // Aggregate data for departments
  const deptCounts: Record<string, number> = {}
  members.forEach(m => {
    const dName = m.department || "Unassigned"
    deptCounts[dName] = (deptCounts[dName] || 0) + 1
  })
  
  const deptData = Object.keys(deptCounts).map(d => ({
    name: d,
    count: deptCounts[d]
  }))

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
          <BarChart3 className="w-5 h-5 text-emerald-500" />
          Workforce Analytics
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Distribution of roles and departments across the organization.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Role Distribution */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-500/20">
              <PieChart className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
              Role Distribution
            </h4>
          </div>
          <div className="h-[300px]">
            {roleData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {roleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend 
                    iconType="circle" 
                    iconSize={8} 
                    wrapperStyle={{ fontSize: 11, paddingTop: 12 }} 
                    formatter={(value) => <span className="text-slate-600 dark:text-slate-400 font-semibold ml-1 mr-2">{value}</span>} 
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400 font-medium">No data available</div>
            )}
          </div>
        </motion.div>

        {/* Department Distribution */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
              Department Distribution
            </h4>
          </div>
          <div className="h-[300px]">
            {deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Members" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400 font-medium">No data available</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

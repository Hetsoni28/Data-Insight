import { BarChart3, PieChart } from "lucide-react"
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6']

export function TeamAnalytics({ members, departments }: { members: any[], departments: any[] }) {
  // Aggregate data for roles
  const roleCounts: Record<string, number> = {}
  members.forEach(m => {
    roleCounts[m.role] = (roleCounts[m.role] || 0) + 1
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
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-500" />
          Workforce Analytics
        </h3>
        <p className="text-sm text-slate-500">Distribution of roles and departments across the organization.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Role Distribution */}
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-6 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-slate-400" />
            Role Distribution
          </h4>
          <div className="h-[300px]">
            {roleData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {roleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">No data available</div>
            )}
          </div>
        </div>

        {/* Department Distribution */}
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-6 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            Department Distribution
          </h4>
          <div className="h-[300px]">
            {deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">No data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

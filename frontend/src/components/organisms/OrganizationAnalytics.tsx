import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import api from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from "recharts"

export function OrganizationAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-tenant-analytics'],
    queryFn: async () => {
      const res = await api.get('/admin/tenants/analytics')
      return res.data
    },
    refetchInterval: 60000
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    )
  }

  const COLORS = ['#0f766e', '#0ea5e9', '#64748b'] // Emerald/Teal, Sky, Slate

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      
      {/* Growth Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm lg:col-span-2"
      >
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Organization Growth</h2>
          <p className="text-sm text-slate-500">Total active organizations on the platform over time.</p>
        </div>
        
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.growth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#0f172a', fontWeight: 500 }}
              />
              <Area 
                type="monotone" 
                dataKey="total" 
                name="Total Organizations"
                stroke="#0ea5e9" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorTotal)" 
                activeDot={{ r: 6, strokeWidth: 0, fill: '#0284c7' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Plan Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
      >
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Plan Distribution</h2>
          <p className="text-sm text-slate-500">Organizations by active subscription plan.</p>
        </div>
        
        <div className="h-[280px] w-full flex flex-col justify-center">
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie
                data={data?.plan_distribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data?.plan_distribution?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#0f172a', fontWeight: 500 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {data?.plan_distribution?.map((entry: any, index: number) => (
              <div key={entry.name} className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                <div className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

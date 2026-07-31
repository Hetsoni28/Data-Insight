"use client"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell
} from 'recharts'

interface ChartsProps {
  data: any
  isLoading: boolean
}

export function SubscriptionAnalyticsCharts({ data, isLoading }: ChartsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Skeleton className="h-[400px] lg:col-span-2 rounded-xl" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    )
  }

  const revenueHistory = data?.revenue_history || []
  const planDistribution = data?.plan_distribution || []

  // Colors for plan distribution
  const COLORS = {
    'Starter': '#3b82f6', // blue-500
    'Professional': '#8b5cf6', // violet-500
    'Enterprise': '#10b981', // emerald-500
    'Custom': '#f59e0b' // amber-500
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-lg">
          <p className="font-medium text-slate-900 dark:text-white mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {entry.name}: <span className="font-bold text-slate-900 dark:text-white">
                  ${entry.value.toLocaleString()}
                </span>
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      
      {/* Revenue Trend Chart */}
      <Card className="p-6 lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Revenue Trend</h3>
          <p className="text-sm text-slate-500">Historical monthly revenue collected</p>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                name="Revenue"
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Plan Distribution Chart */}
      <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950 flex flex-col">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Plan Distribution</h3>
          <p className="text-sm text-slate-500">MRR contribution by tier</p>
        </div>
        <div className="flex-1 w-full min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={planDistribution} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="plan" 
                type="category" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                width={80}
              />
              <RechartsTooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="MRR" radius={[0, 4, 4, 0]} barSize={32}>
                {planDistribution.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.plan as keyof typeof COLORS] || '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between text-sm">
          <span className="text-slate-500">Total Plans</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {planDistribution.reduce((acc: number, curr: any) => acc + curr.count, 0)}
          </span>
        </div>
      </Card>

    </div>
  )
}

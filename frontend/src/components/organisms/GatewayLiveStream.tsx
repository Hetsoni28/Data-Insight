"use client"
import { motion } from "framer-motion"
import { Activity, Search, RefreshCw, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GatewayLiveStreamProps {
  requests: any[];
  refetch: () => void;
  isRefetching: boolean;
}

export function GatewayLiveStream({ requests, refetch, isRefetching }: GatewayLiveStreamProps) {
  
  const getMethodColor = (method: string) => {
    switch(method) {
      case 'GET': return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10'
      case 'POST': return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10'
      case 'PUT': return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10'
      case 'DELETE': return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10'
      default: return 'text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-500/10'
    }
  }
  
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
    if (status >= 300 && status < 400) return 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
    if (status >= 400 && status < 500) return 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
    return 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'
  }

  const getLatencyColor = (latency: number) => {
    if (latency < 200) return 'text-emerald-600 dark:text-emerald-400'
    if (latency < 500) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm mt-6 mb-12"
    >
      <div className="p-6 border-b border-slate-200/60 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="relative flex h-8 w-8 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-lg bg-emerald-400 opacity-20"></span>
            <div className="relative w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-white">Live Request Stream</h3>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter endpoint, IP..." 
              className="w-full bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={refetch}
            disabled={isRefetching}
            className="h-8 w-8 shrink-0 bg-white dark:bg-white/5 border-slate-200/60 dark:border-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin text-emerald-500' : 'text-slate-500 dark:text-slate-400'}`} />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
        <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
          <thead className="bg-slate-50/80 dark:bg-white/5 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold sticky top-0 z-10 border-b border-slate-200/60 dark:border-white/10 shadow-sm backdrop-blur-md">
            <tr>
              <th className="px-6 py-3 font-medium tracking-wider">Time</th>
              <th className="px-6 py-3 font-medium tracking-wider">Method</th>
              <th className="px-6 py-3 font-medium tracking-wider">Endpoint</th>
              <th className="px-6 py-3 font-medium tracking-wider">Status</th>
              <th className="px-6 py-3 font-medium tracking-wider">Latency</th>
              <th className="px-6 py-3 font-medium tracking-wider text-right">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {requests && requests.length > 0 ? requests.map((req, i) => (
              <motion.tr 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                key={req.id} 
                className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
              >
                <td className="px-6 py-3 font-mono text-xs text-slate-400">{formatTime(req.timestamp)}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${getMethodColor(req.method)}`}>
                    {req.method}
                  </span>
                </td>
                <td className="px-6 py-3 font-mono text-sm text-slate-700 dark:text-slate-300">
                  {req.endpoint}
                </td>
                <td className="px-6 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(req.status_code)}`}>
                    {req.status_code}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-mono text-sm font-medium ${getLatencyColor(req.latency_ms)}`}>
                      {req.latency_ms}ms
                    </span>
                  </div>
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs text-slate-500">{req.ip_address}</span>
                    <span className="text-sm" title={req.country}>{req.country === 'US' ? '????' : req.country === 'GB' ? '????' : req.country === 'IN' ? '????' : req.country === 'DE' ? '????' : req.country === 'JP' ? '????' : req.country === 'CA' ? '????' : req.country === 'AU' ? '????' : '??'}</span>
                  </div>
                </td>
              </motion.tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  No requests captured in this environment yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="p-3 border-t border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] text-center">
        <Button variant="link" className="text-emerald-600 hover:text-emerald-700 text-sm h-auto py-1">
          View all logs <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
    </motion.div>
  )
}

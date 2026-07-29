"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Database, FileSpreadsheet, TrendingUp, Users, Building2, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useWorkspaceStore } from "@/store/workspaceStore"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"

import { DashboardStatCard } from "@/components/organisms/DashboardStatCard"
import { DashboardEmptyState } from "@/components/organisms/DashboardEmptyState"

export default function DashboardPage() {
  const router = useRouter()
  const { data: user } = useAuth()
  const { activeWs, setIsUploadOpen } = useWorkspaceStore()
  
  const [stats, setStats] = useState({
    datasets_count: 0,
    reports_count: 0,
    ai_analyses_count: 0,
    members_count: 1
  })
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    if (!activeWs?.id) {
      setLoading(false)
      return
    }
    try {
      const { data } = await api.get(`/workspaces/${activeWs.id}/stats`)
      setStats(data)
    } catch (error) {
      console.error("Failed to fetch stats", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    
    // Listen for upload success to refresh stats
    const handleRefresh = () => fetchStats()
    window.addEventListener("dataset-uploaded", handleRefresh)
    return () => window.removeEventListener("dataset-uploaded", handleRefresh)
  }, [activeWs?.id])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    )
  }

  const isEmpty = stats.datasets_count === 0

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome banner for new users without an org */}
      {user && !user.tenant_id && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#10B981] to-emerald-600 rounded-2xl p-6 text-white flex items-center justify-between shadow-sm"
        >
          <div>
            <p className="font-semibold text-lg">Complete your setup</p>
            <p className="text-emerald-50 mt-1 max-w-lg">Create your organization to start uploading data and generating reports.</p>
          </div>
          <Button
            onClick={() => router.push("/onboarding")}
            className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold h-10 px-5 gap-2 shadow-sm rounded-xl"
          >
            <Building2 className="h-4 w-4" />
            Set up Organization
          </Button>
        </motion.div>
      )}

      {/* Stat cards */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <DashboardStatCard 
          icon={Database}         
          label="Total Datasets"       
          value={stats.datasets_count}   
          sub="Uploaded files"          
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          delay={0.1}
        />
        <DashboardStatCard 
          icon={FileSpreadsheet}  
          label="Generated Reports"        
          value={stats.reports_count}   
          sub="Excel deliverables"      
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          delay={0.2}
        />
        <DashboardStatCard 
          icon={TrendingUp}       
          label="AI Insights"    
          value={stats.ai_analyses_count}   
          sub="Data queries answered"      
          color="bg-gradient-to-br from-violet-500 to-violet-600"
          delay={0.3}
        />
        <DashboardStatCard 
          icon={Users}            
          label="Team Members"   
          value={stats.members_count}   
          sub="Active workspace users" 
          color="bg-gradient-to-br from-amber-500 to-amber-600"
          delay={0.4}
        />
      </motion.div>

      {/* Empty state — getting started */}
      {isEmpty && (
        <div className="pt-8">
          <DashboardEmptyState onUploadClick={() => setIsUploadOpen(true)} />
        </div>
      )}
      
      {/* If not empty, we would normally render a datasets list or recent reports here */}
      {!isEmpty && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.5 }}
          className="mt-12 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8 text-center"
        >
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <Database className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Your Data is Ready</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto text-sm">
            You've uploaded datasets. Navigate to the Datasets or Reports tab to manage them or generate new insights.
          </p>
          <Button
            onClick={() => router.push("/dashboard/datasets")}
            variant="outline"
            className="mt-6 border-slate-200 rounded-xl h-9"
          >
            View all datasets
          </Button>
        </motion.div>
      )}
    </div>
  )
}

import dynamic from "next/dynamic"
"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Users, Settings, ShieldAlert, BarChart3, Mail, Download, Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"
import { useAuth } from "@/hooks/useAuth"

const TeamOverviewKPIs = dynamic(() => import('@/components/organisms/TeamOverviewKPIs').then(m => m.TeamOverviewKPIs), { ssr: false })
const TeamMemberTable = dynamic(() => import('@/components/organisms/TeamMemberTable').then(m => m.TeamMemberTable), { ssr: false })
const TeamRoleManager = dynamic(() => import('@/components/organisms/TeamRoleManager').then(m => m.TeamRoleManager), { ssr: false })
const TeamAnalytics = dynamic(() => import('@/components/organisms/TeamAnalytics').then(m => m.TeamAnalytics), { ssr: false })
const TeamInvitationCenter = dynamic(() => import('@/components/organisms/TeamInvitationCenter').then(m => m.TeamInvitationCenter), { ssr: false })
const TeamSecurityAudit = dynamic(() => import('@/components/organisms/TeamSecurityAudit').then(m => m.TeamSecurityAudit), { ssr: false })


export default function TeamManagementPage() {
  const { data: user } = useAuth()
  const [activeTab, setActiveTab] = useState("members")
  const [stats, setStats] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [
          statsRes,
          membersRes,
          rolesRes,
          departmentsRes
        ] = await Promise.all([
          api.get('/tenant-team/stats'),
          api.get('/tenant-team'),
          api.get('/tenant-team/roles'),
          api.get('/tenant-team/departments')
        ])

        setStats(statsRes.data?.data)
        setMembers(membersRes.data?.data || [])
        setRoles(rolesRes.data?.data || [])
        setDepartments(departmentsRes.data?.data || [])
      } catch (err) {
        console.error("Failed to load team data", err)
        setError("Unable to load team management hub.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex-1 p-8 space-y-8 min-h-screen bg-slate-50 dark:bg-[#09090b]">
        <div className="h-32 rounded-3xl bg-slate-200 dark:bg-white/5 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
        <div className="h-96 rounded-2xl bg-slate-200 dark:bg-white/5 animate-pulse" />
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
  }

  return (
    <div className="flex-1 p-4 md:p-8 bg-slate-50 dark:bg-[#09090b] min-h-screen pb-24 relative overflow-hidden">
      
      {/* Ambient Decorative Blurs */}
      <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 left-1/3 w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-[120px] opacity-60" />
        <div className="absolute top-40 right-10 w-[400px] h-[400px] bg-teal-500/10 dark:bg-teal-500/10 rounded-full blur-[100px] opacity-50" />
        <div className="absolute top-96 left-10 w-[350px] h-[350px] bg-violet-500/5 dark:bg-violet-500/10 rounded-full blur-[100px] opacity-40" />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-[1800px] mx-auto space-y-8"
      >
        
        {/* Executive Header */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm relative overflow-hidden"
        >
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
              <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-500 text-white rounded-xl shadow-md">
                <Users className="h-6 w-6" />
              </div>
              Workforce Command Center
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
              Manage your organization&apos;s team, roles, and security policies centrally.
            </p>
          </div>
          <div className="flex items-center gap-3 relative z-10 w-full md:w-auto">
            <Button onClick={() => toast.success("Exporting team data...")} variant="outline" className="gap-2 rounded-xl border-slate-200 dark:border-white/10 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 font-bold text-xs shadow-xs flex-1 md:flex-none">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <motion.div onClick={() => setActiveTab("invitations")} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-1 md:flex-none">
              <Button className="w-full gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20">
                <Plus className="h-4 w-4" />
                Invite Member
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Executive KPIs */}
        <motion.div variants={itemVariants}>
          <TeamOverviewKPIs stats={stats} />
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div variants={itemVariants} className="flex items-center gap-2 border-b border-slate-200/80 dark:border-white/10 pb-4 overflow-x-auto custom-scrollbar">
          <TabButton active={activeTab === "members"} onClick={() => setActiveTab("members")} icon={<Users />} label="Team Members" count={members.length} />
          <TabButton active={activeTab === "roles"} onClick={() => setActiveTab("roles")} icon={<Settings />} label="Roles & Permissions" count={roles.length} />
          <TabButton active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")} icon={<BarChart3 />} label="Workforce Analytics" />
          <TabButton active={activeTab === "invitations"} onClick={() => setActiveTab("invitations")} icon={<Mail />} label="Invitation Center" count={stats?.pending_invitations} />
          <TabButton active={activeTab === "security"} onClick={() => setActiveTab("security")} icon={<ShieldAlert />} label="Security & Audit" />
        </motion.div>

        {/* Content Area */}
        <motion.div variants={itemVariants} className="mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {activeTab === "members" && (
                <TeamMemberTable members={members} departments={departments} />
              )}
              {activeTab === "roles" && (
                <TeamRoleManager roles={roles} />
              )}
              {activeTab === "analytics" && (
                <TeamAnalytics members={members} departments={departments} />
              )}
              {activeTab === "invitations" && (
                <TeamInvitationCenter roles={roles} />
              )}
              {activeTab === "security" && (
                <TeamSecurityAudit />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  )
}

function TabButton({ active, onClick, icon, label, count }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, count?: number }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap
        ${active 
          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20 dark:bg-emerald-500 dark:text-white" 
          : "text-slate-600 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
        }`}
    >
      <span className="[&>svg]:w-4 [&>svg]:h-4">{icon}</span>
      {label}
      {count !== undefined && count > 0 && (
        <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${active ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300"}`}>
          {count}
        </span>
      )}
    </button>
  )
}

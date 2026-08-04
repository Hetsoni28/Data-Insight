"use client"

import { useState, useEffect } from "react"
import { Users, Settings, ShieldAlert, BarChart3, Mail, Download, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"
import { useAuth } from "@/hooks/useAuth"
import { TeamOverviewKPIs } from "@/components/organisms/TeamOverviewKPIs"
import { TeamMemberTable } from "@/components/organisms/TeamMemberTable"
import { TeamRoleManager } from "@/components/organisms/TeamRoleManager"
import { TeamAnalytics } from "@/components/organisms/TeamAnalytics"
import { TeamInvitationCenter } from "@/components/organisms/TeamInvitationCenter"
import { TeamSecurityAudit } from "@/components/organisms/TeamSecurityAudit"

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
        <div className="h-32 rounded-3xl bg-slate-100 dark:bg-white/5 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
        <div className="h-96 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 md:p-8 bg-slate-50 dark:bg-[#09090b] min-h-screen pb-24">
      <div className="max-w-[1800px] mx-auto space-y-8">
        
        {/* Executive Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-emerald-950/20 p-6 rounded-3xl border border-slate-200 dark:border-emerald-900/50 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
              Workforce Command Center
            </h1>
            <p className="text-sm text-slate-500 dark:text-emerald-100/70 mt-1">
              Manage your organization&apos;s team, roles, and security policies centrally.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2 dark:border-emerald-900/50 dark:bg-emerald-950/50">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/25">
              <Plus className="h-4 w-4" />
              Invite Member
            </Button>
          </div>
        </div>

        {/* Executive KPIs */}
        <TeamOverviewKPIs stats={stats} />

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-4 overflow-x-auto scrollbar-hide">
          <TabButton active={activeTab === "members"} onClick={() => setActiveTab("members")} icon={<Users />} label="Team Members" />
          <TabButton active={activeTab === "roles"} onClick={() => setActiveTab("roles")} icon={<Settings />} label="Roles & Permissions" />
          <TabButton active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")} icon={<BarChart3 />} label="Workforce Analytics" />
          <TabButton active={activeTab === "invitations"} onClick={() => setActiveTab("invitations")} icon={<Mail />} label="Invitation Center" />
          <TabButton active={activeTab === "security"} onClick={() => setActiveTab("security")} icon={<ShieldAlert />} label="Security & Audit" />
        </div>

        {/* Content Area */}
        <div className="mt-8">
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
        </div>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap
        ${active 
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 shadow-sm" 
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
        }`}
    >
      <span className="[&>svg]:w-4 [&>svg]:h-4">{icon}</span>
      {label}
    </button>
  )
}

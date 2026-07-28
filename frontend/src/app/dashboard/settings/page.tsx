"use client"
import { motion } from "framer-motion"
import { Building2, Users, CreditCard, Shield, Settings as SettingsIcon } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { StateLayout } from "@/components/molecules/StateLayout"
import { AccessRestrictedIllustration } from "@/components/molecules/AccessRestrictedIllustration"

export default function SettingsPage() {
  const { user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    // Basic frontend route protection
    if (user && !user.is_owner && user.role !== "org_admin") {
      router.push("/dashboard")
    }
  }, [user, router])

  if (!user || (!user.is_owner && user.role !== "org_admin")) {
    return (
      <div className="p-8 max-w-3xl mx-auto flex items-center justify-center min-h-[calc(100vh-100px)]">
        <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden p-6">
          <StateLayout
            illustration={<AccessRestrictedIllustration />}
            headline="Access Restricted"
            description="You do not have permission to view or modify organization settings. Please contact your organization owner to upgrade your role."
            primaryAction={{
              label: "Return to Dashboard",
              icon: <Building2 className="w-4 h-4" />,
              onClick: () => router.push("/dashboard"),
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-emerald-600" />
          Organization Settings
        </h1>
        <p className="text-slate-500 mt-2">Manage your organization's settings, billing, and team members.</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Organization Info */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 text-slate-900 font-semibold text-lg pb-4 border-b border-slate-100">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Building2 className="w-5 h-5" />
            </div>
            Organization Profile
          </div>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Update your company name, logo, and general preferences.</p>
            <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg transition-colors">
              Manage Profile
            </button>
          </div>
        </div>

        {/* Team Management */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 text-slate-900 font-semibold text-lg pb-4 border-b border-slate-100">
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600">
              <Users className="w-5 h-5" />
            </div>
            Team Management
          </div>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Invite new members, manage roles, and handle workspace access.</p>
            <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg transition-colors">
              Manage Team
            </button>
          </div>
        </div>

        {/* Billing & Plans */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 text-slate-900 font-semibold text-lg pb-4 border-b border-slate-100">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <CreditCard className="w-5 h-5" />
            </div>
            Billing & Subscription
          </div>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">View current usage, upgrade your plan, and manage invoices.</p>
            <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg transition-colors">
              Manage Billing
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 text-slate-900 font-semibold text-lg pb-4 border-b border-slate-100">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <Shield className="w-5 h-5" />
            </div>
            Security
          </div>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Configure SSO, MFA, and access audit logs for your tenant.</p>
            <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg transition-colors">
              Security Settings
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

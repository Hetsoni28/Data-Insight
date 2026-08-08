"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence } from "framer-motion"
import { Loader2, LogOut, Check } from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/store/authStore"
import { useAuth } from "@/hooks/useAuth"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { logoutUser } from "@/lib/auth.service"
import api from "@/lib/api"
import { cn } from "@/lib/utils"

import { OnboardingOrgStep } from "@/components/organisms/OnboardingOrgStep"
import { OnboardingWorkspaceStep } from "@/components/organisms/OnboardingWorkspaceStep"
import { OnboardingSuccessStep } from "@/components/organisms/OnboardingSuccessStep"

export default function OnboardingPage() {
  const router = useRouter()
  const { data: user, isLoading: authLoading, refetch: fetchMe } = useAuth()
  const { login, logout } = useAuthStore()

  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  
  const [org, setOrg] = useState({ name: "", industry: "SaaS / Technology", plan: "starter" })
  const [workspace, setWorkspace] = useState({ name: "My First Workspace", icon: "📊" })

  // ── Auth Guards ──────────────────────────────────────────────────────────
  const { workspaces, loadingWs, setWorkspaces, setLoadingWs } = useWorkspaceStore()
  
  // Fetch workspaces if user has a tenant_id to determine if they need step 2
  useEffect(() => {
    if (user?.tenant_id) {
      setLoadingWs(true)
      api.get("/workspaces")
        .then(({ data }) => setWorkspaces(data))
        .finally(() => setLoadingWs(false))
    } else if (!authLoading) {
      setLoadingWs(false)
    }
  }, [user?.tenant_id, authLoading, setWorkspaces, setLoadingWs])

  useEffect(() => {
    if (!authLoading && !loadingWs) {
      if (!user) {
        toast.error("Please log in to continue onboarding.")
        router.push("/login")
      } else if (user.tenant_id && workspaces.length > 0) {
        // User has finished both org and workspace creation
        router.push("/dashboard")
      } else if (user.tenant_id && workspaces.length === 0 && step === 1) {
        // User created org but hasn't created a workspace yet
        setStep(2)
      }
    }
  }, [user, authLoading, router, workspaces, loadingWs, step])

  // Prevent rendering if not ready
  if (authLoading || loadingWs || !user || (user.tenant_id && workspaces.length > 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-white/5">
        <Loader2 className="h-8 w-8 animate-spin text-[#10B981]" />
      </div>
    )
  }

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await logoutUser()
      logout()
      router.push("/login")
    } catch {
      toast.error("Failed to log out")
    }
  }

  const handleCreateOrg = async () => {
    if (!org.name.trim()) { 
      toast.error("Please enter your organization name.")
      return 
    }
    setIsLoading(true)
    try {
      await api.post("/tenants", { name: org.name, plan: org.plan })
      const res = await api.post("/auth/refresh-token")
      await login(res.data.access_token) // store new JWT with org_admin + tenant_id
      // ⚠️ CRITICAL: Bust the React Query user cache — staleTime is 5 min so
      // without this, user.tenant_id remains null and workspace creation breaks.
      await fetchMe()
      setStep(2)
    } catch {
      toast.error("Could not create organization. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateWorkspace = async () => {
    if (!workspace.name.trim()) { 
      toast.error("Please enter a workspace name.")
      return 
    }
    setIsLoading(true)
    try {
      await api.post("/workspaces", { name: workspace.name, icon: workspace.icon, color: "#10B981" })
      // Refresh workspaces list in the store so dashboard picks them up immediately
      const wsRes = await api.get("/workspaces")
      setWorkspaces(wsRes.data)
      setStep(3)
    } catch {
      toast.error("Could not create workspace. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-white/5 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-emerald-200/40 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-emerald-200/40 blur-[100px] rounded-full" />
      </div>

      <div className="w-full max-w-xl relative z-10">
        {/* Progress header */}
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div 
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all duration-500",
                    s < step ? "bg-[#10B981] text-white" : s === step ? "bg-white dark:bg-white/5 text-[#10B981] ring-2 ring-[#10B981] ring-offset-2 ring-offset-slate-50" : "bg-slate-200 text-slate-400"
                  )}
                >
                  {s < step ? <Check className="h-4 w-4" /> : s}
                </div>
                {s < 3 && <div className={cn("w-8 h-[2px] rounded-full transition-colors duration-500", s < step ? "bg-[#10B981]" : "bg-slate-200")} />}
              </div>
            ))}
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <OnboardingOrgStep
              user={user}
              org={org}
              setOrg={setOrg}
              handleCreateOrg={handleCreateOrg}
              isLoading={isLoading}
              focusedField={focusedField}
              setFocusedField={setFocusedField}
            />
          )}

          {step === 2 && (
            <OnboardingWorkspaceStep
              workspace={workspace}
              setWorkspace={setWorkspace}
              handleCreateWorkspace={handleCreateWorkspace}
              isLoading={isLoading}
              focusedField={focusedField}
              setFocusedField={setFocusedField}
            />
          )}

          {step === 3 && (
            <OnboardingSuccessStep router={router} />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

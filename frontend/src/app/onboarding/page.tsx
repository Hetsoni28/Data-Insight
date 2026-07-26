"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Building2, Loader2, ArrowRight, CheckCircle2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import api from "@/lib/api"

const INDUSTRIES = [
  "SaaS / Technology", "E-commerce / Retail", "Finance / Banking",
  "Healthcare", "Real Estate", "Manufacturing", "Consulting", "Other",
]

export default function OnboardingPage() {
  const router = useRouter()
  const { user, fetchMe } = useAuthStore()

  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [org, setOrg] = useState({ name: "", industry: "", plan: "starter" })

  // Step 2 fields
  const [workspace, setWorkspace] = useState({ name: "My First Workspace" })

  const handleCreateOrg = async () => {
    if (!org.name.trim()) { toast.error("Please enter your organization name."); return }
    setIsLoading(true)
    try {
      await api.post("/tenants", { name: org.name, plan: org.plan })
      await fetchMe() // refresh user with new tenant_id + role=owner
      toast.success("Organization created!")
      setStep(2)
    } catch {
      toast.error("Could not create organization. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateWorkspace = async () => {
    if (!workspace.name.trim()) { toast.error("Please enter a workspace name."); return }
    setIsLoading(true)
    try {
      await api.post("/workspaces", { name: workspace.name, icon: "📊", color: "#10B981" })
      toast.success("Workspace created! You're all set 🎉")
      setStep(3)
    } catch {
      toast.error("Could not create workspace. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const goToDashboard = () => router.push("/dashboard")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-500 ${
                s === step ? "w-8 bg-[#10B981]" : s < step ? "w-2 bg-[#10B981]/40" : "w-2 bg-slate-200"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── Step 1: Create Organisation ─────────────────────────────── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8"
            >
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-5">
                <Building2 className="h-6 w-6 text-[#10B981]" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">
                Set up your organization
              </h1>
              <p className="text-sm text-slate-500 mb-7">
                Hi{user?.full_name ? ` ${user.full_name.split(" ")[0]}` : ""}! This creates your workspace for your team.
              </p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="orgName">Organization name *</Label>
                  <Input
                    id="orgName"
                    placeholder="Acme Corp"
                    value={org.name}
                    onChange={(e) => setOrg((p) => ({ ...p, name: e.target.value }))}
                    className="h-10"
                    onKeyDown={(e) => e.key === "Enter" && handleCreateOrg()}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Industry</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {INDUSTRIES.map((ind) => (
                      <button
                        key={ind}
                        type="button"
                        onClick={() => setOrg((p) => ({ ...p, industry: ind }))}
                        className={`text-left px-3 py-2 rounded-lg text-sm border transition-all ${
                          org.industry === ind
                            ? "border-[#10B981] bg-emerald-50 text-[#10B981] font-medium"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleCreateOrg}
                  disabled={isLoading || !org.name.trim()}
                  className="w-full h-10 bg-[#10B981] hover:bg-[#059669] text-white gap-2"
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
                  ) : (
                    <>Continue <ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Create First Workspace ──────────────────────────── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8"
            >
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-5">
                <Sparkles className="h-6 w-6 text-[#10B981]" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">
                Name your first workspace
              </h1>
              <p className="text-sm text-slate-500 mb-7">
                A workspace groups your datasets, reports, and dashboards.
              </p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="wsName">Workspace name</Label>
                  <Input
                    id="wsName"
                    placeholder="Sales Analytics"
                    value={workspace.name}
                    onChange={(e) => setWorkspace({ name: e.target.value })}
                    className="h-10"
                    onKeyDown={(e) => e.key === "Enter" && handleCreateWorkspace()}
                  />
                </div>

                <Button
                  onClick={handleCreateWorkspace}
                  disabled={isLoading || !workspace.name.trim()}
                  className="w-full h-10 bg-[#10B981] hover:bg-[#059669] text-white gap-2"
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
                  ) : (
                    <>Create workspace <ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: All Done ─────────────────────────────────────────── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5"
              >
                <CheckCircle2 className="h-8 w-8 text-[#10B981]" />
              </motion.div>

              <h1 className="text-2xl font-bold text-slate-900 mb-2">You&apos;re all set! 🎉</h1>
              <p className="text-sm text-slate-500 mb-8">
                Your organization and first workspace are ready. Let&apos;s go!
              </p>

              <ul className="space-y-2 text-left mb-8">
                {[
                  "Upload your first dataset (CSV, XLSX, JSON)",
                  "Let AI profile and analyze your data",
                  "Generate a board-ready Excel report in minutes",
                ].map((step) => (
                  <li key={step} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-[#10B981] flex-shrink-0" />
                    {step}
                  </li>
                ))}
              </ul>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={goToDashboard}
                  className="w-full h-11 bg-[#10B981] hover:bg-[#059669] text-white text-base font-semibold gap-2"
                >
                  Go to Dashboard <ArrowRight className="h-5 w-5" />
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

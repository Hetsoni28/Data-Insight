import { motion } from "framer-motion"
import { Building2, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export const INDUSTRIES = [
  "SaaS / Technology", "E-commerce / Retail", "Finance / Banking",
  "Healthcare", "Real Estate", "Manufacturing", "Consulting", "Other",
]

interface OnboardingOrgStepProps {
  user: any
  org: { name: string; industry: string; plan: string }
  setOrg: (val: any) => void
  handleCreateOrg: () => void
  isLoading: boolean
  focusedField: string | null
  setFocusedField: (val: string | null) => void
}

export function OnboardingOrgStep({
  user,
  org,
  setOrg,
  handleCreateOrg,
  isLoading,
  focusedField,
  setFocusedField
}: OnboardingOrgStepProps) {
  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10"
    >
      <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-emerald-100">
        <Building2 className="h-7 w-7 text-[#10B981]" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
        Set up your organization
      </h1>
      <p className="text-base text-slate-500 mb-8">
        Welcome{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}! Let's create a shared space for your team's analytics.
      </p>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="orgName" className="text-sm font-semibold text-slate-700">Organization name <span className="text-red-500">*</span></Label>
          <Input
            id="orgName"
            placeholder="e.g. Acme Corp"
            value={org.name}
            onChange={(e) => setOrg((p: any) => ({ ...p, name: e.target.value }))}
            onFocus={() => setFocusedField("orgName")}
            onBlur={() => setFocusedField(null)}
            className={cn(
              "h-12 bg-slate-50/50 border-slate-200 transition-all duration-300",
              focusedField === "orgName" && "border-[#10B981] ring-4 ring-[#10B981]/10 shadow-sm bg-white"
            )}
            onKeyDown={(e) => e.key === "Enter" && handleCreateOrg()}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700">Which industry describes your company best?</Label>
          <div className="grid grid-cols-2 gap-3">
            {INDUSTRIES.map((ind) => (
              <button
                key={ind}
                type="button"
                onClick={() => setOrg((p: any) => ({ ...p, industry: ind }))}
                className={cn(
                  "text-left px-4 py-3 rounded-xl text-sm transition-all border",
                  org.industry === ind
                    ? "border-[#10B981] bg-emerald-50 text-[#10B981] font-semibold shadow-sm ring-2 ring-[#10B981]/20"
                    : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                {ind}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <Button
            onClick={handleCreateOrg}
            disabled={isLoading || !org.name.trim()}
            className="w-full h-12 bg-[#10B981] hover:bg-[#059669] text-white text-base font-semibold gap-2 rounded-xl shadow-sm shadow-[#10B981]/20 transition-all"
          >
            {isLoading ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Setting up...</>
            ) : (
              <>Continue to workspace <ArrowRight className="h-5 w-5" /></>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

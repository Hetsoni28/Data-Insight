import { motion } from "framer-motion"
import { Sparkles, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export const EMOJIS = ["??", "??", "??", "??", "??", "?", "??", "??", "?", "??", "??", "??"]

interface OnboardingWorkspaceStepProps {
  workspace: { name: string; icon: string }
  setWorkspace: (val: any) => void
  handleCreateWorkspace: () => void
  isLoading: boolean
  focusedField: string | null
  setFocusedField: (val: string | null) => void
}

export function OnboardingWorkspaceStep({
  workspace,
  setWorkspace,
  handleCreateWorkspace,
  isLoading,
  focusedField,
  setFocusedField
}: OnboardingWorkspaceStepProps) {
  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      className="bg-white dark:bg-white/5 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 dark:border-white/5 p-8 sm:p-10"
    >
      <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-emerald-100">
        <Sparkles className="h-7 w-7 text-emerald-500" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
        Name your first workspace
      </h1>
      <p className="text-base text-slate-500 dark:text-slate-400 mb-8">
        Workspaces help you organize datasets and reports by department, project, or client.
      </p>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="wsName" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Workspace name <span className="text-red-500">*</span></Label>
          <Input
            id="wsName"
            placeholder="e.g. Sales Analytics"
            value={workspace.name}
            onChange={(e) => setWorkspace({ ...workspace, name: e.target.value })}
            onFocus={() => setFocusedField("wsName")}
            onBlur={() => setFocusedField(null)}
            className={cn(
              "h-12 bg-slate-50/50 border-slate-200 dark:border-white/10 transition-all duration-300",
              focusedField === "wsName" && "border-emerald-500 ring-4 ring-emerald-500/10 shadow-sm bg-white dark:bg-white/5"
            )}
            onKeyDown={(e) => e.key === "Enter" && handleCreateWorkspace()}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Choose an icon</Label>
          <div className="grid grid-cols-6 gap-2">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setWorkspace({ ...workspace, icon: emoji })}
                className={cn(
                  "aspect-square rounded-xl text-2xl flex items-center justify-center transition-all border",
                  workspace.icon === emoji
                    ? "border-emerald-500 bg-emerald-50 shadow-sm ring-2 ring-emerald-500/20 scale-110 z-10"
                    : "border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-200 dark:border-white/10"
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <Button
            onClick={handleCreateWorkspace}
            disabled={isLoading || !workspace.name.trim()}
            className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white text-base font-semibold gap-2 rounded-xl shadow-sm shadow-emerald-500/20 transition-all"
          >
            {isLoading ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Creating...</>
            ) : (
              <>Create workspace <ArrowRight className="h-5 w-5" /></>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

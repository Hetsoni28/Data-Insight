"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  Server, Building2, Check, ArrowRight,
  Mail, Phone, Zap, ShieldCheck,
  CheckCircle2, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { billingService, type PlanCatalog } from "@/lib/billing.service"
import { toast } from "sonner"

// ── Plan Card ─────────────────────────────────────────────────────────────────
interface PlanCardProps {
  plan: PlanCatalog["plans"][number]
  isCurrent: boolean
  onContact: () => void
  delay?: number
}

function PlanCard({ plan, isCurrent, onContact, delay = 0 }: PlanCardProps) {
  const Icon = plan.id === "enterprise" ? Server : Building2
  const priceDisplay = plan.price ? `$${plan.price.toLocaleString()}` : "Custom"
  const priceSubDisplay = plan.price ? "/mo (annual)" : "tailored pricing"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`relative rounded-2xl flex flex-col justify-between p-7 space-y-6 ${
        plan.highlighted
          ? "border-2 border-emerald-500 bg-white dark:bg-slate-900 shadow-2xl shadow-emerald-500/10"
          : "border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-lg"
      }`}
    >
      {/* Current plan ribbon */}
      {isCurrent && (
        <div className="absolute top-4 right-4">
          <Badge className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider rounded-full px-2.5 py-1">
            ✓ Your Plan
          </Badge>
        </div>
      )}

      {/* Non-current highlighted badge */}
      {!isCurrent && plan.highlighted && (
        <div className="absolute top-4 right-4">
          <Badge className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-wider rounded-full px-2.5 py-1">
            Recommended
          </Badge>
        </div>
      )}

      {/* Header */}
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border ${
            plan.highlighted
              ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
              : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"
          }`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{plan.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{plan.description}</p>
          </div>
        </div>

        {/* Price */}
        <div className="pt-4 border-t border-slate-100 dark:border-white/10">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {priceDisplay}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{priceSubDisplay}</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{plan.billing}</p>
        </div>

        {/* Features */}
        <ul className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-white/10">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-snug">{f}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action */}
      {isCurrent ? (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/15">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
            Active — system is fully provisioned
          </span>
        </div>
      ) : (
        <Button
          onClick={onContact}
          className={`w-full rounded-xl font-bold text-sm h-11 ${
            plan.highlighted
              ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20"
              : "bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900"
          }`}
        >
          Contact Sales <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </motion.div>
  )
}

// ── Contact Sales Modal ───────────────────────────────────────────────────────
function ContactSalesModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [message, setMessage] = useState("")

  const cancelMutation = useMutation({
    mutationFn: () => billingService.requestCancellation(message || "Upgrade/plan change inquiry"),
    onSuccess: () => {
      toast.success("Your inquiry has been sent. Our team will contact you within 1 business day.")
      setMessage("")
      onClose()
    },
    onError: () => toast.error("Failed to send inquiry. Please email us directly."),
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-card border border-slate-200 dark:border-white/10 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Mail className="h-4 w-4 text-emerald-500" />
            Contact Our Sales Team
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm">
            We'll reach out within 1 business day to discuss your requirements.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Contact Info Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/10 text-center">
              <Mail className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
              <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Email</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">sales@datainsight.ai</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/10 text-center">
              <Zap className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
              <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Response Time</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Within 24 hours</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Your message or requirements
            </Label>
            <Textarea
              placeholder="Describe your needs — e.g. custom global license, multi-region, on-premise deployment..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="rounded-xl border-slate-200 dark:border-white/10 resize-none h-24 text-sm"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl border-slate-200 dark:border-white/10">
            Cancel
          </Button>
          <Button
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold"
          >
            {cancelMutation.isPending
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Sending...</>
              : <><Mail className="h-3.5 w-3.5 mr-2" />Send Inquiry</>
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
interface Props {
  catalog: PlanCatalog
}

export function BillingPlansTab({ catalog }: Props) {
  const [isContactOpen, setIsContactOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Subscription Plans
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Your current plan and available upgrade options
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/5 font-bold capitalize text-xs"
        >
          Current: {catalog.currentPlan}
        </Badge>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {catalog.plans.map((plan, i) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrent={plan.id === catalog.currentPlan}
            onContact={() => setIsContactOpen(true)}
            delay={i * 0.1}
          />
        ))}
      </div>

      {/* Enterprise note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/10"
      >
        <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            All plans include: 99.99% SLA · SOC2 Type II · AES-256 encryption · 24/7 dedicated support
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Plan changes and upgrades are handled directly with our engineering team to ensure zero downtime migration.
          </p>
        </div>
      </motion.div>

      {/* Contact Modal */}
      <ContactSalesModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </div>
  )
}

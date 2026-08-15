"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  X, Building2, User, Mail, Phone, Users,
  Briefcase, HardDrive, Database, Cpu, Clock,
  MessageSquare, ChevronRight, CheckCircle2, Loader2,
  ArrowRight, Shield, Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import api from "@/lib/api"
import { toast } from "sonner"

// ── Types ─────────────────────────────────────────────────────────────────────
interface FormData {
  company_name: string
  contact_person: string
  business_email: string
  phone: string
  company_size: string
  industry: string
  expected_users: string
  expected_storage_gb: string
  expected_data_volume: string
  ai_bi_requirements: string
  preferred_contact_time: string
  message: string
}

const EMPTY_FORM: FormData = {
  company_name: "", contact_person: "", business_email: "", phone: "",
  company_size: "", industry: "", expected_users: "", expected_storage_gb: "",
  expected_data_volume: "", ai_bi_requirements: "", preferred_contact_time: "", message: ""
}

// ── Field Components ──────────────────────────────────────────────────────────
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-semibold text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </Label>
      {children}
    </div>
  )
}

function TextInput({ icon: Icon, placeholder, value, onChange, type = "text" }: {
  icon: any; placeholder: string; value: string; onChange: (v: string) => void; type?: string
}) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="pl-9 rounded-xl border-slate-200 text-sm h-10 focus:border-emerald-400 focus:ring-emerald-400/20"
      />
    </div>
  )
}

// ── Success Screen ────────────────────────────────────────────────────────────
function SuccessScreen({ leadId, onClose }: { leadId: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center py-8 px-6 space-y-6"
    >
      <div className="h-20 w-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-black text-slate-900">Request Submitted!</h3>
        <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
          We've received your demo request. Our team will review your requirements and reach out within <strong className="text-slate-800">1 business day</strong>.
        </p>
      </div>

      <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-1">
        <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">Your Reference ID</p>
        <p className="text-2xl font-black text-slate-900 font-mono tracking-wider">{leadId}</p>
        <p className="text-[11px] text-slate-400">Check your email for confirmation</p>
      </div>

      <div className="w-full space-y-2 text-left bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p className="text-xs font-bold text-slate-700">What happens next?</p>
        {[
          "Our team reviews your requirements (24 hrs)",
          "We schedule a personalised demo call",
          "Solutions Architect prepares your proposal",
          "Contract signed → infrastructure provisioned",
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-[12px] text-slate-600">
            <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black shrink-0">{i + 1}</span>
            {s}
          </div>
        ))}
      </div>

      <Button onClick={onClose} className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold h-11">
        Close
      </Button>
    </motion.div>
  )
}

// ── Main Modal ────────────────────────────────────────────────────────────────
interface Props {
  isOpen: boolean
  onClose: () => void
}

export function BookDemoModal({ isOpen, onClose }: Props) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [leadId, setLeadId] = useState<string | null>(null)

  const set = (key: keyof FormData) => (val: string | null) => setForm(f => ({ ...f, [key]: val || "" }))

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/leads/inquire", {
        ...form,
        expected_users: form.expected_users ? parseInt(form.expected_users) : undefined,
        expected_storage_gb: form.expected_storage_gb ? parseInt(form.expected_storage_gb) : undefined,
        source: "pricing_page",
      })
      return res.data
    },
    onSuccess: (data) => {
      setLeadId(data.lead_id)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Submission failed. Please try again.")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.company_name || !form.contact_person || !form.business_email) {
      toast.error("Please fill in all required fields.")
      return
    }
    mutation.mutate()
  }

  const handleClose = () => {
    setForm(EMPTY_FORM)
    setLeadId(null)
    mutation.reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.25 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
            <div>
              <h2 className="text-xl font-black text-slate-900">Book a Demo</h2>
              <p className="text-xs text-slate-500 mt-0.5">Request access to Data Insight for your organisation</p>
            </div>
            <button
              onClick={handleClose}
              className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4 text-slate-600" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1">
            {leadId ? (
              <SuccessScreen leadId={leadId} onClose={handleClose} />
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Section 1: Contact */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                    <User className="h-4 w-4 text-emerald-500" />
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Contact Information</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Company Name" required>
                      <TextInput icon={Building2} placeholder="Acme Corp" value={form.company_name} onChange={set("company_name")} />
                    </Field>
                    <Field label="Contact Person" required>
                      <TextInput icon={User} placeholder="John Smith" value={form.contact_person} onChange={set("contact_person")} />
                    </Field>
                    <Field label="Business Email" required>
                      <TextInput icon={Mail} placeholder="john@company.com" value={form.business_email} onChange={set("business_email")} type="email" />
                    </Field>
                    <Field label="Phone">
                      <TextInput icon={Phone} placeholder="+1 555 000 0000" value={form.phone} onChange={set("phone")} type="tel" />
                    </Field>
                  </div>
                </div>

                {/* Section 2: Organisation */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                    <Briefcase className="h-4 w-4 text-emerald-500" />
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Organisation Details</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Company Size">
                      <Select value={form.company_size} onValueChange={set("company_size")}>
                        <SelectTrigger className="rounded-xl border-slate-200 text-sm h-10">
                          <SelectValue placeholder="Select size..." />
                        </SelectTrigger>
                        <SelectContent>
                          {["1–10", "11–50", "51–200", "201–500", "500+"].map(s => (
                            <SelectItem key={s} value={s}>{s} employees</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Industry">
                      <Select value={form.industry} onValueChange={set("industry")}>
                        <SelectTrigger className="rounded-xl border-slate-200 text-sm h-10">
                          <SelectValue placeholder="Select industry..." />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "Finance & Banking", "Healthcare", "Retail & E-commerce",
                            "Manufacturing", "Logistics & Supply Chain", "Real Estate",
                            "Technology", "Education", "Government", "Other"
                          ].map(i => (
                            <SelectItem key={i} value={i}>{i}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Expected Users">
                      <TextInput icon={Users} placeholder="e.g. 50" value={form.expected_users} onChange={set("expected_users")} type="number" />
                    </Field>
                    <Field label="Expected Storage (GB)">
                      <TextInput icon={HardDrive} placeholder="e.g. 500" value={form.expected_storage_gb} onChange={set("expected_storage_gb")} type="number" />
                    </Field>
                    <Field label="Data Volume">
                      <Select value={form.expected_data_volume} onValueChange={set("expected_data_volume")}>
                        <SelectTrigger className="rounded-xl border-slate-200 text-sm h-10">
                          <SelectValue placeholder="Monthly data volume..." />
                        </SelectTrigger>
                        <SelectContent>
                          {["< 10 GB", "10–100 GB", "100 GB–1 TB", "1–10 TB", "> 10 TB"].map(v => (
                            <SelectItem key={v} value={v}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Preferred Contact Time">
                      <Select value={form.preferred_contact_time} onValueChange={set("preferred_contact_time")}>
                        <SelectTrigger className="rounded-xl border-slate-200 text-sm h-10">
                          <SelectValue placeholder="Best time to call..." />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "Morning (9am–12pm)", "Afternoon (12pm–5pm)",
                            "Evening (5pm–8pm)", "Anytime"
                          ].map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                </div>

                {/* Section 3: Requirements */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                    <Cpu className="h-4 w-4 text-emerald-500" />
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Requirements</h3>
                  </div>
                  <Field label="AI / BI Requirements">
                    <Textarea
                      placeholder="What data sources will you connect? What reports or dashboards do you need? Any specific AI features?"
                      value={form.ai_bi_requirements}
                      onChange={e => set("ai_bi_requirements")(e.target.value)}
                      className="rounded-xl border-slate-200 text-sm resize-none h-20"
                    />
                  </Field>
                  <Field label="Additional Message">
                    <Textarea
                      placeholder="Any other requirements, questions, or context for our team..."
                      value={form.message}
                      onChange={e => set("message")(e.target.value)}
                      className="rounded-xl border-slate-200 text-sm resize-none h-16"
                    />
                  </Field>
                </div>

                {/* Trust badges */}
                <div className="flex flex-wrap gap-3">
                  {[
                    { icon: Shield, text: "SOC2 Type II" },
                    { icon: Zap, text: "Response in 24hrs" },
                    { icon: Database, text: "Dedicated Infrastructure" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-3 py-1">
                      <Icon className="h-3 w-3 text-emerald-500" />
                      {text}
                    </div>
                  ))}
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold h-12 rounded-xl text-sm shadow-lg shadow-emerald-500/20"
                >
                  {mutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</>
                  ) : (
                    <>Submit Demo Request <ArrowRight className="h-4 w-4 ml-2" /></>
                  )}
                </Button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

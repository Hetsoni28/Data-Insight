"use client"
import React from "react"
import { motion } from "framer-motion"
import {
  ShieldCheck,
  Lock,
  KeyRound,
  FileCheck2,
  Users,
  EyeOff,
  Server,
  CheckCircle2,
  Database,
} from "lucide-react"

const SECURITY_PILLARS = [
  {
    icon: EyeOff,
    title: "Zero-Data AI Training Retention",
    spec: "Non-Retention Guarantee",
    desc: "Your proprietary schemas, financial line items, and raw records are processed in ephemeral memory and never used to train public or private foundational AI models.",
  },
  {
    icon: Lock,
    title: "AES-256 & TLS 1.3 Encryption",
    spec: "Hardware KMS Keys",
    desc: "All stored database volumes are encrypted with dedicated AES-256 GCM customer-managed keys. In-transit traffic enforces strict TLS 1.3 cipher suites.",
  },
  {
    icon: Database,
    title: "Dedicated Supabase VPC",
    spec: "Physical Isolation",
    desc: "Dedicated Supabase PostgreSQL storage with Row-Level Security (RLS), encrypted storage buckets, and zero multi-tenant memory pooling.",
  },
  {
    icon: KeyRound,
    title: "Enterprise SSO & SAML 2.0",
    spec: "Okta / Entra ID / Google",
    desc: "Enforce corporate identity policies, Multi-Factor Authentication (MFA), and automated SCIM provisioning across your enterprise workforce.",
  },
  {
    icon: Users,
    title: "Granular Role-Based Access (RBAC)",
    spec: "Least-Privilege Security",
    desc: "Define strict permissions for Organization Owners, Lead Data Analysts, Compliance Auditors, and Read-Only Executive Stakeholders.",
  },
  {
    icon: FileCheck2,
    title: "Cryptographic Audit Logs",
    spec: "Immutable SIEM Logs",
    desc: "Every data ingestion, formula recalculation, copilot query, and Excel export is recorded with immutable timestamps and exportable to Datadog or Splunk.",
  },
]

const COMPLIANCE_BADGES = [
  { name: "SOC 2 Type II", status: "Audit Certified", desc: "Security, Availability & Confidentiality" },
  { name: "HIPAA Compliant", status: "BAA Available", desc: "Protected Health Information (PHI) Ready" },
  { name: "GDPR & CCPA", status: "Compliant", desc: "Right to Erasure & Data Sovereignty" },
  { name: "ISO / IEC 27001", status: "Aligned Controls", desc: "Information Security Management" },
]

export function SecurityComplianceSection() {
  return (
    <section id="security" className="py-24 px-4 sm:px-6 lg:px-8 bg-white text-slate-900 border-t border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* ── SECTION HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto space-y-4"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Enterprise Security.{" "}
            <span className="text-emerald-600">Zero-Retention Guarantee.</span>
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Data Insight is engineered for financial institutions, healthcare networks, and global enterprises
            with strict compliance and zero-trust Supabase data governance.
          </p>
        </motion.div>

        {/* ── 4 COMPLIANCE BADGES STRIP ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {COMPLIANCE_BADGES.map((badge) => (
            <div
              key={badge.name}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-2 text-center flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="inline-flex items-center justify-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-full text-xs font-mono font-bold text-emerald-700 shadow-2xs">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{badge.status}</span>
                </div>
                <h4 className="text-base font-extrabold text-slate-900 pt-1">{badge.name}</h4>
              </div>
              <p className="text-[11px] text-slate-500">{badge.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* ── 6 CORE SECURITY ARCHITECTURE PILLARS ── */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SECURITY_PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {pillar.spec}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-950">{pillar.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1.5">
                      {pillar.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Enforced by Single-Tenant Supabase Policy</span>
                </div>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  )
}

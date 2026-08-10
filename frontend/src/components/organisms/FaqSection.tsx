"use client"
import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { HelpCircle, ChevronDown, ShieldCheck, Lock, Cpu, Server, Building2 } from "lucide-react"

const FAQS = [
  {
    category: "System Rental & Licensing",
    q: "How does the Enterprise System Rental model work?",
    a: "Instead of building and maintaining a costly internal data science and BI team from scratch, you rent a dedicated, turnkey instance of the Data Insight AI platform ($15,000/month or $12,500/mo billed annually). We provision, manage, and scale the isolated cloud infrastructure while your team and clients enjoy full autonomous reporting capabilities.",
  },
  {
    category: "System Rental & Licensing",
    q: "Can we fully white-label the platform with our own company branding and domain?",
    a: "Yes. Both Dedicated System Rental and Custom Global License tiers support complete white-labeling. You can host the platform on your own custom subdomain (e.g., bi.yourcompany.com or insights.yourbrand.com), customize color palettes, logos, and automate client report delivery with your corporate email domain.",
  },
  {
    category: "Security & VPC",
    q: "Where is our dedicated platform instance hosted?",
    a: "Each enterprise tenant is provisioned inside an isolated, single-tenant Virtual Private Cloud (VPC) on your preferred provider (AWS, Google Cloud, or Microsoft Azure). For regulated defense, healthcare, or banking institutions, on-premise air-gapped deployments are available under the Custom Global License.",
  },
  {
    category: "Security & VPC",
    q: "Is our proprietary financial and client data used to train public AI models?",
    a: "Never. We maintain a strict zero-data-retention policy for AI model training. Your data remains strictly isolated in your single-tenant database instance with encryption-at-rest (AES-256) and TLS 1.3 in-transit.",
  },
  {
    category: "Excel Engine",
    q: "Are the exported Excel workbooks genuine files with living formulas?",
    a: "Yes. We compile multi-tab workbooks using native Microsoft SpreadsheetML (Office XML). Every calculated column, total, and margin contains real Excel formulas (such as =SUM(), =AVERAGE(), and =FORECAST.LINEAR()) that stay fully interactive when opened in Microsoft Excel or Google Sheets.",
  },
  {
    category: "AI & Accuracy",
    q: "How does Data Insight guarantee zero mathematical hallucination?",
    a: "All financial metrics, margins, run-rates, and predictive confidence bounds are calculated deterministically by our native algorithmic math engine—never generated probabilistically by an LLM. Large Language Models are used solely for natural language executive synthesis of verified numerical facts.",
  },
]

export function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)
  const [selectedCat, setSelectedCat] = useState<string>("All")

  const categories = ["All", "System Rental & Licensing", "Security & VPC", "Excel Engine", "AI & Accuracy"]

  const filtered = selectedCat === "All" ? FAQS : FAQS.filter((f) => f.category === selectedCat)

  return (
    <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 text-slate-900 border-t border-slate-200 overflow-hidden">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* ── SECTION HEADER WITH VIEWPORT REVEAL ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-3"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Enterprise System Rental &amp; Licensing FAQ
          </h2>
          <p className="text-sm text-slate-600">
            Everything you need to know about renting a dedicated Data Insight instance, custom white-labeling, and VPC security.
          </p>
        </motion.div>

        {/* ── CATEGORY SELECTOR WITH SMOOTH TRANSITION ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap items-center justify-center gap-2"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                selectedCat === cat
                  ? "bg-white border-emerald-500 text-emerald-800 shadow-sm ring-1 ring-emerald-500"
                  : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900 shadow-xs"
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* ── ACCORDION LIST WITH SMOOTH STAGGER & ANIMATEPRESENCE ── */}
        <div className="space-y-3">
          {filtered.map((faq, i) => {
            const isOpen = openIdx === i
            return (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.35 }}
                className={`rounded-xl border transition-all overflow-hidden bg-white ${
                  isOpen ? "border-emerald-400 shadow-md shadow-emerald-500/5" : "border-slate-200 shadow-xs hover:border-slate-300"
                }`}
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 font-semibold text-slate-900 text-sm hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-250 ${
                      isOpen ? "rotate-180 text-emerald-600" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  )
}

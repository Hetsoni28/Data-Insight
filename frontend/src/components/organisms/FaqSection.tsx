"use client"
import { motion, type Variants } from "framer-motion"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
}
const stagger: Variants = { visible: { transition: { staggerChildren: 0.08 } } }

const FAQS = [
  { q: "How long does setup take?", a: "Most teams are fully onboarded within 24 hours. Our dedicated Insights Engineer guides you through connecting your first data source and generating your first AI report." },
  { q: "Which databases do you support?", a: "We support PostgreSQL, MySQL, BigQuery, Snowflake, Redshift, and Microsoft SQL Server. CSV and Excel uploads are also supported for quick-start analysis." },
  { q: "Is my data secure?", a: "Yes. All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We are SOC 2 Type II compliant and GDPR ready. Your data never trains our models." },
  { q: "Can I export reports?", a: "Absolutely. Every report can be exported as a formatted Excel workbook, a white-labeled PDF, or shared via a shareable link — all with one click." },
  { q: "Do you offer a free trial?", a: "Yes — 14 days free on any plan. No credit card required. You can invite your full team and connect your real data to see results immediately." },
]

export function FaqSection() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-8 bg-slate-50/60">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center mb-12 space-y-3"
        >
          <motion.div variants={fadeUp}>
            <Badge className="bg-[#10B981]/10 text-[#10B981] border-0 text-xs mb-2">FAQ</Badge>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </motion.h2>
          <motion.p variants={fadeUp} className="text-slate-500 dark:text-slate-400">
            Everything you need to know before getting started.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: "-60px" }} variants={stagger}
        >
          <Accordion type="single" collapsible className="space-y-2">
            {FAQS.map((faq, i) => (
              <motion.div key={i} variants={fadeUp}>
                <AccordionItem value={`faq-${i}`} className="rounded-xl border bg-white dark:bg-white/5 px-5 shadow-sm">
                  <AccordionTrigger className="hover:no-underline text-left text-sm font-medium text-slate-800 dark:text-slate-200 py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}

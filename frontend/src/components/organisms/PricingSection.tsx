"use client"
import { motion, type Variants } from "framer-motion"
import { CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] } },
}
const stagger: Variants = { visible: { transition: { staggerChildren: 0.12 } } }

const STARTER_FEATURES = [
  { text: "Up to 10 team members", tip: "Add more seats anytime" },
  { text: "Standard SQL Connectors", tip: "PostgreSQL, MySQL, SQLite" },
  { text: "Value & Bar Charts", tip: "12 chart types included" },
  { text: "50 AI Excel reports/month", tip: "Resets on the 1st of each month" },
  { text: "Email & chat support", tip: "Response within 24 hours" },
]
const BUSINESS_FEATURES = [
  { text: "Unlimited team members", tip: "Invite your whole org" },
  { text: "Unlimited platform reports", tip: "No monthly caps" },
  { text: "White-label PDF/Excel Reports", tip: "Use your own logo & colors" },
  { text: "SSO & Enterprise Security", tip: "Okta, Auth0, SAML 2.0" },
  { text: "Dedicated Insights Engineer", tip: "1-on-1 onboarding & support" },
]

function FeatureItem({ text, tip }: { text: string; tip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="flex items-center gap-2.5 cursor-help">
          <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0" />
          <span className="text-sm text-slate-600">{text}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tip}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export function PricingSection() {
  return (
    <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-8 bg-white">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center mb-12 space-y-3"
        >
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Enterprise-Ready Pricing
          </motion.h2>
          <motion.p variants={fadeUp} className="text-slate-500">
            Scalable intelligence for organizations that demand growth.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: "-60px" }} variants={stagger} className="grid sm:grid-cols-2 gap-5 sm:gap-6"
        >
          {/* Starter */}
          <motion.div variants={fadeUp}>
            <Card className="h-full border-slate-200 hover:shadow-lg transition-shadow flex flex-col">
              <CardHeader className="pb-4">
                <div className="text-sm text-slate-500 font-medium mb-1">STARTER</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900">$499</span>
                  <span className="text-slate-400 text-sm">/month</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Perfect for growing teams</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col space-y-3.5">
                {STARTER_FEATURES.map(f => <FeatureItem key={f.text} {...f} />)}
                <div className="mt-auto pt-4">
                  <Separator className="mb-4" />
                  <a href="/register" className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-[#10B981] hover:text-[#10B981] transition-colors")}>
                    Start Free Trial
                  </a>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Business */}
          <motion.div variants={fadeUp}>
            <Card className="h-full border-2 border-[#10B981] shadow-lg shadow-[#10B981]/10 relative overflow-visible flex flex-col">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <Badge className="bg-[#10B981] text-white px-4 shadow-sm text-[10px]">BEST FOR COMPANIES</Badge>
              </div>
              <CardHeader className="pb-4">
                <div className="text-sm text-slate-500 font-medium mb-1">BUSINESS</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900">$999</span>
                  <span className="text-slate-400 text-sm">/month</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">For companies that move fast</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col space-y-3.5">
                {BUSINESS_FEATURES.map(f => <FeatureItem key={f.text} {...f} />)}
                <div className="mt-auto pt-4">
                  <Separator className="mb-4" />
                  <a href="/register" className={cn(buttonVariants(), "w-full justify-center bg-[#10B981] hover:bg-[#059669] text-white shadow-md shadow-[#10B981]/20")}>
                    Get Started Today
                  </a>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Enterprise note */}
        <motion.p
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="text-center text-xs text-slate-400 mt-8"
        >
          Need a custom plan?{" "}
          <a href="mailto:sales@datainsight.ai" className="text-[#10B981] hover:underline font-medium">Talk to our sales team →</a>
        </motion.p>
      </div>
    </section>
  )
}

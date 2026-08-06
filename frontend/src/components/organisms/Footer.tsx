import { Separator } from "@/components/ui/separator"
import { Logo } from "@/components/atoms/Logo"

const NAV = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Excel Studio", href: "#excel-studio" },
  { label: "AI Copilot", href: "#copilot" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
]

const LEGAL = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Security Center", href: "/security" },
]

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12">
        <div className="grid sm:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3">
            <Logo size={24} textClassName="text-sm font-bold text-slate-900" />
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
              AI-powered business intelligence that eliminates manual reporting and unlocks predictive insights.
            </p>
          </div>
          {/* Nav */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">Product</div>
            {NAV.map((n) => (
              <a
                key={n.label}
                href={n.href}
                className="block text-xs text-slate-600 hover:text-slate-950 transition-colors"
              >
                {n.label}
              </a>
            ))}
          </div>
          {/* Legal */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">Company</div>
            {LEGAL.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="block text-xs text-slate-600 hover:text-slate-950 transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
        <Separator className="mb-6 bg-slate-200" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} Data Insight AI Inc. All rights reserved.</span>
          <span>Autonomous Business Intelligence Platform</span>
        </div>
      </div>
    </footer>
  )
}

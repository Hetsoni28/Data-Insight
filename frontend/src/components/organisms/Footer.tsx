
import { Separator } from "@/components/ui/separator"
import { Logo } from "@/components/atoms/Logo"

const NAV = ["Platform", "Solutions", "Enterprise", "Pricing"]
const LEGAL = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookie Settings", href: "/cookies" },
]

export function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
        <div className="grid sm:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3">
            <Logo size={20} textClassName="text-sm font-semibold text-slate-800" />
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
              AI-powered business intelligence that eliminates manual reporting and unlocks predictive insights.
            </p>
          </div>
          {/* Nav */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Product</div>
            {NAV.map(n => (
              <a key={n} href={`#${n.toLowerCase()}`}
                className="block text-sm text-slate-500 hover:text-slate-900 transition-colors">{n}</a>
            ))}
          </div>
          {/* Legal */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Company</div>
            {LEGAL.map(l => (
              <a key={l.label} href={l.href}
                className="block text-sm text-slate-500 hover:text-slate-900 transition-colors">{l.label}</a>
            ))}
          </div>
        </div>
        <Separator className="mb-6" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>© {new Date().getFullYear()} Data Insight. All rights reserved.</span>
        </div>
      </div>
    </footer>
  )
}

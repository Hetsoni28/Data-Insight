"use client"
import { motion } from "framer-motion"
import {
  Home, Search, User, Edit3, Share2, Tag, Trash2, Bell, Settings,
  CheckCircle2, AlertTriangle, XCircle, Info, Sparkles, ArrowRight,
  LayoutDashboard, Zap, ShieldCheck, TrendingUp, Star, Copy, Check
} from "lucide-react"
import { useState } from "react"

// ─── Colour Token ────────────────────────────────────────────────────────────
const brand = {
  primary:   "#10B981",
  secondary: "#059669",
  tertiary:  "#ECFDF5",
  neutral:   "#F8FAFC",
  dark:      "#0A3A2A",
  mid:       "#065F46",
}

const colorPalettes = [
  {
    name: "Primary",
    hex: "#10B981",
    shades: ["#D1FAE5","#A7F3D0","#6EE7B7","#34D399","#10B981","#059669","#047857","#065F46","#064E3B","#022C22"],
  },
  {
    name: "Secondary",
    hex: "#059669",
    shades: ["#ECFDF5","#D1FAE5","#A7F3D0","#6EE7B7","#34D399","#059669","#047857","#065F46","#064E3B","#022C22"],
  },
  {
    name: "Tertiary",
    hex: "#ECFDF5",
    shades: ["#ECFDF5","#F0FDF4","#DCFCE7","#BBF7D0","#86EFAC","#4ADE80","#22C55E","#16A34A","#15803D","#166534"],
  },
  {
    name: "Neutral",
    hex: "#F8FAFC",
    shades: ["#F8FAFC","#F1F5F9","#E2E8F0","#CBD5E1","#94A3B8","#64748B","#475569","#334155","#1E293B","#0F172A"],
  },
]

// ─── Section wrapper ─────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-2xl p-7 shadow-sm"
    >
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-5">{title}</h2>
      {children}
    </motion.div>
  )
}

// ─── Copyable hex badge ───────────────────────────────────────────────────────
function HexBadge({ hex }: { hex: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(hex); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
      {hex}
    </button>
  )
}

export default function DesignSystemPage() {
  const [toggleOn, setToggleOn] = useState(true)

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-8">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-8 shadow-xl"
        style={{ background: `linear-gradient(135deg, ${brand.dark} 0%, ${brand.mid} 100%)` }}
      >
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-20 blur-[80px]" style={{ background: brand.primary }} />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ background: `${brand.primary}33`, borderColor: `${brand.primary}55` }}>
                <Sparkles className="w-5 h-5" style={{ color: brand.primary }} />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Design System</h1>
            </div>
            <p className="text-emerald-100/70 text-sm max-w-xl">
              The single source of truth for Data Insight&apos;s visual language — colours, typography, components, and interactions. All tokens use the brand palette: <span className="text-white font-semibold">Primary #10B981</span>.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <div className="text-center bg-white/10 border border-white/20 rounded-xl px-5 py-3">
              <p className="text-2xl font-bold text-white">4</p>
              <p className="text-xs text-emerald-200">Colour Scales</p>
            </div>
            <div className="text-center bg-white/10 border border-white/20 rounded-xl px-5 py-3">
              <p className="text-2xl font-bold text-white">Inter</p>
              <p className="text-xs text-emerald-200">Typeface</p>
            </div>
            <div className="text-center bg-white/10 border border-white/20 rounded-xl px-5 py-3">
              <p className="text-2xl font-bold text-white">12+</p>
              <p className="text-xs text-emerald-200">Components</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Colour Palettes ────────────────────────────────────────────────── */}
      <Section title="Colour Palettes">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {colorPalettes.map((p) => (
            <div key={p.name}>
              {/* Swatch strip */}
              <div className="rounded-xl overflow-hidden mb-3 border border-slate-200 dark:border-white/10 shadow-sm">
                <div className="h-20 w-full" style={{ background: p.hex }} />
                <div className="grid grid-cols-5">
                  {p.shades.slice(0, 5).map((s) => (
                    <div key={s} className="h-6" style={{ background: s }} />
                  ))}
                </div>
                <div className="grid grid-cols-5">
                  {p.shades.slice(5).map((s) => (
                    <div key={s} className="h-6" style={{ background: s }} />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{p.name}</span>
                <HexBadge hex={p.hex} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* ── Typography ──────────────────────────────────────────────────── */}
        <Section title="Typography — Inter">
          <div className="space-y-6">
            {[
              { label: "Headline / Bold", size: "text-4xl", weight: "font-bold", sample: "Aa" },
              { label: "Body / Regular", size: "text-2xl", weight: "font-normal", sample: "Aa" },
              { label: "Label / Medium", size: "text-xl", weight: "font-medium", sample: "Aa" },
            ].map((t) => (
              <div key={t.label} className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5 last:border-0 last:pb-0">
                <div>
                  <p className="text-xs text-slate-400 mb-1">{t.label}</p>
                  <p className={`${t.size} ${t.weight} text-slate-900 dark:text-white font-[Inter,sans-serif]`}>{t.sample}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Inter</span>
                </div>
              </div>
            ))}
            {/* Scale */}
            <div className="pt-2">
              <p className="text-xs text-slate-400 mb-3">Type Scale</p>
              <div className="space-y-1">
                {["text-xs","text-sm","text-base","text-lg","text-xl","text-2xl","text-3xl"].map((s,i) => (
                  <p key={s} className={`${s} text-slate-700 dark:text-slate-300 font-medium leading-tight`}>
                    The quick brown fox jumps
                  </p>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ── Buttons ─────────────────────────────────────────────────────── */}
        <Section title="Button Variants">
          <div className="space-y-5">
            {/* Size variants */}
            <div>
              <p className="text-xs text-slate-400 mb-3">Sizes</p>
              <div className="flex flex-wrap items-center gap-3">
                <button className="px-2.5 py-1 text-xs font-semibold rounded-lg text-white" style={{ background: brand.primary }}>XS Button</button>
                <button className="px-3.5 py-1.5 text-sm font-semibold rounded-lg text-white" style={{ background: brand.primary }}>SM Button</button>
                <button className="px-5 py-2 text-sm font-semibold rounded-xl text-white" style={{ background: brand.primary }}>MD Button</button>
                <button className="px-6 py-2.5 text-base font-semibold rounded-xl text-white" style={{ background: brand.primary }}>LG Button</button>
              </div>
            </div>
            {/* Style variants */}
            <div>
              <p className="text-xs text-slate-400 mb-3">Variants</p>
              <div className="flex flex-wrap gap-3">
                <button className="px-5 py-2 text-sm font-semibold rounded-xl text-white shadow-md hover:opacity-90 transition" style={{ background: brand.primary }}>
                  Primary
                </button>
                <button className="px-5 py-2 text-sm font-semibold rounded-xl text-white shadow-md hover:opacity-90 transition" style={{ background: brand.dark }}>
                  Inverted
                </button>
                <button className="px-5 py-2 text-sm font-semibold rounded-xl border-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition" style={{ borderColor: brand.primary, color: brand.primary }}>
                  Outlined
                </button>
                <button className="px-5 py-2 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                  Secondary
                </button>
                <button className="px-5 py-2 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-50" disabled>
                  Disabled
                </button>
              </div>
            </div>
            {/* With icons */}
            <div>
              <p className="text-xs text-slate-400 mb-3">With Icons</p>
              <div className="flex flex-wrap gap-3">
                <button className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl text-white" style={{ background: brand.primary }}>
                  <Zap className="w-4 h-4" /> Get Started
                </button>
                <button className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl border-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition" style={{ borderColor: brand.primary, color: brand.primary }}>
                  Learn More <ArrowRight className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition" style={{ color: brand.primary }}>
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* ── Form Controls ───────────────────────────────────────────────── */}
        <Section title="Form Controls">
          <div className="space-y-4">
            {/* Text input */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Text Input</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  defaultValue=""
                  placeholder="Search…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 transition"
                  style={{ "--tw-ring-color": brand.primary } as any}
                />
              </div>
            </div>
            {/* Focused state */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Focused State</label>
              <input
                defaultValue="Active input"
                className="w-full px-4 py-2.5 rounded-xl border-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none"
                style={{ borderColor: brand.primary, boxShadow: `0 0 0 3px ${brand.primary}25` }}
              />
            </div>
            {/* Error state */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Error State</label>
              <input
                defaultValue="Invalid value"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-red-400 bg-red-50 dark:bg-red-900/10 text-slate-900 dark:text-white text-sm focus:outline-none"
              />
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><XCircle className="w-3 h-3" /> This field is required</p>
            </div>
            {/* Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Feature Toggle</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Enable or disable this feature</p>
              </div>
              <button
                onClick={() => setToggleOn(!toggleOn)}
                className="relative w-12 h-6 rounded-full transition-colors duration-200"
                style={{ background: toggleOn ? brand.primary : "#CBD5E1" }}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${toggleOn ? "left-7" : "left-1"}`} />
              </button>
            </div>
            {/* Select */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Select</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none" style={{ accentColor: brand.primary }}>
                <option>All Environments</option>
                <option>Production</option>
                <option>Staging</option>
              </select>
            </div>
          </div>
        </Section>

        {/* ── Badges & Status ─────────────────────────────────────────────── */}
        <Section title="Badges, Status & Alerts">
          <div className="space-y-5">
            {/* Badges */}
            <div>
              <p className="text-xs text-slate-400 mb-3">Badges</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold text-white" style={{ background: brand.primary }}>Primary</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold text-white" style={{ background: brand.dark }}>Dark</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: brand.tertiary, color: brand.secondary }}>Tertiary</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">Warning</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300">Error</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Neutral</span>
              </div>
            </div>
            {/* Status dots */}
            <div>
              <p className="text-xs text-slate-400 mb-3">Status Indicators</p>
              <div className="space-y-2">
                {[
                  { label: "Healthy / Online", dot: brand.primary },
                  { label: "Warning / Degraded", dot: "#F59E0B" },
                  { label: "Error / Down", dot: "#EF4444" },
                  { label: "Inactive / Offline", dot: "#94A3B8" },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: s.dot }} />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Alert boxes */}
            <div className="space-y-2">
              <p className="text-xs text-slate-400 mb-3">Alert Variants</p>
              <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: `${brand.primary}18`, border: `1px solid ${brand.primary}40` }}>
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: brand.primary }} />
                <p className="text-sm font-medium" style={{ color: brand.secondary }}>Success — Operation completed successfully.</p>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Warning — Please review before proceeding.</p>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30">
                <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                <p className="text-sm font-medium text-red-700 dark:text-red-300">Error — Something went wrong.</p>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30">
                <Info className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Info — Here&apos;s some helpful information.</p>
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* ── Icons & Action Buttons ────────────────────────────────────────── */}
      <Section title="Icons & Action Buttons">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Icon grid */}
          <div>
            <p className="text-xs text-slate-400 mb-4">Icon Library (Lucide)</p>
            <div className="grid grid-cols-8 gap-3">
              {[Home, Search, User, Settings, Bell, ShieldCheck, LayoutDashboard, TrendingUp,
                Edit3, Share2, Tag, Trash2, Star, Zap, CheckCircle2, ArrowRight].map((Icon, i) => (
                <div key={i} className="flex flex-col items-center gap-1 group">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 group-hover:border-emerald-400 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 transition-all">
                    <Icon className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
            {/* Coloured icon buttons */}
            <p className="text-xs text-slate-400 mt-5 mb-3">Action Icon Buttons</p>
            <div className="flex items-center gap-2">
              <button className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105" style={{ background: `${brand.primary}20`, color: brand.secondary }}>
                <Edit3 className="w-4 h-4" />
              </button>
              <button className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105" style={{ background: `${brand.primary}20`, color: brand.secondary }}>
                <Share2 className="w-4 h-4" />
              </button>
              <button className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-all hover:scale-105">
                <Tag className="w-4 h-4" />
              </button>
              <button className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 transition-all hover:scale-105">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* KPI Card preview */}
          <div>
            <p className="text-xs text-slate-400 mb-4">KPI Card</p>
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-5 bg-white dark:bg-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full blur-2xl opacity-30" style={{ background: brand.primary }} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Revenue</span>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${brand.primary}20` }}>
                    <TrendingUp className="w-4 h-4" style={{ color: brand.primary }} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">$84,291</p>
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: brand.primary }}>
                  <TrendingUp className="w-3 h-3" /> +12.4% from last month
                </p>
              </div>
            </div>

            {/* Progress bars */}
            <p className="text-xs text-slate-400 mt-5 mb-3">Progress Bars</p>
            <div className="space-y-3">
              {[
                { label: "API Usage", value: 78 },
                { label: "Storage", value: 45 },
                { label: "Seats Used", value: 92 },
              ].map(p => (
                <div key={p.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-400">{p.label}</span>
                    <span className="font-semibold" style={{ color: p.value > 80 ? "#EF4444" : brand.primary }}>{p.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${p.value}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="h-full rounded-full"
                      style={{ background: p.value > 80 ? "#EF4444" : brand.primary }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Spacing & Radii tokens ────────────────────────────────────────── */}
      <Section title="Spacing & Border Radius Tokens">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-xs text-slate-400 mb-4">Border Radii</p>
            <div className="flex flex-wrap items-end gap-4">
              {[
                { label: "sm", cls: "rounded-sm", px: 2 },
                { label: "md", cls: "rounded-md", px: 6 },
                { label: "lg", cls: "rounded-lg", px: 8 },
                { label: "xl", cls: "rounded-xl", px: 12 },
                { label: "2xl", cls: "rounded-2xl", px: 16 },
                { label: "3xl", cls: "rounded-3xl", px: 24 },
                { label: "full", cls: "rounded-full", px: 9999 },
              ].map(r => (
                <div key={r.label} className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 ${r.cls} border-2`} style={{ borderColor: brand.primary, background: `${brand.primary}15` }} />
                  <span className="text-xs text-slate-400">{r.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-4">Spacing Scale</p>
            <div className="space-y-2">
              {[1,2,4,6,8,12,16,20].map(s => (
                <div key={s} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-8">{s*4}px</span>
                  <div className="h-4 rounded" style={{ width: `${s * 12}px`, background: brand.primary, opacity: 0.2 + s * 0.07 }} />
                  <span className="text-xs text-slate-400">spacing-{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}

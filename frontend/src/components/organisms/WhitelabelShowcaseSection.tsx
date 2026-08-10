"use client"
import React, { useState } from "react"
import { motion } from "framer-motion"
import {
  Globe,
  Layers,
  Sparkles,
  Search,
  Home,
  User,
  Edit2,
  Tag,
  Trash2,
  Check,
} from "lucide-react"

const BRAND_THEMES = [
  {
    id: "emerald",
    name: "Enterprise Emerald",
    shortName: "Emerald",
    primary: "#10B981",
    primaryDark: "#065F46",
    secondary: "#059669",
    tertiary: "#ECFDF5",
    neutral: "#F8FAFC",
    activeCardBorder: "border-[#10B981]",
    activeCardBg: "bg-emerald-50/80",
    activeRing: "ring-[#10B981]",
    activeTextColor: "text-emerald-700",
    sampleDomain: "bi.apexholdings.com",
    primaryRamp: ["#022c22", "#064e3b", "#065f46", "#047857", "#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5"],
    secondaryRamp: ["#022c22", "#064e3b", "#065f46", "#047857", "#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5"],
    tertiaryRamp: ["#134e4a", "#115e59", "#0f766e", "#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4", "#ccfbf1", "#e6fffa", "#f0fdfa"],
    neutralRamp: ["#020617", "#0f172a", "#1e293b", "#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0", "#f8fafc"],
  },
  {
    id: "sapphire",
    name: "Corporate Sapphire",
    shortName: "Sapphire",
    primary: "#2563EB",
    primaryDark: "#1E3A8A",
    secondary: "#1D4ED8",
    tertiary: "#EFF6FF",
    neutral: "#F8FAFC",
    activeCardBorder: "border-[#2563EB]",
    activeCardBg: "bg-emerald-50/80",
    activeRing: "ring-[#2563EB]",
    activeTextColor: "text-emerald-700",
    sampleDomain: "insights.vortexgroup.io",
    primaryRamp: ["#172554", "#1e3a8a", "#1e40af", "#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe"],
    secondaryRamp: ["#0f172a", "#172554", "#1e3a8a", "#1e40af", "#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#dbeafe"],
    tertiaryRamp: ["#1e293b", "#1e3a8a", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe", "#eff6ff", "#f8faff"],
    neutralRamp: ["#020617", "#0f172a", "#1e293b", "#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0", "#f8fafc"],
  },
  {
    id: "indigo",
    name: "Royal Indigo",
    shortName: "Indigo",
    primary: "#6366F1",
    primaryDark: "#312E81",
    secondary: "#4F46E5",
    tertiary: "#EEF2FF",
    neutral: "#F8FAFC",
    activeCardBorder: "border-[#6366F1]",
    activeCardBg: "bg-indigo-50/80",
    activeRing: "ring-[#6366F1]",
    activeTextColor: "text-indigo-700",
    sampleDomain: "analytics.horizoncapital.com",
    primaryRamp: ["#1e1b4b", "#312e81", "#3730a3", "#4338ca", "#4f46e5", "#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff"],
    secondaryRamp: ["#1e1b4b", "#312e81", "#3730a3", "#4338ca", "#4f46e5", "#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff"],
    tertiaryRamp: ["#312e81", "#4338ca", "#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#ddd6fe", "#ede9fe", "#eef2ff", "#faf5ff"],
    neutralRamp: ["#020617", "#0f172a", "#1e293b", "#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0", "#f8fafc"],
  },
  {
    id: "slate",
    name: "Titanium Slate",
    shortName: "Slate",
    primary: "#334155",
    primaryDark: "#0F172A",
    secondary: "#1E293B",
    tertiary: "#F1F5F9",
    neutral: "#F8FAFC",
    activeCardBorder: "border-[#334155]",
    activeCardBg: "bg-slate-100",
    activeRing: "ring-[#334155]",
    activeTextColor: "text-slate-800",
    sampleDomain: "data.nexusenterprise.net",
    primaryRamp: ["#020617", "#0f172a", "#1e293b", "#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0", "#f8fafc"],
    secondaryRamp: ["#020617", "#0f172a", "#1e293b", "#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0", "#f8fafc"],
    tertiaryRamp: ["#0f172a", "#1e293b", "#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0", "#f1f5f9", "#f8fafc"],
    neutralRamp: ["#020617", "#0f172a", "#1e293b", "#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0", "#f8fafc"],
  },
]

export function WhitelabelShowcaseSection() {
  const [selectedThemeId, setSelectedThemeId] = useState<string>("emerald")
  const [customDomainInput, setCustomDomainInput] = useState<string>("")

  const activeTheme =
    BRAND_THEMES.find((t) => t.id === selectedThemeId) || BRAND_THEMES[0]

  const displayDomain =
    customDomainInput.trim() || activeTheme.sampleDomain

  return (
    <section id="whitelabel" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 text-slate-900 border-t border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* -- SECTION HEADER -- */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto space-y-4"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Your Brand. Your Domain.{" "}
            <span style={{ color: activeTheme.primary }}>Custom Design System.</span>
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Rent the Data Insight platform and customize all design tokens in real-time. Apply your corporate palette,
            custom typography, and branded components on your dedicated private domain.
          </p>
        </motion.div>

        {/* -- CLEAN TOP CONTROLS BAR (NO CRAMPED SIDEBAR, NO BOX ERRORS) -- */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-lg shadow-slate-200/50 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          {/* Theme Switcher */}
          <div className="w-full md:w-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
              Brand Palette:
            </span>
            <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
              {BRAND_THEMES.map((theme) => {
                const isSelected = selectedThemeId === theme.id
                return (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedThemeId(theme.id)}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? `${theme.activeCardBg} ${theme.activeCardBorder} shadow-sm ring-1.5 ${theme.activeRing} ${theme.activeTextColor}`
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className="h-3 w-3 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: theme.primary }}
                    />
                    <span>{theme.shortName}</span>
                    {isSelected && <Check className="h-3 w-3 shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Domain Input */}
          <div className="w-full md:w-72 flex items-center gap-2">
            <div className="relative w-full">
              <Globe className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={activeTheme.sampleDomain}
                value={customDomainInput}
                onChange={(e) => setCustomDomainInput(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </motion.div>

        {/* -- FULL-WIDTH DESIGN SYSTEM & TOKENS CANVAS -- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60 overflow-hidden"
        >
          {/* Browser Address Bar */}
          <div className="p-3.5 border-b border-slate-200 bg-slate-100 flex items-center gap-3">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="h-3 w-3 rounded-full bg-rose-400" />
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="h-3 w-3 rounded-full bg-emerald-400" />
            </div>

            <div className="flex-1 bg-white h-7 rounded-lg border border-slate-200 px-3 flex items-center gap-2 text-xs font-mono text-slate-700 shadow-2xs overflow-hidden">
              <span className="font-bold shrink-0" style={{ color: activeTheme.primary }}>https://</span>
              <span className="font-semibold text-slate-900 truncate">{displayDomain}</span>
              <span className="text-slate-400 shrink-0">/design-tokens</span>
            </div>

            <span
              className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded shrink-0"
              style={{
                backgroundColor: `${activeTheme.primary}1A`,
                color: activeTheme.primary,
              }}
            >
              SSL Secured
            </span>
          </div>

          {/* Canvas Body */}
          <div className="p-6 md:p-8 bg-slate-100/70">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              
              {/* Column 1: Color Swatch Ramps */}
              <div className="md:col-span-4 space-y-3.5">
                {/* Primary Swatch */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>Primary</span>
                    <span className="font-mono text-[11px] text-slate-500 font-semibold">{activeTheme.primary}</span>
                  </div>
                  <div
                    className="h-11 rounded-xl w-full shadow-2xs transition-colors duration-300"
                    style={{ backgroundColor: activeTheme.primary }}
                  />
                  <div className="grid grid-cols-10 h-6 rounded-lg overflow-hidden border border-slate-200/60">
                    {activeTheme.primaryRamp.map((color, i) => (
                      <div key={i} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>

                {/* Secondary Swatch */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>Secondary</span>
                    <span className="font-mono text-[11px] text-slate-500 font-semibold">{activeTheme.secondary}</span>
                  </div>
                  <div
                    className="h-11 rounded-xl w-full shadow-2xs transition-colors duration-300"
                    style={{ backgroundColor: activeTheme.secondary }}
                  />
                  <div className="grid grid-cols-10 h-6 rounded-lg overflow-hidden border border-slate-200/60">
                    {activeTheme.secondaryRamp.map((color, i) => (
                      <div key={i} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>

                {/* Tertiary Swatch */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>Tertiary</span>
                    <span className="font-mono text-[11px] text-slate-500 font-semibold">{activeTheme.tertiary}</span>
                  </div>
                  <div className="grid grid-cols-10 h-6 rounded-lg overflow-hidden border border-slate-200/60">
                    {activeTheme.tertiaryRamp.map((color, i) => (
                      <div key={i} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>

                {/* Neutral Swatch */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>Neutral</span>
                    <span className="font-mono text-[11px] text-slate-500 font-semibold">{activeTheme.neutral}</span>
                  </div>
                  <div className="grid grid-cols-10 h-6 rounded-lg overflow-hidden border border-slate-200/60">
                    {activeTheme.neutralRamp.map((color, i) => (
                      <div key={i} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Column 2: Typography Tokens */}
              <div className="md:col-span-4 space-y-3.5">
                {/* Headline Typography */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between h-[138px]">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>Headline</span>
                    <span className="text-[11px] font-medium text-slate-400">Inter</span>
                  </div>
                  <div className="text-5xl font-black text-slate-900 tracking-tight">
                    Aa
                  </div>
                </div>

                {/* Body Typography */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between h-[138px]">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>Body</span>
                    <span className="text-[11px] font-medium text-slate-400">Inter</span>
                  </div>
                  <div className="text-4xl font-semibold text-slate-800 tracking-tight">
                    Aa
                  </div>
                </div>

                {/* Label Typography */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between h-[138px]">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>Label</span>
                    <span className="text-[11px] font-medium text-slate-400">Inter</span>
                  </div>
                  <div className="text-3xl font-medium text-slate-700 tracking-tight">
                    Aa
                  </div>
                </div>
              </div>

              {/* Column 3: Themed Component Tokens */}
              <div className="md:col-span-4 space-y-3.5">
                {/* Button Variant Strip */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      className="py-2 px-3 rounded-lg text-xs font-bold text-white shadow-2xs flex items-center justify-center transition-all cursor-pointer"
                      style={{ backgroundColor: activeTheme.primaryDark }}
                    >
                      Primary
                    </button>
                    <button className="py-2 px-3 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/70">
                      Secondary
                    </button>
                    <button className="py-2 px-3 rounded-lg text-xs font-medium bg-slate-900 text-white">
                      Inverted
                    </button>
                    <button className="py-2 px-3 rounded-lg text-xs font-medium bg-white text-slate-800 border border-slate-300">
                      Outlined
                    </button>
                  </div>
                </div>

                {/* Search Input Token */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 text-xs text-slate-500 border border-slate-200/60">
                    <Search className="h-3.5 w-3.5 text-slate-400" />
                    <span>Search</span>
                  </div>
                </div>

                {/* Accent Lines & Navigation Pill Strip */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                  <div className="space-y-1.5">
                    <div
                      className="h-1.5 rounded-full w-4/5 transition-colors duration-300"
                      style={{ backgroundColor: activeTheme.primaryDark }}
                    />
                    <div
                      className="h-1.5 rounded-full w-full transition-colors duration-300"
                      style={{ backgroundColor: activeTheme.primary }}
                    />
                    <div className="h-1.5 rounded-full w-3/5 bg-slate-700" />
                  </div>

                  {/* Navigation Icon Bar */}
                  <div className="pt-2 flex items-center justify-around p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                    <div
                      className="h-7 w-7 rounded-full flex items-center justify-center text-white shadow-2xs transition-colors duration-300"
                      style={{ backgroundColor: activeTheme.primaryDark }}
                    >
                      <Home className="h-3.5 w-3.5" />
                    </div>
                    <Search className="h-3.5 w-3.5 text-slate-500" />
                    <User className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                </div>

                {/* Action Buttons & Round Utilities */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-slate-200 flex items-center justify-center text-slate-700">
                      <Edit2 className="h-4 w-4" />
                    </div>
                    <button
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-2xs transition-colors duration-300 cursor-pointer"
                      style={{ backgroundColor: activeTheme.primary }}
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Label</span>
                    </button>
                  </div>

                  {/* 4 Circular Action Badges */}
                  <div className="flex items-center justify-around pt-1">
                    <div
                      className="h-7 w-7 rounded-full flex items-center justify-center text-white shadow-2xs transition-colors duration-300"
                      style={{ backgroundColor: activeTheme.primaryDark }}
                    >
                      <Sparkles className="h-3 w-3" />
                    </div>
                    <div
                      className="h-7 w-7 rounded-full flex items-center justify-center text-white shadow-2xs transition-colors duration-300"
                      style={{ backgroundColor: activeTheme.primary }}
                    >
                      <Layers className="h-3 w-3" />
                    </div>
                    <div className="h-7 w-7 rounded-full bg-slate-700 flex items-center justify-center text-white shadow-2xs">
                      <Tag className="h-3 w-3" />
                    </div>
                    <div className="h-7 w-7 rounded-full bg-rose-600 flex items-center justify-center text-white shadow-2xs">
                      <Trash2 className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}

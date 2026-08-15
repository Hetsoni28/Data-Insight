"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Logo } from "@/components/atoms/Logo"

interface AuthLayoutProps {
  children: React.ReactNode
  variant: "login" | "forgot-password" | "reset-password" | "verify-email" | "invite"
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50 font-sans">
      {/* ── Left Panel: Clean Solid Enterprise Emerald Green (No extra boxes/badges) ── */}
      <div className="hidden lg:flex flex-col justify-between bg-[#064e3b] p-12 relative border-r border-[#043427] text-white">
        
        {/* Top Header Logo */}
        <div className="flex items-center justify-between z-10">
          <Logo size={34} whiteMode textClassName="text-lg tracking-tight font-bold" />
          <Link
            href="/"
            className="text-xs font-semibold text-emerald-100/90 hover:text-white flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/10 border border-white/15 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Landing Page</span>
          </Link>
        </div>

        {/* Center Main Headline & Description */}
        <div className="space-y-4 max-w-lg my-auto py-8 z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight">
            Turn Raw Data into <br />
            <span className="text-emerald-300">Automated Intelligence.</span>
          </h2>
          <p className="text-emerald-100/80 text-base leading-relaxed">
            Autonomous multi-tenant data processing, statistical profiling, and instant multi-tab Excel reporting for your enterprise.
          </p>
        </div>

        {/* Clean Footer Copyright */}
        <div className="pt-6 border-t border-white/10 text-xs text-emerald-200/60 z-10">
          © {new Date().getFullYear()} Data Insight. All rights reserved.
        </div>

      </div>

      {/* ── Right Panel: Form ── */}
      <div className="flex flex-col justify-center p-6 sm:p-12 bg-slate-50">
        {children}
      </div>
    </div>
  )
}

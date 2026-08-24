"use client"

import React from "react"
import { motion } from "framer-motion"
import { Sparkles, ArrowRight } from "lucide-react"

export function HeroSection() {

  return (
    <>
      <section className="relative w-full h-[100vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* ── FULL SCREEN BACKGROUND VIDEO ── */}
        <div className="absolute inset-0 w-full h-full z-0">
          <video 
            src="/videos/hero-animation.mp4" 
            className="w-full h-full object-cover"
            autoPlay 
            muted 
            loop 
            playsInline
          />
          {/* Dark Overlay for text readability */}
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10 w-full">
          {/* ── HERO TEXT CONTENT ── */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-4xl mx-auto space-y-6"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1]">
              Turn-Key Enterprise AI Platform <br />
              <span className="text-emerald-400">
                Rented For Your Business.
              </span>
            </h1>

            {/* Optional Primary CTA if needed (similar to reference) */}
            <div className="pt-6 flex justify-center">
              <button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-8 rounded-full shadow-lg shadow-emerald-500/30 transition-transform active:scale-95 uppercase tracking-wide text-sm">
                Experience The Platform
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SYSTEM DEMO VIDEOS (BELOW THE FOLD) ── */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-6xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">See The Platform In Action</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Video 1: Hero */}
            <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/50 backdrop-blur-md overflow-hidden flex flex-col group transition-transform hover:-translate-y-1 duration-500">
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Platform Overview</h3>
                </div>
              </div>
              <div className="relative w-full aspect-video bg-slate-900">
                <video 
                  src="/videos/hero-video-1.mp4" 
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  controls
                />
              </div>
            </div>

            {/* Video 2: Prompt */}
            <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/50 backdrop-blur-md overflow-hidden flex flex-col group transition-transform hover:-translate-y-1 duration-500">
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">AI Prompt & Workflow</h3>
                </div>
              </div>
              <div className="relative w-full aspect-video bg-slate-900">
                <video 
                  src="/videos/hero-video-2.mp4" 
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  controls
                />
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </>
  )
}

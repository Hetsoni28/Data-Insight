"use client"
import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"

const options = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "system", icon: Monitor, label: "System" },
  { value: "dark", icon: Moon, label: "Dark" },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => setMounted(true), [])
  if (!mounted) {
    return (
      <div className="flex p-1 bg-slate-100/50 dark:bg-[#082f22]/50 border border-slate-200/60 dark:border-emerald-900/30 rounded-xl animate-pulse h-[34px] w-[210px]" />
    )
  }

  return (
    <div className="flex items-center p-1 bg-slate-100/50 dark:bg-[#082f22]/50 border border-slate-200/60 dark:border-emerald-900/30 rounded-xl shadow-inner relative">
      {options.map((option) => {
        const isActive = theme === option.value
        const Icon = option.icon

        return (
          <button
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={`relative flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg z-10 transition-colors duration-300 ${
              isActive 
                ? "text-emerald-900 dark:text-emerald-100" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-emerald-500/60 dark:hover:text-emerald-300"
            }`}
            aria-label={option.label}
          >
            {isActive && (
              <motion.div
                layoutId="theme-toggle-active"
                className="absolute inset-0 bg-white dark:bg-emerald-800/40 rounded-lg shadow-sm border border-slate-200/50 dark:border-emerald-700/50"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <Icon className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10 text-[11px] font-bold tracking-widest uppercase">
              {option.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

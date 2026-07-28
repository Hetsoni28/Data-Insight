"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface TooltipContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}
const TooltipContext = React.createContext<TooltipContextValue>({
  open: false,
  setOpen: () => {},
})

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------
function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function Tooltip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div 
        className="relative inline-block" 
        ref={containerRef}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
      </div>
    </TooltipContext.Provider>
  )
}

function TooltipTrigger({
  children,
  asChild,
}: {
  children: React.ReactNode
  asChild?: boolean
}) {
  if (asChild && React.isValidElement(children)) {
    return children
  }
  return <>{children}</>
}

function TooltipContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { open } = React.useContext(TooltipContext)
  
  if (!open) return null

  return (
    <div
      className={cn(
        "absolute z-50 mb-2 w-max max-w-xs -translate-x-1/2 left-1/2 bottom-full rounded-md bg-slate-900 px-3 py-1.5 text-xs text-white opacity-100 shadow-md",
        className
      )}
      {...props}
    >
      {children}
      <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
    </div>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }

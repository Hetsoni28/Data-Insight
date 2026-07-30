"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value?: number }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className={cn("relative flex h-1 w-full items-center overflow-hidden rounded-full bg-slate-100 dark:bg-white/10", className)}
      {...props}
    >
      <div 
        className="h-full bg-emerald-500 transition-all duration-500 ease-in-out" 
        style={{ width: `${value || 0}%` }}
      />
    </div>
  )
}

export { Progress }

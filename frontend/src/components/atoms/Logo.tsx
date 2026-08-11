"use client"

import Link from "next/link"
import { useId } from "react"
import { cn } from "@/lib/utils"

interface LogoProps {
  size?: number
  showText?: boolean
  className?: string
  textClassName?: string
  /** Pass null to render without a link wrapper */
  href?: string | null
  /** Use white color — for dark backgrounds */
  whiteMode?: boolean
}

export function Logo({
  size = 32,
  showText = true,
  className,
  textClassName,
  href = "/",
  whiteMode = false,
}: LogoProps) {
  const id = useId()
  const pGrad = `pGrad-${id}`
  const sGrad = `sGrad-${id}`
  const aGrad = `aGrad-${id}`
  const glowId = `glow-${id}`

  // Colors for gradients
  const primaryColors = whiteMode
    ? [{ o: "0%", c: "#FFFFFF", a: 1 }, { o: "50%", c: "#FFFFFF", a: 0.9 }, { o: "100%", c: "#FFFFFF", a: 0.7 }]
    : [{ o: "0%", c: "#34D399", a: 1 }, { o: "50%", c: "#10B981", a: 1 }, { o: "100%", c: "#059669", a: 1 }]

  const secondaryColors = whiteMode
    ? [{ o: "0%", c: "#FFFFFF", a: 0.6 }, { o: "100%", c: "#FFFFFF", a: 1 }]
    : [{ o: "0%", c: "#047857", a: 1 }, { o: "100%", c: "#10B981", a: 1 }]

  const accentColors = whiteMode
    ? [{ o: "0%", c: "#FFFFFF", a: 0.8 }, { o: "100%", c: "#FFFFFF", a: 1 }]
    : [{ o: "0%", c: "#059669", a: 1 }, { o: "100%", c: "#6EE7B7", a: 1 }]

  const glowColor = whiteMode ? "#FFFFFF" : "#10B981"
  const innerNodeColor = whiteMode ? "#FFFFFF" : "#FFFFFF"

  // Scale height based on size keeping original aspect ratio
  // Original viewBox 0 0 160 160 (icon part only for standalone usage)
  
  const icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
      className={className}
    >
      <defs>
        <linearGradient id={pGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          {primaryColors.map((s, i) => (
            <stop key={i} offset={s.o} stopColor={s.c} stopOpacity={s.a} />
          ))}
        </linearGradient>
        <linearGradient id={sGrad} x1="0%" y1="100%" x2="100%" y2="0%">
          {secondaryColors.map((s, i) => (
            <stop key={i} offset={s.o} stopColor={s.c} stopOpacity={s.a} />
          ))}
        </linearGradient>
        <linearGradient id={aGrad} x1="0%" y1="100%" x2="100%" y2="0%">
          {accentColors.map((s, i) => (
            <stop key={i} offset={s.o} stopColor={s.c} stopOpacity={s.a} />
          ))}
        </linearGradient>
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor={glowColor} floodOpacity="0.25" />
        </filter>
      </defs>

      <g transform="translate(10, 30)">
        <path d="M 20 100 V 0 H 50 C 83.137 0 110 22.386 110 50 C 110 77.614 83.137 100 50 100 H 20 Z" 
              fill="none" 
              stroke={`url(#${pGrad})`} 
              strokeWidth="18" 
              strokeLinecap="round" 
              strokeLinejoin="round" />
              
        <line x1="140" y1="0" x2="140" y2="100" 
              stroke={`url(#${sGrad})`} 
              strokeWidth="18" 
              strokeLinecap="round" />

        <path d="M 45 65 L 70 40 L 90 55 L 140 10" 
              fill="none" 
              stroke={`url(#${aGrad})`} 
              strokeWidth="12" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              filter={`url(#${glowId})`} />

        <circle cx="140" cy="10" r="6" fill={innerNodeColor} />
        <circle cx="45" cy="65" r="4.5" fill={innerNodeColor} />
      </g>
    </svg>
  )

  const content = (
    <div className={cn("flex items-center gap-2", className)}>
      {icon}
      {showText && (
        <span
          className={cn(
            "font-sans font-bold leading-none select-none tracking-tight",
            textClassName
          )}
        >
          {whiteMode ? (
            <>
              <span className="text-white">Data</span>
              <span className="text-emerald-50"> Insight</span>
            </>
          ) : (
            <>
              <span className="text-slate-900 dark:text-white">Data</span>
              <span className="text-emerald-500 dark:text-emerald-400"> Insight</span>
            </>
          )}
        </span>
      )}
    </div>
  )

  if (href === null) return content
  return (
    <Link href={href} aria-label="Data Insight – go to home">
      {content}
    </Link>
  )
}

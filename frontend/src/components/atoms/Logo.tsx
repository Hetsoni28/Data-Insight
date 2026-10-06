"use client"

import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  size?: number
  showText?: boolean
  className?: string
  textClassName?: string
  /** Pass null to render without a link wrapper */
  href?: string | null
  /** Use white color - for dark backgrounds */
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
  
  const icon = (
    <Image
      src="/logo.svg"
      alt="Data Insight Logo"
      width={size * 4} // Wide aspect ratio for the full logo
      height={size}
      className={cn(
        "object-contain", 
        !whiteMode && "drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]", // Subtle shadow to make white text readable on light backgrounds
        className
      )}
      priority
    />
  )

  const content = (
    <div className={cn("flex items-center", className)}>
      {icon}
    </div>
  )

  if (href === null) return content
  return (
    <Link href={href} aria-label="Data Insight - go to home">
      {content}
    </Link>
  )
}

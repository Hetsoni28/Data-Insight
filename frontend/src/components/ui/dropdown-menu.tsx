"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Context — stores open state, a stable toggle, and refs to BOTH trigger & content
// ---------------------------------------------------------------------------
interface DropdownContextValue {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  triggerEl: HTMLElement | null
  setTriggerEl: (el: HTMLElement | null) => void
  contentEl: HTMLElement | null
  setContentEl: (el: HTMLElement | null) => void
}

const DropdownContext = React.createContext<DropdownContextValue>({
  open: false,
  setOpen: () => {},
  triggerEl: null,
  setTriggerEl: () => {},
  contentEl: null,
  setContentEl: () => {},
})

// ---------------------------------------------------------------------------
// Root — tracks trigger + content elements for outside-click detection
// ---------------------------------------------------------------------------
export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const [triggerEl, setTriggerEl] = React.useState<HTMLElement | null>(null)
  const [contentEl, setContentEl] = React.useState<HTMLElement | null>(null)

  React.useEffect(() => {
    if (!open) return
    const handleDown = (e: MouseEvent) => {
      const target = e.target as Node
      const inTrigger = triggerEl?.contains(target)
      const inContent = contentEl?.contains(target)
      if (!inTrigger && !inContent) {
        setOpen(false)
      }
    }
    // Use setTimeout so the click that opened the menu doesn't immediately close it
    const id = setTimeout(() => document.addEventListener("mousedown", handleDown), 0)
    return () => {
      clearTimeout(id)
      document.removeEventListener("mousedown", handleDown)
    }
  }, [open, triggerEl, contentEl])

  // Close on Escape
  React.useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open])

  return (
    <DropdownContext.Provider value={{ open, setOpen, triggerEl, setTriggerEl, contentEl, setContentEl }}>
      <div className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Trigger — attaches ref callback so triggerEl is always correct DOM node
// ---------------------------------------------------------------------------
export function DropdownMenuTrigger({
  children,
  asChild,
}: {
  children: React.ReactNode
  asChild?: boolean
}) {
  const { open, setOpen, setTriggerEl } = React.useContext(DropdownContext)

  const refCallback = React.useCallback(
    (el: HTMLElement | null) => setTriggerEl(el),
    [setTriggerEl]
  )

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen((prev) => !prev)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref: refCallback,
      onClick: (e: React.MouseEvent) => {
        ;(children as any).props?.onClick?.(e)
        handleClick(e)
      },
    })
  }

  return (
    <button
      ref={refCallback as React.RefCallback<HTMLButtonElement>}
      type="button"
      onClick={handleClick}
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Content — portal-rendered so overflow:hidden NEVER clips it
// ---------------------------------------------------------------------------
export function DropdownMenuContent({
  className,
  align = "start",
  children,
  sideOffset = 6,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  align?: "start" | "end" | "center"
  sideOffset?: number
}) {
  const { open, triggerEl, setContentEl } = React.useContext(DropdownContext)
  const [mounted, setMounted] = React.useState(false)
  const [rect, setRect] = React.useState<DOMRect | null>(null)

  React.useEffect(() => { setMounted(true) }, [])

  // Recalculate trigger position every time the menu opens
  React.useEffect(() => {
    if (open && triggerEl) {
      setRect(triggerEl.getBoundingClientRect())
    }
  }, [open, triggerEl])

  if (!mounted || !open || !rect) return null

  // position: fixed uses viewport coords — getBoundingClientRect is already viewport-relative,
  // so we must NOT add window.scrollY / window.scrollX here.
  const viewportHeight = window.innerHeight
  const spaceBelow = viewportHeight - rect.bottom - sideOffset
  const spaceAbove = rect.top - sideOffset
  const maxDropdownHeight = 320 // px

  // Flip upward if not enough space below
  const openUpward = spaceBelow < Math.min(maxDropdownHeight, 200) && spaceAbove > spaceBelow
  const top = openUpward
    ? rect.top - sideOffset
    : rect.bottom + sideOffset

  let left = rect.left
  if (align === "end")    left = rect.right
  else if (align === "center") left = rect.left + rect.width / 2

  const transformY = openUpward ? "-100%" : "0%"
  const transformX =
    align === "end" ? "-100%" : align === "center" ? "-50%" : "0%"

  return createPortal(
    <div
      ref={(el) => setContentEl(el)}
      style={{
        position: "fixed",
        top,
        left,
        transform: `translateX(${transformX}) translateY(${transformY})`,
        zIndex: 99999,
        maxHeight: `${maxDropdownHeight}px`,
        overflowY: "auto",
      }}
      className={cn(
        "min-w-[10rem] rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-slate-700 p-1.5 shadow-2xl",
        className
      )}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </div>,
    document.body
  )
}

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------
export function DropdownMenuItem({
  className,
  onClick,
  children,
  disabled,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { disabled?: boolean }) {
  const { setOpen } = React.useContext(DropdownContext)

  return (
    <div
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      className={cn(
        "flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm outline-none transition-all",
        "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
        disabled && "pointer-events-none opacity-40",
        className
      )}
      onClick={(e) => {
        if (disabled) return
        e.stopPropagation()
        onClick?.(e)
        setOpen(false)
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          if (!disabled) {
            onClick?.(e as any)
            setOpen(false)
          }
        }
      }}
      {...props}
    >
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Separator
// ---------------------------------------------------------------------------
export function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("-mx-1 my-1 h-px bg-slate-200 dark:bg-white/10", className)} {...props} />
}

// ---------------------------------------------------------------------------
// Label  — used for section headings inside dropdown (e.g. "Actions")
// ---------------------------------------------------------------------------
export function DropdownMenuLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-3 py-1.5 text-[11px] font-semibold text-slate-400 select-none", className)}
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// Header — used for entity name headers (org name, user name, etc.)
// Shows the entity name in normal case with a subtitle below it
// ---------------------------------------------------------------------------
export function DropdownMenuHeader({
  title,
  subtitle,
  className,
}: { title: string; subtitle?: string; className?: string }) {
  return (
    <div className={cn("px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 mb-1", className)}>
      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{title}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>}
    </div>
  )
}

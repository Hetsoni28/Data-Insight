"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface DropdownContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}
const DropdownContext = React.createContext<DropdownContextValue>({
  open: false,
  setOpen: () => {},
})

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------
function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block text-left" ref={menuRef}>
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

function DropdownMenuTrigger({
  children,
  asChild,
}: {
  children: React.ReactNode
  asChild?: boolean
}) {
  const { open, setOpen } = React.useContext(DropdownContext)
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        ;(children as any).props?.onClick?.(e)
        setOpen(!open)
      },
    })
  }

  return (
    <button type="button" onClick={() => setOpen(!open)}>
      {children}
    </button>
  )
}

function DropdownMenuContent({
  className,
  align = "start",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { align?: "start" | "end" | "center" }) {
  const { open } = React.useContext(DropdownContext)
  
  if (!open) return null

  const alignmentClasses = {
    start: "left-0 origin-top-left",
    end: "right-0 origin-top-right",
    center: "left-1/2 -translate-x-1/2 origin-top",
  }

  return (
    <div
      className={cn(
        "absolute z-50 mt-2 min-w-[8rem] rounded-md bg-white p-1 shadow-md ring-1 ring-black ring-opacity-5 focus:outline-none",
        alignmentClasses[align],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function DropdownMenuItem({
  className,
  onClick,
  children,
  disabled,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { disabled?: boolean }) {
  const { setOpen } = React.useContext(DropdownContext)
  
  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      onClick={(e) => {
        if (disabled) return
        onClick?.(e)
        setOpen(false)
      }}
      {...props}
    >
      {children}
    </div>
  )
}

function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("-mx-1 my-1 h-px bg-slate-200", className)} {...props} />
}

function DropdownMenuLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-2 py-1.5 text-sm font-semibold", className)}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
}

"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface DialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}
const DialogContext = React.createContext<DialogContextValue>({
  open: false,
  onOpenChange: () => {},
})

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------
function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const handleChange = (v: boolean) => {
    if (!isControlled) setInternalOpen(v)
    onOpenChange?.(v)
  }

  // close on Escape
  React.useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleChange(false)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [isOpen])

  // lock scroll
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  return (
    <DialogContext.Provider value={{ open: isOpen, onOpenChange: handleChange }}>
      {children}
    </DialogContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------
function DialogTrigger({
  children,
  asChild,
}: {
  children: React.ReactNode
  asChild?: boolean
}) {
  const { onOpenChange } = React.useContext(DialogContext)
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        ;(children as any).props?.onClick?.(e)
        onOpenChange(true)
      },
    })
  }
  return (
    <button type="button" onClick={() => onOpenChange(true)}>
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Portal
// ---------------------------------------------------------------------------
function DialogPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)
  // eslint-disable-next-line
  React.useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return createPortal(children, document.body)
}

// ---------------------------------------------------------------------------
// Overlay
// ---------------------------------------------------------------------------
function DialogOverlay({
  className,
  onClick,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
        className
      )}
      onClick={onClick}
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// Close
// ---------------------------------------------------------------------------
function DialogClose({
  children,
  asChild,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const { onOpenChange } = React.useContext(DialogContext)
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        ;(children as any).props?.onClick?.(e)
        onOpenChange(false)
      },
    })
  }
  return (
    <button
      type="button"
      className={className}
      onClick={() => onOpenChange(false)}
      {...props}
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { showCloseButton?: boolean }) {
  const { open, onOpenChange } = React.useContext(DialogContext)
  if (!open) return null
  return (
    <DialogPortal>
      <DialogOverlay onClick={() => onOpenChange(false)} />
      <div
        role="dialog"
        aria-modal="true"
        data-slot="dialog-content"
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl ring-1 ring-black/10 sm:max-w-lg",
          className
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
        {showCloseButton && (
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-3 top-3 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}
      </div>
    </DialogPortal>
  )
}

// ---------------------------------------------------------------------------
// Header / Footer / Title / Description
// ---------------------------------------------------------------------------
function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="dialog-header" className={cn("flex flex-col gap-2 mb-4", className)} {...props} />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { showCloseButton?: boolean }) {
  const { onOpenChange } = React.useContext(DialogContext)
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-4", className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50"
        >
          Close
        </button>
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 data-slot="dialog-title" className={cn("text-lg font-semibold leading-none", className)} {...props} />
  )
}

function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p data-slot="dialog-description" className={cn("text-sm text-slate-500 mt-1", className)} {...props} />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}

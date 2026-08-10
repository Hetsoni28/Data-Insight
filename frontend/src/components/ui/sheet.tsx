"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface SheetContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}
const SheetContext = React.createContext<SheetContextValue>({
  open: false,
  setOpen: () => {},
})

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------
function Sheet({
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
    <SheetContext.Provider value={{ open: isOpen, setOpen: handleChange }}>
      {children}
    </SheetContext.Provider>
  )
}

function SheetTrigger({
  children,
  asChild,
}: {
  children: React.ReactNode
  asChild?: boolean
}) {
  const { setOpen } = React.useContext(SheetContext)
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        ;(children as any).props?.onClick?.(e)
        setOpen(true)
      },
    })
  }
  return (
    <button type="button" onClick={() => setOpen(true)}>
      {children}
    </button>
  )
}

function SheetClose({
  children,
  asChild,
}: {
  children: React.ReactNode
  asChild?: boolean
}) {
  const { setOpen } = React.useContext(SheetContext)
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        ;(children as any).props?.onClick?.(e)
        setOpen(false)
      },
    })
  }
  return (
    <button type="button" onClick={() => setOpen(false)}>
      {children}
    </button>
  )
}

function SheetPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)
  // eslint-disable-next-line
  React.useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return createPortal(children, document.body)
}

function SheetOverlay({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { setOpen } = React.useContext(SheetContext)
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
        className
      )}
      onClick={() => setOpen(false)}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
}) {
  const { open, setOpen } = React.useContext(SheetContext)
  
  if (!open) return null

  const sideClasses = {
    top: "inset-x-0 top-0 h-auto border-b",
    bottom: "inset-x-0 bottom-0 h-auto border-t",
    left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
    right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
  }

  return (
    <SheetPortal>
      <SheetOverlay />
      <div
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-white dark:bg-white/5 p-6 text-sm shadow-xl",
          sideClasses[side],
          className
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
        {showCloseButton && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}
      </div>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mt-auto flex flex-col gap-2 pt-4 sm:flex-row sm:justify-end", className)} {...props} />
}

function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold text-slate-900 dark:text-white", className)} {...props} />
}

function SheetDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-slate-500 dark:text-slate-400", className)} {...props} />
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}

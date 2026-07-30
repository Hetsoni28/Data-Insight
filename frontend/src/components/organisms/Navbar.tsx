"use client"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Search, Menu } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/atoms/Logo"

const NAV = ["Platform", "Solutions", "Enterprise", "Pricing"]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur shadow-sm border-b" : "bg-white/80 backdrop-blur"}`}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 flex h-14 items-center gap-8">
        <Logo size={24} textClassName="text-sm" />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV.map(n => (
            <a key={n} href={`#${n.toLowerCase()}`}
              className="px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              {n}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3 ml-auto">
          <Button asChild size="sm" className="bg-[#10B981] hover:bg-[#059669] text-white shadow-sm px-4 text-xs">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>

        {/* Mobile — Sheet drawer */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="ml-auto md:hidden text-slate-500 dark:text-slate-400 p-2" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            <SheetHeader className="px-5 py-4 border-b">
              <SheetTitle className="flex items-center gap-2 text-left">
                <Logo size={20} href={null} />
              </SheetTitle>
            </SheetHeader>
            <div className="px-4 py-4 space-y-1">
              {NAV.map(n => (
                <SheetClose asChild key={n}>
                  <a href={`#${n.toLowerCase()}`}
                    className="flex items-center px-3 py-2.5 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors">
                    {n}
                  </a>
                </SheetClose>
              ))}
              <Separator className="my-3" />
              <SheetClose asChild>
                <a href="/login" className={cn(buttonVariants(), "w-full justify-center rounded-lg bg-[#10B981] hover:bg-[#059669] text-white")}>
                  Sign In
                </a>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}

"use client"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Menu, ArrowRight } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/atoms/Logo"

const NAV_LINKS = [
  { name: "How It Works", href: "#how-it-works" },
  { name: "VPC Architecture", href: "#architecture" },
  { name: "Excel Studio", href: "#excel-studio" },
  { name: "AI Copilot", href: "#copilot" },
  { name: "Whitelabel", href: "#whitelabel" },
  { name: "Security", href: "#security" },
  { name: "Pricing", href: "#pricing" },
  { name: "FAQ", href: "#faq" },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-sm shadow-slate-900/5 py-0"
          : "bg-transparent border-b border-transparent py-2"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between gap-6">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-4">
          <Logo size={26} whiteMode={!scrolled} textClassName={`text-base font-semibold tracking-tight ${scrolled ? "text-slate-900" : "text-white"}`} />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                scrolled
                  ? "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
                  : "text-gray-200 hover:text-white hover:bg-white/10"
              }`}
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className={`text-xs font-semibold transition-colors px-3 py-1.5 rounded-lg ${
              scrolled
                ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                : "text-gray-200 hover:text-white hover:bg-white/10"
            }`}
          >
            Tenant Login
          </Link>
          <Button
            asChild
            size="sm"
            className="bg-[#10B981] hover:bg-[#059669] text-white shadow-sm shadow-emerald-500/20 px-4 h-9 text-xs font-semibold rounded-lg transition-transform active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Link href="/login" className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
              <span className="whitespace-nowrap">Request Access</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            </Link>
          </Button>
        </div>

        {/* Mobile Navigation Drawer */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                scrolled ? "text-slate-700 hover:bg-slate-100" : "text-white hover:bg-white/10"
              }`}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-80 p-0 bg-white border-l border-slate-200"
          >
            <SheetHeader className="px-6 py-5 border-b border-slate-100">
              <SheetTitle className="flex items-center gap-2 text-left">
                <Logo size={22} href={null} textClassName="text-slate-900" />
              </SheetTitle>
            </SheetHeader>
            <div className="px-5 py-6 space-y-2">
              {NAV_LINKS.map((link) => (
                <SheetClose asChild key={link.name}>
                  <a
                    href={link.href}
                    className="flex items-center px-3.5 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-colors font-medium"
                  >
                    {link.name}
                  </a>
                </SheetClose>
              ))}
              <Separator className="my-4 bg-slate-200" />
              <div className="space-y-2 pt-2">
                <SheetClose asChild>
                  <Link
                    href="/login"
                    className="w-full flex items-center justify-center py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 hover:bg-slate-50"
                  >
                    Tenant Login
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    href="/login"
                    className={cn(
                      buttonVariants(),
                      "w-full justify-center rounded-lg bg-[#10B981] hover:bg-[#059669] text-white shadow-md shadow-emerald-500/20"
                    )}
                  >
                    Request System Access
                  </Link>
                </SheetClose>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}

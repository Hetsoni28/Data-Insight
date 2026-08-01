"use client"
import React, { useState } from "react"
import { CommandPalette } from "@/components/organisms/CommandPalette"
import { NavbarBreadcrumbs } from "@/components/molecules/NavbarBreadcrumbs"
import { NavbarActions } from "@/components/molecules/NavbarActions"

export default function Navbar({ onUploadClick }: { onUploadClick?: () => void }) {
  const [isCommandOpen, setIsCommandOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-10 bg-white/60 dark:bg-background/80 backdrop-blur-2xl border-b border-slate-200/60 dark:border-white/10 px-8 py-3.5 flex items-center justify-between shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] transition-colors">
        <NavbarBreadcrumbs />
        <NavbarActions 
          onSearchClick={() => setIsCommandOpen(true)} 
          onUploadClick={onUploadClick} 
        />
      </header>
      <CommandPalette isOpen={isCommandOpen} setIsOpen={setIsCommandOpen} />
    </>
  )
}

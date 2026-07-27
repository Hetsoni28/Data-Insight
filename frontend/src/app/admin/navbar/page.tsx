"use client"
import { useRouter } from "next/navigation"
import { Bell, Search } from "lucide-react"

export default function Navbar() {
  const router = useRouter()
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="font-medium text-slate-900">Admin</span>
        <span>/</span>
        <span>Overview</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search tenants or users..." 
            className="h-9 pl-9 pr-4 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-64 transition-all"
          />
        </div>
        <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
        </button>
      </div>
    </header>
  )
}

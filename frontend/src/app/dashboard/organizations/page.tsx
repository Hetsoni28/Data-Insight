"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Building, Plus, Search, MoreVertical, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function OrganizationsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Building className="h-6 w-6 text-amber-600" />
              Organizations
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage all tenant organizations and their administrators.
            </p>
          </div>
          <Button className="bg-[#10B981] hover:bg-[#059669] text-white gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            Create Organization
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-6xl mx-auto w-full">
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search organizations..."
              className="pl-9 h-10 bg-white border-slate-200"
            />
          </div>
        </div>

        {/* Empty State / List */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
            <Shield className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No Organizations Yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md">
            As the Platform Owner, you can provision new tenant organizations and invite their initial administrators here.
          </p>
          <Button className="mt-6 bg-[#10B981] hover:bg-[#059669] text-white gap-2">
            <Plus className="h-4 w-4" /> Create First Organization
          </Button>
        </div>
      </main>
    </div>
  )
}

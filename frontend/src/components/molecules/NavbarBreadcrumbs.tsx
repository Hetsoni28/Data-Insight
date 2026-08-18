import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { useWorkspaceStore } from "@/store/workspaceStore"

export function NavbarBreadcrumbs() {
  const pathname = usePathname()
  const { activeWs } = useWorkspaceStore()

  const paths = pathname.split("/").filter(Boolean)
  const roleMatch = pathname?.match(/^\/(owner|organization-admin|manager|analyst|viewer)/)
  const basePath = roleMatch ? roleMatch[0] : '/analyst'
  const isOwner = pathname.startsWith("/owner")
  
  const breadcrumbs = [
    { label: isOwner ? "Platform Administration" : (activeWs?.name || "Workspace"), isLast: paths.length <= 1 }
  ]
  
  if (paths.length > 1) {
    const segment = paths[paths.length - 1]
    let label = segment.charAt(0).toUpperCase() + segment.slice(1)
    if (label.length === 36 && label.split('-').length === 5) {
      label = "Builder"
    }
    
    breadcrumbs.push({
      label,
      isLast: true
    })
    breadcrumbs[0].isLast = false
  }

  return (
    <div className="flex items-center gap-2 text-sm font-medium">
      {breadcrumbs.map((crumb, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 dark:text-slate-400" />}
          {crumb.isLast ? (
            <span className="text-slate-900 dark:text-white font-semibold">{crumb.label}</span>
          ) : (
            <Link href={`${basePath}/dashboard`} className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

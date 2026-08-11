import { EyeOff } from "lucide-react"

export function ManagerDatasetPreview({ 
  preview,
  loading 
}: { 
  preview: any,
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
        <div className="h-8 w-1/4 bg-slate-100 dark:bg-white/5 rounded-lg animate-pulse mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 w-full bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!preview || !preview.columns || preview.columns.length === 0) {
    return (
      <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/5 rounded-2xl p-12 text-center shadow-sm">
        <EyeOff className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">Preview Unavailable</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2">The dataset preview cannot be loaded or is empty.</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
        <h3 className="font-semibold text-slate-900 dark:text-white">Data Preview</h3>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-white/10 px-2 py-1 rounded-md">
          Showing {preview.rows?.length || 0} rows
        </span>
      </div>
      
      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-[#1a1a1c] sticky top-0 z-10 shadow-sm">
            <tr>
              {preview.columns.map((col: any) => (
                <th key={col.name} className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">
                  <div className="flex flex-col">
                    <span>{col.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider mt-0.5">{col.type}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {preview.rows?.map((row: any, i: number) => (
              <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                {preview.columns.map((col: any) => (
                  <td key={col.name} className="px-4 py-2.5 text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                    {row[col.name] !== null && row[col.name] !== undefined ? String(row[col.name]) : (
                      <span className="text-slate-300 dark:text-slate-600 italic">null</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

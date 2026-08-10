export function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-white/10 rounded-xl p-3 shadow-xl text-xs">
      <p className="text-slate-500 dark:text-slate-400 mb-2 font-medium">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-600 dark:text-slate-300">{p.name}:</span>
          <span className="text-slate-900 dark:text-white font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

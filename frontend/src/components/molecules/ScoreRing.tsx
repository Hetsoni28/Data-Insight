export function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const radius = 30
  const circ = 2 * Math.PI * radius
  const offset = circ - (score / 100) * circ
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={radius} strokeWidth="6" className="stroke-slate-200 dark:stroke-white/10" fill="none" />
          <circle cx="40" cy="40" r={radius} strokeWidth="6" fill="none"
            stroke={color} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-slate-900 dark:text-white">{score}</span>
        </div>
      </div>
      <span className="text-xs text-slate-500 dark:text-slate-400 text-center leading-tight font-medium">{label}</span>
    </div>
  )
}

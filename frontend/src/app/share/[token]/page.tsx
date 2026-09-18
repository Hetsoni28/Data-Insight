"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ShieldCheck, Download, BarChart3, AlertTriangle, Eye } from "lucide-react"

interface ShareData {
  dataset_name: string
  row_count: number
  column_count: number
  quality_score: number
  quality_grade: string
  duplicate_rows: number
  sparsity_pct: number
  file_size_bytes: number
  has_excel: boolean
  has_clean_export: boolean
  allow_excel_download: boolean
  allow_clean_download: boolean
  label: string | null
  expires_at: string | null
  view_count: number
  created_at: string
}

function fmt(n: number) { return n?.toLocaleString() ?? "—" }
function fmtBytes(b: number) {
  if (!b) return "—"
  if (b >= 1e9) return (b / 1e9).toFixed(1) + " GB"
  if (b >= 1e6) return (b / 1e6).toFixed(1) + " MB"
  return (b / 1e3).toFixed(1) + " KB"
}
const GRADES: Record<string, string> = {
  A: "text-emerald-600 bg-emerald-50 border-emerald-200",
  B: "text-blue-600 bg-blue-50 border-blue-200",
  C: "text-amber-600 bg-amber-50 border-amber-200",
  D: "text-orange-600 bg-orange-50 border-orange-200",
  F: "text-red-600 bg-red-50 border-red-200",
}

export default function SharePage() {
  const params = useParams()
  const token = params?.token as string
  const [data, setData] = useState<ShareData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [dl, setDl] = useState<"excel" | "clean" | null>(null)

  useEffect(() => {
    if (!token) return
    fetch(`/api/v1/share-links/${token}`)
      .then(r => r.json())
      .then(res => {
        if (res.status === "success") setData(res.data)
        else setError(res.detail || "Invalid or expired link")
      })
      .catch(() => setError("Failed to load report"))
      .finally(() => setLoading(false))
  }, [token])

  const download = async (type: "excel" | "clean") => {
    setDl(type)
    try {
      const ep = type === "excel" ? "excel-download" : "clean-download"
      const res = await fetch(`/api/v1/share-links/${token}/${ep}`)
      if (!res.ok) {
        setError("Download failed. The file may no longer be available.")
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = type === "excel" ? "AI_Report.xlsx" : "Clean_Data.zip"
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setError("Download failed. Please check your connection and try again.")
    } finally { setDl(null) }
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex items-center justify-center">
      <div className="flex items-center gap-3 text-slate-500">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-lg font-medium">Loading report...</span>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center p-6">
      <div className="bg-white border border-red-200 rounded-2xl p-10 max-w-md text-center shadow-xl">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-slate-800 mb-2">Link Not Available</h1>
        <p className="text-slate-500 text-sm">{error}</p>
      </div>
    </div>
  )

  if (!data) return null

  const grade = data.quality_grade || "B"
  const gradeColor = GRADES[grade] || GRADES["B"]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            <span className="font-bold text-slate-800 text-lg">Data Insight</span>
            <span className="text-slate-300 mx-2">|</span>
            <span className="text-slate-500 text-sm">Secure Data Quality Report</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Eye className="w-3.5 h-3.5" />
            <span>{fmt(data.view_count)} views</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Title */}
        <div>
          {data.label && <p className="text-emerald-600 text-sm font-semibold mb-1">{data.label}</p>}
          <h1 className="text-3xl font-extrabold text-slate-900">{data.dataset_name}</h1>
          <p className="text-slate-500 text-sm mt-1">
            Shared {new Date(data.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            {data.expires_at && ` · Expires ${new Date(data.expires_at).toLocaleDateString()}`}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Rows", value: fmt(data.row_count), color: "text-blue-600 bg-blue-50" },
            { label: "Columns", value: fmt(data.column_count), color: "text-purple-600 bg-purple-50" },
            { label: "File Size", value: fmtBytes(data.file_size_bytes), color: "text-slate-600 bg-slate-50" },
            { label: "Quality Score", value: `${data.quality_score ?? "—"}/100`, color: "text-emerald-600 bg-emerald-50" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
                <BarChart3 className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Quality cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col items-center justify-center">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-2">Quality Grade</p>
            <div className={`text-6xl font-black border-2 rounded-2xl w-24 h-24 flex items-center justify-center ${gradeColor}`}>{grade}</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-3">Duplicate Rows</p>
            <p className={`text-3xl font-bold ${data.duplicate_rows > 0 ? "text-amber-600" : "text-emerald-600"}`}>{fmt(data.duplicate_rows)}</p>
            <p className="text-sm text-slate-500 mt-1">{data.duplicate_rows > 0 ? "Duplicates found" : "✅ No duplicates"}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-3">Missing Data</p>
            <p className={`text-3xl font-bold ${(data.sparsity_pct || 0) > 5 ? "text-amber-600" : "text-emerald-600"}`}>{(data.sparsity_pct || 0).toFixed(1)}%</p>
            <p className="text-sm text-slate-500 mt-1">{(data.sparsity_pct || 0) > 0 ? "Missing values present" : "✅ No missing values"}</p>
          </div>
        </div>

        {/* Downloads */}
        {(data.allow_excel_download || data.allow_clean_download) && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-4">Download Reports</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              {data.allow_excel_download && data.has_excel && (
                <button onClick={() => download("excel")} disabled={dl === "excel"}
                  className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold shadow-lg transition-all disabled:opacity-60">
                  {dl === "excel" ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Downloading...</> : <><Download className="w-4 h-4" />Download AI Excel</>}
                </button>
              )}
              {data.allow_clean_download && data.has_clean_export && (
                <button onClick={() => download("clean")} disabled={dl === "clean"}
                  className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-bold transition-all disabled:opacity-60">
                  {dl === "clean" ? <><div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />Downloading...</> : <><Download className="w-4 h-4" />Download Clean Data</>}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-4 pb-8 text-xs text-slate-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Powered by <strong className="text-emerald-500 ml-1">Data Insight AI</strong>
        </div>
      </div>
    </div>
  )
}

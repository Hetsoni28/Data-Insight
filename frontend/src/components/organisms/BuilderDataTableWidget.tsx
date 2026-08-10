"use client"

import React from "react"

interface BuilderDataTableWidgetProps {
  widget: any
  data: any
}

export function BuilderDataTableWidget({ widget, data }: BuilderDataTableWidgetProps) {
  return (
    <div className="w-full h-full overflow-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-white/5">
          <tr>
            <th className="px-4 py-3">{widget.config?.xAxis || 'ID'}</th>
            <th className="px-4 py-3">{widget.config?.yAxis || 'Value'}</th>
          </tr>
        </thead>
        <tbody>
          {(data || []).map((row: any, i: number) => (
            <tr key={i} className="border-b border-slate-100 dark:border-white/5">
              <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{row.x_val}</td>
              <td className="px-4 py-3">{row.y_val}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

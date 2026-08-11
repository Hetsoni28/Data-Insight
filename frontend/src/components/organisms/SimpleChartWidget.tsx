"use client";

import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { DashboardChartWidget } from "@/lib/viewer.service";

interface SimpleChartWidgetProps {
  widget: DashboardChartWidget;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];

export function SimpleChartWidget({ widget }: SimpleChartWidgetProps) {
  if (widget.type === "kpi") {
    return (
      <div className="flex flex-col h-full justify-center text-center p-4">
        <h4 className="text-sm font-semibold text-slate-500 mb-2">{widget.title}</h4>
        <div className="text-3xl font-bold text-slate-900 dark:text-white">
          {widget.metrics?.value ?? 0}
        </div>
      </div>
    );
  }

  const xAxisKey = widget.x_axis_key || Object.keys(widget.data[0] || {})[0];
  const yAxisKey = widget.y_axis_key || Object.keys(widget.data[0] || {})[1];

  if (!xAxisKey || !yAxisKey || !widget.data.length) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm p-4 text-center">
        No data available for {widget.title}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">{widget.title}</h4>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          {widget.type === "bar" ? (
            <BarChart data={widget.data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey={xAxisKey} tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "#f1f5f9" }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey={yAxisKey} fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : widget.type === "line" ? (
            <LineChart data={widget.data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey={xAxisKey} tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Line type="monotone" dataKey={yAxisKey} stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }} />
            </LineChart>
          ) : widget.type === "pie" ? (
            <PieChart>
              <Pie
                data={widget.data}
                dataKey={yAxisKey}
                nameKey={xAxisKey}
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={60}
                stroke="none"
              >
                {widget.data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            </PieChart>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">Unsupported chart type</div>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

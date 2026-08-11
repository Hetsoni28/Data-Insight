"use client";

import React, { useMemo } from "react";
import { EChartsWrapper } from "@/components/ui/echarts-wrapper";

interface DistributionChartProps {
  title?: string;
  labels: string[];
  values: number[];
  color?: string;
  height?: number;
}

export function DistributionChart({
  title,
  labels,
  values,
  color = "#10b981", // default emerald
  height = 300,
}: DistributionChartProps) {
  const option = useMemo(() => {
    return {
      title: title ? {
        text: title,
        left: "center",
        textStyle: {
          fontSize: 14,
          fontWeight: "600",
          color: "#64748b" // slate-500
        }
      } : undefined,
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
      },
      grid: {
        top: title ? '15%' : '5%',
        bottom: '10%',
        left: '5%',
        right: '5%',
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: labels,
        axisLabel: {
          hideOverlap: true,
          color: "#94a3b8", // slate-400
        },
        axisLine: {
          lineStyle: {
            color: "#cbd5e1" // slate-300
          }
        }
      },
      yAxis: {
        type: "value",
        splitLine: {
          lineStyle: {
            type: "dashed",
            color: "#e2e8f0" // slate-200
          }
        },
        axisLabel: {
          color: "#94a3b8"
        }
      },
      series: [
        {
          data: values,
          type: "bar",
          barMaxWidth: 40,
          itemStyle: {
            color: color,
            borderRadius: [4, 4, 0, 0]
          },
          emphasis: {
            itemStyle: {
              color: "#059669" // emerald-600
            }
          }
        },
      ],
    };
  }, [labels, values, title, color]);

  if (!labels.length || !values.length) {
    return (
      <div 
        className="w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-slate-800"
        style={{ height }}
      >
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-xs text-slate-400 mt-1">No data available</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-transparent rounded-xl">
      <EChartsWrapper option={option} height={height} />
    </div>
  );
}

"use client";

import React, { useMemo } from "react";
import { EChartsWrapper } from "@/components/ui/echarts-wrapper";

interface CorrelationHeatmapProps {
  data: Record<string, Record<string, number>> | null;
  height?: number;
}

export function CorrelationHeatmap({ data, height = 400 }: CorrelationHeatmapProps) {
  const option = useMemo(() => {
    if (!data) return {};

    const variables = Object.keys(data);
    const heatmapData: [number, number, number][] = [];

    variables.forEach((yVar, yIdx) => {
      variables.forEach((xVar, xIdx) => {
        const val = data[yVar]?.[xVar];
        if (typeof val === "number" && !isNaN(val)) {
          // ECharts heatmap format: [xIndex, yIndex, value]
          heatmapData.push([xIdx, yIdx, Number(val.toFixed(2))]);
        }
      });
    });

    return {
      tooltip: {
        position: "top",
        formatter: (params: any) => {
          const x = variables[params.data[0]];
          const y = variables[params.data[1]];
          const val = params.data[2];
          return `<div style="font-weight:bold;">Correlation</div>
                  ${x} & ${y}: <span style="color:#10b981;font-weight:bold">${val}</span>`;
        },
      },
      grid: {
        top: '10%',
        bottom: '15%',
        left: '15%',
        right: '10%',
      },
      xAxis: {
        type: "category",
        data: variables,
        splitArea: {
          show: true,
        },
        axisLabel: {
          rotate: 45,
          interval: 0,
          hideOverlap: true,
        },
      },
      yAxis: {
        type: "category",
        data: variables,
        splitArea: {
          show: true,
        },
      },
      visualMap: {
        min: -1,
        max: 1,
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: "0%",
        inRange: {
          // From highly negative (red) to neutral (white/gray) to highly positive (green)
          color: ["#ef4444", "#f1f5f9", "#10b981"],
        },
      },
      series: [
        {
          name: "Correlation",
          type: "heatmap",
          data: heatmapData,
          label: {
            show: true,
            formatter: (p: any) => p.data[2],
            color: "#334155",
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    };
  }, [data]);

  if (!data || Object.keys(data).length === 0) {
    return (
      <div 
        className="w-full flex items-center justify-center bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-slate-800"
        style={{ height }}
      >
        <p className="text-sm text-slate-500">Not enough numerical data for correlation matrix.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white dark:bg-transparent rounded-xl">
      <EChartsWrapper option={option} height={height} />
    </div>
  );
}

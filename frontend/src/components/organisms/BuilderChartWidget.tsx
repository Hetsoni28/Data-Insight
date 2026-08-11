"use client"

import React from "react"
import ReactECharts from "echarts-for-react"

interface BuilderChartWidgetProps {
  widget: any
  data: any
}

export function BuilderChartWidget({ widget, data }: BuilderChartWidgetProps) {
  if (!data) return null

  const xData = data.map((d: any) => d.x_val)
  const yData = data.map((d: any) => d.y_val)

  const xName = widget.config?.xAxis || 'Category';
  const yName = widget.config?.yAxis || 'Value';

  let option: any = {
    tooltip: { trigger: 'axis', confine: true },
    grid: { top: 30, right: 20, bottom: 30, left: 10, containLabel: true },
    xAxis: { type: 'category', data: xData, axisLine: { lineStyle: { color: '#94a3b8' } } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } }, axisLine: { lineStyle: { color: '#94a3b8' } }, name: yName, nameTextStyle: { color: '#94a3b8', padding: [0, 0, 0, 20] } },
    series: []
  }

  if (widget.type === 'chart_bar') {
    option.series = [{ name: yName, type: 'bar', data: yData, itemStyle: { color: '#10B981', borderRadius: [4, 4, 0, 0] } }]
  } else if (widget.type === 'chart_line') {
    option.series = [{ name: yName, type: 'line', data: yData, smooth: true, areaStyle: { color: '#10B981', opacity: 0.1 }, lineStyle: { color: '#10B981', width: 3 }, symbolSize: 8, itemStyle: { color: '#10B981' } }]
  } else if (widget.type === 'chart_pie') {
    option.xAxis = { show: false }
    option.yAxis = { show: false }
    option.tooltip = { trigger: 'item', confine: true, formatter: '{b}: {c} ({d}%)' }
    option.series = [{
      name: yName,
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      data: data.map((d: any) => ({ name: d.x_val, value: d.y_val }))
    }]
  } else if (widget.type === 'chart_scatter') {
    option.xAxis = { type: 'value', axisLine: { lineStyle: { color: '#94a3b8' } }, scale: true, name: xName, nameLocation: 'middle', nameGap: 25, nameTextStyle: { color: '#94a3b8' } }
    option.yAxis.scale = true;
    option.yAxis.nameLocation = 'end';
    
    const maxDensity = Math.max(...data.map((d: any) => d.density || 1), 1)
    
    option.tooltip = {
      trigger: 'item',
      confine: true,
      formatter: function (params: any) {
        return `<div style="font-weight:600;margin-bottom:4px;">${xName} vs ${yName}</div>
                ${xName}: ${params.value[0]}<br/>
                ${yName}: ${params.value[1]}<br/>
                <span style="color:#10B981">Density (Count): ${params.value[2]}</span>`;
      }
    }
    
    option.series = [{ 
      type: 'scatter', 
      data: data.map((d: any) => [d.x_val, d.y_val, d.density || 1]), 
      symbolSize: function (val: any) {
        return 5 + (val[2] / maxDensity) * 25;
      },
      itemStyle: { 
        color: '#10B981',
        opacity: 0.6
      } 
    }]
  }

  return (
    <div className="w-full h-full p-2">
      <ReactECharts 
        option={option} 
        style={{ height: '100%', width: '100%' }} 
        opts={{ renderer: 'svg' }}
      />
    </div>
  )
}

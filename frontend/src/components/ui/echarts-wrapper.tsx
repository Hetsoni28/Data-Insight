"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import type { EChartsReactProps } from "echarts-for-react";

// Disable SSR for ECharts as it relies on window/document
const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

import { useTheme } from "next-themes";
import * as echarts from "echarts";

// Optional: Register a custom theme for ECharts if needed
// echarts.registerTheme('myTheme', { ... })

interface EChartsWrapperProps extends Omit<EChartsReactProps, "theme"> {
  height?: string | number;
  width?: string | number;
  className?: string;
}

export function EChartsWrapper({
  option,
  height = "100%",
  width = "100%",
  className,
  style,
  ...props
}: EChartsWrapperProps) {
  const { theme, systemTheme } = useTheme();

  // Determine actual theme (resolve 'system')
  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  // Merge the base option with dark/light mode specific styling globally if desired, 
  // though typically it's best to let ECharts handle its built-in 'dark' theme.
  
  return (
    <div className={className} style={{ height, width, ...style }}>
      <ReactECharts
        option={option}
        theme={isDark ? "dark" : undefined}
        style={{ height: "100%", width: "100%" }}
        opts={{ renderer: "canvas" }}
        notMerge={true}
        lazyUpdate={true}
        {...props}
      />
    </div>
  );
}

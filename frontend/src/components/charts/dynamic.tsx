"use client"
/**
 * components/charts/dynamic.tsx
 *
 * Central registry of next/dynamic lazy-loaded wrappers for all chart-heavy
 * organism components. Importing from here instead of directly from the organism
 * defers the recharts/echarts bundle until the component is actually rendered
 * on screen — cutting initial page load JS significantly.
 *
 * Usage:
 *   import { DynamicRevenueTrendChart } from "@/components/charts/dynamic"
 */
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

const ChartSkeleton = () => (
  <div className="w-full h-64 rounded-xl border border-slate-200/60 dark:border-white/10 overflow-hidden">
    <Skeleton className="w-full h-full" />
  </div>
)

const SmallChartSkeleton = () => (
  <div className="w-full h-40 rounded-xl border border-slate-200/60 dark:border-white/10 overflow-hidden">
    <Skeleton className="w-full h-full" />
  </div>
)

// --- Owner Dashboard ----------------------------------------------------------

export const DynamicDashboardUsageChart = dynamic(
  () => import("@/components/organisms/DashboardUsageChart").then((m) => m.DashboardUsageChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

export const DynamicPlatformHealthOverview = dynamic(
  () => import("@/components/organisms/PlatformHealthOverview").then((m) => m.PlatformHealthOverview),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

// --- Owner Analytics Page -----------------------------------------------------

export const DynamicRevenueTrendChart = dynamic(
  () => import("@/components/organisms/RevenueTrendChart").then((m) => m.RevenueTrendChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

export const DynamicPlatformGrowthChart = dynamic(
  () => import("@/components/organisms/PlatformGrowthChart").then((m) => m.PlatformGrowthChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

export const DynamicForecastingChart = dynamic(
  () => import("@/components/organisms/ForecastingChart").then((m) => m.ForecastingChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

export const DynamicRevenueAnalyticsCharts = dynamic(
  () => import("@/components/organisms/RevenueAnalyticsCharts").then((m) => m.RevenueAnalyticsCharts),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

// --- Organization Admin Dashboard ---------------------------------------------

export const DynamicOrganizationAnalytics = dynamic(
  () => import("@/components/organisms/OrganizationAnalytics").then((m) => m.OrganizationAnalytics),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

// --- Analytics Center Pages (all roles) ---------------------------------------

export const DynamicViewerAnalyticsCenter = dynamic(
  () => import("@/components/organisms/analytics/ViewerAnalyticsCenter").then((m) => m.ViewerAnalyticsCenter),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

export const DynamicManagerAnalyticsCenter = dynamic(
  () => import("@/components/organisms/analytics/ManagerAnalyticsCenter").then((m) => m.ManagerAnalyticsCenter),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

// --- AI & Shared Charts -------------------------------------------------------

export const DynamicAiAnalyticsCharts = dynamic(
  () => import("@/components/organisms/AiAnalyticsCharts").then((m) => m.AiAnalyticsCharts),
  { ssr: false, loading: () => <SmallChartSkeleton /> }
)

export const DynamicAiProviderAnalytics = dynamic(
  () => import("@/components/organisms/AiProviderAnalytics").then((m) => m.AiProviderAnalytics),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

export const DynamicSystemMonitoring = dynamic(
  () => import("@/components/organisms/SystemMonitoring").then((m) => m.SystemMonitoring),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

export const DynamicBIDashboardViewer = dynamic(
  () => import("@/components/organisms/BIDashboardViewer").then((m) => m.BIDashboardViewer),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

export const DynamicCopilotChat = dynamic(
  () => import("@/components/organisms/CopilotChat").then((m) => m.CopilotChat),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Download, RefreshCw, LayoutDashboard, Calendar, Building2, ChevronDown,
  Check, FileText, FileSpreadsheet, Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const DATE_OPTIONS = [
  { label: "Last 7 Days",     value: "7d" },
  { label: "Last 30 Days",    value: "30d" },
  { label: "Last 90 Days",    value: "90d" },
  { label: "Last 12 Months",  value: "12m" },
  { label: "All Time",        value: "all" },
];

const ORG_OPTIONS = [
  { label: "All Orgs",        value: "all" },
  { label: "Enterprise Only", value: "enterprise" },
  { label: "Professional",    value: "professional" },
  { label: "Starter",         value: "starter" },
];

interface AnalyticsHeroBannerProps {
  onRefresh?: () => void;
  onFilterChange?: (filters: { dateRange: string; orgFilter: string }) => void;
}

export function AnalyticsHeroBanner({ onRefresh, onFilterChange }: AnalyticsHeroBannerProps) {
  const [dateRange, setDateRange] = useState("30d");
  const [orgFilter, setOrgFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleDateChange = (v: string) => {
    setDateRange(v);
    onFilterChange?.({ dateRange: v, orgFilter });
    toast.info(`Filter: ${DATE_OPTIONS.find((o) => o.value === v)?.label}`);
  };

  const handleOrgChange = (v: string) => {
    setOrgFilter(v);
    onFilterChange?.({ dateRange, orgFilter: v });
    toast.info(`Filter: ${ORG_OPTIONS.find((o) => o.value === v)?.label}`);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    onRefresh?.();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Dashboard refreshed!");
    }, 900);
  };

  const handleExport = (format: string) => {
    toast.success(`Exporting as ${format}`, { description: "Your file will be ready shortly." });
  };

  const dateLabel = DATE_OPTIONS.find((o) => o.value === dateRange)?.label ?? "Last 30 Days";
  const orgLabel  = ORG_OPTIONS.find((o) => o.value === orgFilter)?.label  ?? "All Orgs";

  return (
    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-8 border-b border-slate-200 dark:border-white/10 mb-8">
      {/* Title */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-md">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Executive Intelligence
          </h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-[15px]">
          Monitor global platform metrics, forecast revenue, and generate AI-powered insights across all organizations.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">

        {/* Date Range Picker */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
              <Calendar className="h-4 w-4 text-slate-400" />
              {dateLabel}
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-1" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel>Date Range</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {DATE_OPTIONS.map((opt) => (
              <DropdownMenuItem key={opt.value} onClick={() => handleDateChange(opt.value)}>
                <span className="flex-1">{opt.label}</span>
                {opt.value === dateRange && <Check className="h-4 w-4 text-emerald-500" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Org Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
              <Building2 className="h-4 w-4 text-slate-400" />
              {orgLabel}
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-1" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel>Organization Filter</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ORG_OPTIONS.map((opt) => (
              <DropdownMenuItem key={opt.value} onClick={() => handleOrgChange(opt.value)}>
                <span className="flex-1">{opt.label}</span>
                {opt.value === orgFilter && <Check className="h-4 w-4 text-emerald-500" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-[42px] bg-white dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl px-4">
              <Download className="h-4 w-4 mr-2" />
              Export
              <ChevronDown className="h-3.5 w-3.5 ml-2 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Export As</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleExport("PDF")}>
              <FileText className="h-4 w-4 mr-2 text-rose-400" /> Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("CSV")}>
              <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-400" /> Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("Shareable Link")}>
              <Share2 className="h-4 w-4 mr-2 text-emerald-400" /> Copy Shareable Link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Refresh */}
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-[42px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all rounded-xl px-4"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
    </div>
  );
}

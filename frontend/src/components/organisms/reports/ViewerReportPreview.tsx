"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Download, Loader2, Sparkles, AlertCircle, FileText, LayoutDashboard, Database, TrendingUp, Presentation, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TenantDashboardService } from "@/lib/tenant-dashboard.service";
import type { ViewerReport, ViewerReportPreviewResponse, ViewerReportInsights, ViewerReportRelatedAsset } from "@/lib/tenant-dashboard.service";
import { SimpleChartWidget } from "@/components/organisms/SimpleChartWidget"; // Reusable chart widget from existing system

interface ViewerReportPreviewProps {
  report: ViewerReport | null;
  onClose: () => void;
}

export function ViewerReportPreview({ report, onClose }: ViewerReportPreviewProps) {
  const [details, setDetails] = useState<ViewerReportPreviewResponse | null>(null);
  const [insights, setInsights] = useState<ViewerReportInsights | null>(null);
  const [related, setRelated] = useState<ViewerReportRelatedAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "insights" | "related">("overview");

  useEffect(() => {
    if (!report) return;
    const fetchPreviewData = async () => {
      setLoading(true);
      try {
        const [pData, iData, rData] = await Promise.all([
          TenantDashboardService.getReportPreview(report.id),
          TenantDashboardService.getReportInsights(report.id),
          TenantDashboardService.getReportRelated(report.id),
        ]);
        setDetails(pData);
        setInsights(iData);
        setRelated(rData);
      } catch (err) {
        toast.error("Failed to load report details.");
      } finally {
        setLoading(false);
      }
    };
    fetchPreviewData();
  }, [report]);

  if (!report) return null;

  const handleDownload = async () => {
    if (!details || (details.status !== "ready" && details.status !== "approved")) {
      toast.error("This report is not ready for download.");
      return;
    }
    setDownloading(true);
    try {
      const res = await TenantDashboardService.downloadReport(report.id);
      if (res.download_url) {
        // Convert relative /api/v1/storage/... paths to absolute backend URLs.
        // Next.js rewrites don't support binary file streaming so we must
        // point the browser directly at the backend (port 8000).
        let url = res.download_url;
        if (url.startsWith("/api/v1/")) {
          const backendBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ?? "http://localhost:8000";
          url = `${backendBase}${url}`;
        }
        // Use an anchor tag to trigger a true browser download
        const a = document.createElement("a");
        a.href = url;
        a.download = report.title || "report";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("Download started.");
      } else {
        toast.error("Download URL not available.");
      }
    } catch {
      toast.error("Could not generate download link.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex justify-end bg-slate-900/20 dark:bg-slate-900/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 250, mass: 0.8 }}
          className="w-full max-w-4xl bg-slate-50 dark:bg-slate-950 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-white/10 overflow-hidden relative"
        >
          {/* Header */}
          <div className="relative overflow-hidden p-8 pt-24 bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-900 border-b border-white/10 shadow-lg">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 text-white/5 blur-sm pointer-events-none">
              <FileText className="w-64 h-64 transform rotate-12" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="bg-white/10 border-white/20 text-emerald-50 backdrop-blur-md shadow-sm font-semibold tracking-wide">
                    {details?.category || report.category}
                  </Badge>
                  {details?.ai_generated && (
                    <Badge className="bg-purple-500/20 text-purple-200 border border-purple-500/30 backdrop-blur-md shadow-sm font-semibold tracking-wide hover:bg-purple-500/30">
                      <Sparkles className="w-3 h-3 mr-1.5 text-purple-300" /> AI Generated
                    </Badge>
                  )}
                </div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md pr-4">
                  {details?.title || report.title}
                </h2>
                <p className="text-sm font-medium text-emerald-100/80 mt-2 max-w-xl">
                  {details?.description || "Loading description..."}
                </p>
              </div>
              <div className="flex flex-row md:flex-col items-end gap-3 flex-shrink-0">
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-black/20 hover:bg-black/40 border border-white/10 text-white shadow-sm transition-all md:absolute md:top-6 md:right-6">
                  <X className="w-5 h-5" />
                </Button>
                {details?.output_url ? (
                  <Button onClick={handleDownload} disabled={downloading || loading} size="sm" className="bg-emerald-500 text-white hover:bg-emerald-400 shadow-md font-bold mt-auto h-10 px-4 rounded-xl">
                    {downloading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                    Download PDF
                  </Button>
                ) : (
                  <Button disabled size="sm" variant="outline" className="bg-black/20 border-white/10 text-white/50 cursor-not-allowed mt-auto h-10 px-4 rounded-xl">
                    <FileText className="w-4 h-4 mr-2" />
                    Interactive Only
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 shadow-sm z-10">
            {[
              { id: "overview", label: "Executive Overview", icon: <Presentation className="w-4 h-4" /> },
              { id: "insights", label: "AI Insights", icon: <Sparkles className="w-4 h-4" /> },
              { id: "related", label: "Source Assets", icon: <Database className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 py-4 px-5 text-sm font-bold border-b-2 transition-all relative ${
                  activeTab === tab.id
                    ? "border-emerald-600 text-emerald-700 dark:border-emerald-500 dark:text-emerald-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-500" />
                )}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50 dark:bg-slate-950">
            {loading ? (
              <div className="space-y-6">
                <Skeleton className="w-3/4 h-8" />
                <Skeleton className="w-full h-32" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-40" />
                  <Skeleton className="h-40" />
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* OVERVIEW TAB */}
                {activeTab === "overview" && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm">
                      <div className="bg-slate-50/50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</p>
                        <p className="font-bold text-slate-900 dark:text-white capitalize">{details?.status}</p>
                      </div>
                      <div className="bg-slate-50/50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Department</p>
                        <p className="font-bold text-slate-900 dark:text-white">{details?.department}</p>
                      </div>
                      <div className="bg-slate-50/50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Freshness</p>
                        <p className="font-bold text-slate-900 dark:text-white">{details?.data_freshness}</p>
                      </div>
                      <div className="bg-slate-50/50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Owner</p>
                        <p className="font-bold text-slate-900 dark:text-white truncate">{details?.owner}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                        <TrendingUp className="w-5 h-5 text-emerald-500" /> Executive Highlights
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {details?.widgets?.slice(0,4).map(widget => (
                          <div key={widget.id} className="border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 bg-white/70 dark:bg-slate-900/40 backdrop-blur-md shadow-sm hover:shadow-md transition-shadow">
                            <SimpleChartWidget widget={widget} />
                          </div>
                        ))}
                        {(!details?.widgets || details.widgets.length === 0) && (
                          <div className="col-span-2 text-center py-12 bg-white/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-300 dark:border-white/20">
                            <Presentation className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-500 dark:text-slate-400 font-medium">Visualizations are being generated or not available.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* INSIGHTS TAB */}
                {activeTab === "insights" && (
                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-500/20 relative overflow-hidden backdrop-blur-md">
                      <div className="absolute -top-10 -right-10 text-purple-500/10 pointer-events-none">
                        <Sparkles className="w-40 h-40" />
                      </div>
                      <h3 className="text-lg font-bold text-purple-900 dark:text-purple-300 mb-3 flex items-center gap-2 relative z-10">
                        <Sparkles className="w-6 h-6 text-purple-500" /> Executive Summary
                      </h3>
                      <p className="text-purple-900/80 dark:text-purple-200/80 leading-relaxed text-[15px] relative z-10 font-medium">
                        {insights?.executive_summary || "No insights generated yet."}
                      </p>
                    </div>

                    {insights && insights.key_findings.length > 0 && (
                      <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Key Findings</h4>
                        <ul className="space-y-3">
                          {insights.key_findings.map((f, i) => (
                            <li key={i} className="flex items-start gap-3 text-[15px] text-slate-700 dark:text-slate-300">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                              <span className="leading-relaxed">{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {insights && insights.recommendations.length > 0 && (
                      <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Strategic Recommendations</h4>
                        <div className="grid gap-3">
                          {insights.recommendations.map((r, i) => (
                            <div key={i} className="flex gap-4 p-4 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-[15px] text-slate-700 dark:text-slate-300 shadow-sm hover:shadow-md transition-shadow hover:border-emerald-500/30 group">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-500/40 transition-colors">
                                <ArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <p className="mt-1 leading-relaxed font-medium">{r}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* RELATED ASSETS TAB */}
                {activeTab === "related" && (
                  <div className="space-y-4">
                    <div className="bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 rounded-xl p-4 mb-6">
                      <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                        Explore the original datasets and dashboards that power this report.
                      </p>
                    </div>
                    
                    {related.length === 0 ? (
                      <div className="text-center py-12 bg-white/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-300 dark:border-white/20">
                        <Database className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-500 dark:text-slate-400 font-medium">No related assets found.</p>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {related.map(asset => (
                          <div key={asset.id} className="flex items-center justify-between p-5 rounded-2xl bg-white/70 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/50 hover:shadow-lg transition-all group cursor-pointer hover:-translate-y-0.5">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-white/5 dark:to-white/10 flex items-center justify-center group-hover:from-emerald-50 group-hover:to-emerald-100 dark:group-hover:from-emerald-500/10 dark:group-hover:to-emerald-500/20 shadow-inner group-hover:shadow-md transition-all">
                                {asset.type === 'dataset' ? <Database className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" /> : <LayoutDashboard className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors text-[16px]">{asset.name}</h4>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">{asset.type}</p>
                              </div>
                            </div>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10 transition-colors">
                              <ExternalLink className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

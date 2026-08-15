"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Download, Loader2, Sparkles, AlertCircle, FileText, LayoutDashboard, Database, TrendingUp, Presentation, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ViewerService } from "@/lib/viewer.service";
import type { ViewerReport, ViewerReportPreviewResponse, ViewerReportInsights, ViewerReportRelatedAsset } from "@/lib/viewer.service";
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
          ViewerService.getReportPreview(report.id),
          ViewerService.getReportInsights(report.id),
          ViewerService.getReportRelated(report.id),
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
      const res = await ViewerService.downloadReport(report.id);
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
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-full max-w-3xl bg-white dark:bg-slate-950 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-white/10 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 pt-24 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-white dark:bg-slate-900 text-slate-500">{details?.category || report.category}</Badge>
                {details?.ai_generated && (
                  <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border-none hover:bg-purple-200">
                    <Sparkles className="w-3 h-3 mr-1" /> AI Generated
                  </Badge>
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white pr-4">
                {details?.title || report.title}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {details?.description || "Loading description..."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {details?.output_url ? (
                <Button onClick={handleDownload} disabled={downloading || loading} size="sm" className="bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm">
                  {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Download PDF
                </Button>
              ) : (
                <Button disabled size="sm" variant="outline" className="bg-slate-50 text-slate-400 border-slate-200 dark:bg-white/5 dark:border-white/10 dark:text-slate-500 cursor-not-allowed">
                  <FileText className="w-4 h-4 mr-2" />
                  Interactive Only
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-700 dark:hover:text-white">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-white/10 px-6 bg-slate-50/50 dark:bg-white/5">
            {[
              { id: "overview", label: "Overview", icon: <Presentation className="w-4 h-4" /> },
              { id: "insights", label: "AI Insights", icon: <Sparkles className="w-4 h-4" /> },
              { id: "related", label: "Related Assets", icon: <Database className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-950">
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Status</p>
                        <p className="font-semibold text-slate-900 dark:text-white capitalize">{details?.status}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Department</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{details?.department}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Data Freshness</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{details?.data_freshness}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Owner</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{details?.owner}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-emerald-500" /> Executive Highlights
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {details?.widgets?.slice(0,4).map(widget => (
                          <div key={widget.id} className="border border-slate-200 dark:border-white/10 rounded-xl p-4 bg-white dark:bg-slate-900/50 shadow-sm">
                            <SimpleChartWidget widget={widget} />
                          </div>
                        ))}
                        {(!details?.widgets || details.widgets.length === 0) && (
                          <div className="col-span-2 text-center py-10 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                            <p className="text-slate-500 dark:text-slate-400">Visualizations are being generated or not available.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* INSIGHTS TAB */}
                {activeTab === "insights" && (
                  <div className="space-y-6">
                    <div className="p-5 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-100 dark:border-purple-500/20">
                      <h3 className="text-base font-bold text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2">
                        <Sparkles className="w-5 h-5" /> Executive Summary
                      </h3>
                      <p className="text-purple-800 dark:text-purple-200/80 leading-relaxed text-sm">
                        {insights?.executive_summary || "No insights generated yet."}
                      </p>
                    </div>

                    {insights && insights.key_findings.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Key Findings</h4>
                        <ul className="space-y-2">
                          {insights.key_findings.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {insights && insights.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Strategic Recommendations</h4>
                        <div className="grid gap-3">
                          {insights.recommendations.map((r, i) => (
                            <div key={i} className="flex gap-3 p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-sm text-slate-700 dark:text-slate-300">
                              <ArrowRight className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                              <p>{r}</p>
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
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                      Explore the original datasets and dashboards that power this report.
                    </p>
                    
                    {related.length === 0 ? (
                      <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                        <p className="text-slate-500 dark:text-slate-400">No related assets found.</p>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {related.map(asset => (
                          <div key={asset.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-white/10 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10 transition-colors group cursor-pointer">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20">
                                {asset.type === 'dataset' ? <Database className="w-5 h-5 text-slate-500 group-hover:text-emerald-600" /> : <LayoutDashboard className="w-5 h-5 text-slate-500 group-hover:text-emerald-600" />}
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{asset.name}</h4>
                                <p className="text-xs text-slate-500 capitalize">{asset.type}</p>
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-emerald-500" />
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

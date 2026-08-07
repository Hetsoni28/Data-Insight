"use client";

import React, { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CopilotChat } from "@/components/organisms/CopilotChat";
import { ExecutiveReportViewer } from "@/components/organisms/ExecutiveReportViewer";
import { CorrelationHeatmap } from "@/components/molecules/CorrelationHeatmap";
import { DistributionChart } from "@/components/molecules/DistributionChart";
import { BarChart2, MessageSquare, FileText, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { AIService } from "@/lib/ai.service";
import { toast } from "sonner";

interface DatasetAnalyticsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId: string | null;
  datasetName?: string;
}

export function DatasetAnalyticsDrawer({ isOpen, onClose, datasetId, datasetName }: DatasetAnalyticsDrawerProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  
  const [narrative, setNarrative] = useState<any>(null);
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);
  const [activeTab, setActiveTab] = useState("copilot");

  useEffect(() => {
    if (isOpen && datasetId) {
      fetchProfile();
      // Reset narrative when opening a new dataset
      setNarrative(null); 
    }
  }, [isOpen, datasetId]);

  const fetchProfile = async () => {
    if (!datasetId) return;
    try {
      setLoadingProfile(true);
      const res = await api.get(`/tenant-datasets/${datasetId}`);
      if (res.data?.data?.profile) {
        setProfile(res.data.data.profile);
      } else {
        setProfile(null);
      }
    } catch (e) {
      console.error("Failed to load dataset profile", e);
      toast.error("Failed to load dataset profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleGenerateNarrative = async () => {
    if (!datasetId) return;
    try {
      setIsGeneratingNarrative(true);
      const res = await AIService.analyze(datasetId, "executive_summary");
      const jobId = res.job_id;
      toast.success("Started AI Narrative generation...");

      // Poll job status
      const poll = setInterval(async () => {
        try {
          const statusRes = await AIService.getJobStatus(jobId);
          if (statusRes.status === "SUCCESS") {
            clearInterval(poll);
            // Format result to match ExecutiveReportViewer expected prop structure
            const reportData = {
              id: datasetId,
              title: `${datasetName || "Dataset"} Executive Analysis`,
              ai_blueprint: statusRes.result
            };
            setNarrative(reportData);
            setIsGeneratingNarrative(false);
            toast.success("AI Narrative generated successfully!");
          } else if (statusRes.status === "FAILURE") {
            clearInterval(poll);
            setIsGeneratingNarrative(false);
            toast.error("AI Narrative generation failed.");
          }
        } catch (e) {
          clearInterval(poll);
          setIsGeneratingNarrative(false);
          toast.error("Error checking job status.");
        }
      }, 2000);
    } catch (e) {
      console.error("Failed to trigger narrative", e);
      toast.error("Failed to start narrative generation");
      setIsGeneratingNarrative(false);
    }
  };

  // Convert profile histograms to format expected by DistributionChart
  const renderDistributions = () => {
    if (!profile?.numeric_statistics) return null;
    return Object.entries(profile.numeric_statistics).map(([col, stats]: [string, any]) => {
      if (!stats.histogram) return null;
      // Depending on how histogram is structured in backend:
      // Assuming stats.histogram.bins (labels) and stats.histogram.counts (values)
      const labels = stats.histogram.bins || [];
      const counts = stats.histogram.counts || [];
      if (labels.length === 0 || counts.length === 0) return null;

      // Ensure labels are string
      const strLabels = labels.map((l: any) => String(l).substring(0, 8));

      return (
        <div key={col} className="mb-6 border border-slate-100 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/50">
          <DistributionChart 
            title={`Distribution of ${col}`}
            labels={strLabels}
            values={counts}
            height={250}
          />
        </div>
      );
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[95vw] sm:max-w-4xl p-0 flex flex-col h-full bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800" side="right">
        
        <SheetHeader className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-xl font-bold">
            <BarChart2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Analytics & AI Copilot
          </SheetTitle>
          <SheetDescription>
            {datasetName ? `Exploring dataset: ${datasetName}` : "Explore dataset insights and chat with your data."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
            <div className="px-6 pt-4 shrink-0">
              <TabsList className="w-full grid grid-cols-3 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                <TabsTrigger value="copilot" className="rounded-lg text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
                  <MessageSquare className="w-4 h-4 mr-2" /> Copilot Chat
                </TabsTrigger>
                <TabsTrigger value="visuals" className="rounded-lg text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
                  <BarChart2 className="w-4 h-4 mr-2" /> Visualizations
                </TabsTrigger>
                <TabsTrigger value="narrative" className="rounded-lg text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
                  <FileText className="w-4 h-4 mr-2" /> Executive Report
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
              <TabsContent value="copilot" className="h-full m-0 data-[state=active]:flex flex-col">
                <div className="flex-1 h-full min-h-[500px]">
                  <CopilotChat datasetId={datasetId} />
                </div>
              </TabsContent>

              <TabsContent value="visuals" className="m-0 space-y-8">
                {loadingProfile ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
                    <p>Analyzing statistical profile...</p>
                  </div>
                ) : !profile ? (
                  <div className="text-center py-20 text-slate-500 border border-dashed rounded-xl border-slate-200 dark:border-slate-800">
                    <p>No profile data available. Has this dataset been processed?</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                        Correlation Matrix
                      </h3>
                      <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-sm">
                        <CorrelationHeatmap data={profile.correlation_matrix} height={400} />
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white mt-10">
                        Feature Distributions
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderDistributions()}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="narrative" className="m-0">
                {!narrative ? (
                  <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6">
                      <FileText className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">AI Executive Briefing</h3>
                    <p className="text-slate-500 text-center max-w-md mb-8">
                      Generate a comprehensive, 5-tier automated executive report uncovering key drivers, anomalies, and strategic recommendations directly from the raw data.
                    </p>
                    <Button 
                      onClick={handleGenerateNarrative} 
                      disabled={isGeneratingNarrative || !datasetId}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 shadow-md"
                    >
                      {isGeneratingNarrative ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating AI Report...</>
                      ) : (
                        <><Play className="w-4 h-4 mr-2 fill-current" /> Generate Report Now</>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ExecutiveReportViewer report={narrative} />
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

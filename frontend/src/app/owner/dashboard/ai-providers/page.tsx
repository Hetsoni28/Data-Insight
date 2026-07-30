"use client";

import { useState } from "react";
import { BrainCircuit, CheckCircle2, XCircle, ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/molecules/PageHeader";
import { SettingCard } from "@/components/molecules/SettingCard";
import { FormInput } from "@/components/molecules/FormInput";
import { Button } from "@/components/ui/button";

export default function AiProvidersPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [providers, setProviders] = useState({
    openai: { key: "sk-proj-...", status: "connected" },
    anthropic: { key: "", status: "disconnected" },
    gemini: { key: "AIzaSy...", status: "connected" }
  });

  const handleSave = (provider: string) => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success(`${provider} API Key saved successfully`, {
        description: "Your models have been updated."
      });
      setProviders(prev => ({
        ...prev,
        [provider.toLowerCase()]: { ...prev[provider.toLowerCase() as keyof typeof prev], status: "connected" }
      }));
    }, 800);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
      <PageHeader 
        title="AI Providers" 
        description="Configure your connections to large language models (LLMs) used across the platform."
        icon={BrainCircuit}
      />

      <div className="grid gap-6">
        {/* OpenAI Card */}
        <SettingCard 
          title="OpenAI (ChatGPT)" 
          description="Used for advanced reasoning, complex data transformations, and premium narrative generation."
          delay={0.1}
        >
          <div className="space-y-4">
            <div className="flex items-end gap-3 max-w-2xl">
              <div className="flex-1">
                <FormInput 
                  label="API Key" 
                  type="password" 
                  defaultValue={providers.openai.key} 
                  placeholder="sk-..."
                />
              </div>
              <Button onClick={() => handleSave('OpenAI')} disabled={isSaving} className="bg-slate-900 hover:bg-slate-800 text-white h-[42px] px-6">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              {providers.openai.status === "connected" ? (
                <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span className="text-emerald-700 font-medium">Connected successfully</span></>
              ) : (
                <><XCircle className="w-4 h-4 text-slate-400" /> <span className="text-slate-500 dark:text-slate-400">Not connected</span></>
              )}
              <span className="text-slate-300 mx-2">|</span>
              <a href="#" className="text-emerald-600 hover:underline inline-flex items-center">
                Get an API key <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          </div>
        </SettingCard>

        {/* Google Gemini Card */}
        <SettingCard 
          title="Google Gemini" 
          description="Default provider for high-speed chat interactions and fast data analysis."
          delay={0.2}
        >
          <div className="space-y-4">
            <div className="flex items-end gap-3 max-w-2xl">
              <div className="flex-1">
                <FormInput 
                  label="API Key" 
                  type="password" 
                  defaultValue={providers.gemini.key} 
                  placeholder="AIzaSy..."
                />
              </div>
              <Button onClick={() => handleSave('Gemini')} disabled={isSaving} className="bg-slate-900 hover:bg-slate-800 text-white h-[42px] px-6">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              {providers.gemini.status === "connected" ? (
                <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span className="text-emerald-700 font-medium">Connected successfully</span></>
              ) : (
                <><XCircle className="w-4 h-4 text-slate-400" /> <span className="text-slate-500 dark:text-slate-400">Not connected</span></>
              )}
            </div>
          </div>
        </SettingCard>
      </div>
    </div>
  );
}

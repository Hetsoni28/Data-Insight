"use client";

import { useState } from "react";
import { Key, Copy, RefreshCw, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/molecules/PageHeader";
import { SettingCard } from "@/components/molecules/SettingCard";
import { DataTable, Column } from "@/components/molecules/DataTable";
import { Button } from "@/components/ui/button";

export default function ApiManagementPage() {
  const [keys, setKeys] = useState([
    { id: "key-1", name: "Production App", key: "sk_live_...9f82", created: "2026-07-15", lastUsed: "2 hours ago", status: "active" },
    { id: "key-2", name: "Staging Testing", key: "sk_test_...3a4b", created: "2026-06-20", lastUsed: "5 days ago", status: "active" },
  ]);

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setKeys([
        { id: `key-${Date.now()}`, name: "New Application Key", key: "sk_live_..." + Math.random().toString(36).substring(2, 6), created: "Just now", lastUsed: "Never", status: "active" },
        ...keys
      ]);
      setIsGenerating(false);
      toast.success("New API Key generated successfully", {
        description: "Make sure to copy it now. You won't be able to see it again."
      });
    }, 1000);
  };

  const handleRevoke = (id: string) => {
    toast.error("API Key Revoked", {
      description: "Any application using this key will immediately lose access."
    });
    setKeys(keys.filter(k => k.id !== id));
  };

  const handleCopy = () => {
    toast.info("API Key copied to clipboard");
  };

  const columns: Column<typeof keys[0]>[] = [
    { header: "Name", accessorKey: "name", className: "font-medium text-slate-900" },
    { header: "Secret Key", accessorKey: "key", className: "font-mono text-slate-500" },
    { header: "Created", accessorKey: "created", className: "text-slate-500" },
    { header: "Last Used", accessorKey: "lastUsed", className: "text-slate-500" },
    { 
      header: "Actions", 
      className: "text-right",
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={handleCopy} className="h-8 w-8 text-slate-400 hover:text-emerald-600 transition-colors">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleRevoke(row.id)} className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
      <PageHeader 
        title="API Management" 
        description="Manage your API keys to authenticate requests from your applications."
        icon={Key}
        action={
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all"
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Key className="h-4 w-4 mr-2" />
            )}
            Generate New Key
          </Button>
        }
      />

      <div className="grid gap-6">
        <SettingCard 
          title="Active API Keys" 
          description="These keys grant full access to your workspace's API endpoints. Keep them secure."
          icon={ShieldAlert}
        >
          <DataTable 
            columns={columns} 
            data={keys} 
            emptyMessage="No API keys generated yet." 
            className="mt-6"
          />
        </SettingCard>
      </div>
    </div>
  );
}

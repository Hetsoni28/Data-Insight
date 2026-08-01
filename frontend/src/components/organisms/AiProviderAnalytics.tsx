"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";

export function AiProviderAnalytics() {
  const [mounted, setMounted] = useState(false);
  const [providerTab, setProviderTab] = useState("cost");
  const [burnTab, setBurnTab] = useState("tokens");

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: providerData, isLoading: providersLoading } = useQuery({
    queryKey: ["owner-ai-providers"],
    queryFn: async () => (await api.get("/owner/ai/providers")).data,
  });

  const { data: trendData, isLoading: trendsLoading } = useQuery({
    queryKey: ["owner-ai-trends"],
    queryFn: async () => (await api.get("/owner/ai/trends")).data,
  });

  if (!mounted || providersLoading || trendsLoading) {
    return <Skeleton className="w-full h-[400px] rounded-xl mb-8" />;
  }

  if (!providerData?.data || !trendData?.data) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Provider Cost Distribution */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Provider Intelligence</h3>
        </div>
        
        <Tabs value={providerTab} onValueChange={setProviderTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="cost">Cost by Provider</TabsTrigger>
            <TabsTrigger value="tokens">Token Volume</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cost" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={providerData.data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" tickFormatter={(val) => `$${val}`} />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={(value: any) => [`$${Number(value || 0).toFixed(2)}`, "Cost"]} />
                <Bar dataKey="cost" fill="#0A3A2A" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="tokens" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={providerData.data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={(value: any) => [new Intl.NumberFormat().format(Number(value || 0)), "Tokens"]} />
                <Bar dataKey="tokens" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </div>

      {/* Burn Rate Timeline */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">30-Day Platform Burn Rate</h3>
        
        <Tabs value={burnTab} onValueChange={setBurnTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="tokens">Token Burn</TabsTrigger>
            <TabsTrigger value="cost">Cost Burn</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tokens" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} minTickGap={30} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip />
                <Area type="monotone" dataKey="tokens" stroke="#10b981" fillOpacity={1} fill="url(#colorTokens)" />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="cost" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0A3A2A" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0A3A2A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} minTickGap={30} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip formatter={(value: any) => [`$${Number(value || 0).toFixed(2)}`, "Cost"]} />
                <Area type="monotone" dataKey="cost" stroke="#0A3A2A" fillOpacity={1} fill="url(#colorCost)" />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

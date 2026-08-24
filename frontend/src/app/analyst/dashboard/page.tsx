"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuth } from '@/hooks/useAuth';
import { tenantDashboardService } from '@/lib/tenantDashboard.service';
import { DatasetService } from '@/lib/dataset.service';

import { AnalystDashboardHeader } from '@/components/organisms/analyst/AnalystDashboardHeader';
import { AnalystKpiGrid } from '@/components/organisms/analyst/AnalystKpiGrid';
import { AnalystActivityChart } from '@/components/organisms/analyst/AnalystActivityChart';
import { AnalystRecentActivityFeed } from '@/components/organisms/analyst/AnalystRecentActivityFeed';
import { AnalystDatasetsTable } from '@/components/organisms/analyst/AnalystDatasetsTable';
import { AnalystAiCopilotCard } from '@/components/organisms/analyst/AnalystAiCopilotCard';

export default function AnalystDashboard() {
  const router = useRouter();
  const { data: user } = useAuth();
  const { activeWs } = useWorkspaceStore();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const wsId = activeWs?.id || 'default';

  // --- Queries ---
  const { data: overview } = useQuery({
    queryKey: ['analystOverview', wsId],
    queryFn: tenantDashboardService.getOverview,
    enabled: !!activeWs,
  });

  const { data: kpis, isLoading: loadingKpis } = useQuery({
    queryKey: ['analystKpis', wsId],
    queryFn: tenantDashboardService.getKpis,
    enabled: !!activeWs,
  });

  const { data: charts, isLoading: loadingCharts } = useQuery({
    queryKey: ['analystCharts', wsId],
    queryFn: tenantDashboardService.getCharts,
    enabled: !!activeWs,
  });

  const { data: datasets, isLoading: loadingDatasets } = useQuery({
    queryKey: ['analystDatasets', wsId],
    queryFn: () => DatasetService.list(activeWs!.id),
    enabled: !!activeWs,
  });

  const { data: activity, isLoading: loadingActivity } = useQuery({
    queryKey: ['analystActivity', wsId],
    queryFn: () => tenantDashboardService.getActivity(0, 10),
    enabled: !!activeWs,
  });

  // --- Handlers ---
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['analystOverview'] });
    await queryClient.invalidateQueries({ queryKey: ['analystKpis'] });
    await queryClient.invalidateQueries({ queryKey: ['analystCharts'] });
    await queryClient.invalidateQueries({ queryKey: ['analystDatasets'] });
    await queryClient.invalidateQueries({ queryKey: ['analystActivity'] });
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const greetingName =
    overview?.greeting || `Good morning, ${user?.full_name?.split(' ')[0] || 'Analyst'}`;

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <title>Analyst Dashboard | Data Insight</title>
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        <AnalystDashboardHeader
          greetingName={greetingName}
          workspaceName={activeWs?.name}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          onUploadClick={() => router.push('/analyst/dashboard/upload-dataset')}
        />

        <AnalystKpiGrid kpis={kpis} isLoading={loadingKpis} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AnalystActivityChart charts={charts} isLoading={loadingCharts} />
          <AnalystRecentActivityFeed activity={activity} isLoading={loadingActivity} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AnalystDatasetsTable
            datasets={datasets as any}
            isLoading={loadingDatasets}
            onUploadClick={() => router.push('/analyst/dashboard/upload-dataset')}
          />
          <AnalystAiCopilotCard />
        </div>
      </div>
    </div>
  );
}

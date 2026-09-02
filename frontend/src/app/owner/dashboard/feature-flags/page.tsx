import dynamic from "next/dynamic"
﻿'use client';

import { useQuery } from '@tanstack/react-query';
import { featureOpsService } from '@/lib/featureOpsService';

const FeatureHeroBanner = dynamic(() => import('@/components/organisms/FeatureHeroBanner').then(m => m.FeatureHeroBanner), { ssr: false })
const EnterpriseFeatureCenter = dynamic(() => import('@/components/organisms/EnterpriseFeatureCenter').then(m => m.EnterpriseFeatureCenter), { ssr: false })


export default function FeatureFlagsPage() {
    // 1. Fetch Overview KPIs
    const { data: overview, isLoading: overviewLoading } = useQuery({
        queryKey: ['feature-overview'],
        queryFn: featureOpsService.getOverview,
        refetchInterval: 15000,
    });

    // 2. Fetch Features
    const { data: features, isLoading: featuresLoading, refetch: refetchFeatures } = useQuery({
        queryKey: ['feature-flags'],
        queryFn: featureOpsService.getFeatures,
        refetchInterval: 30000,
    });

    // 3. Fetch Rollouts
    const { data: rollouts, isLoading: rolloutsLoading } = useQuery({
        queryKey: ['feature-rollouts'],
        queryFn: featureOpsService.getRollouts,
        refetchInterval: 30000,
    });
    
    // 4. Fetch Experiments
    const { data: experiments, isLoading: experimentsLoading } = useQuery({
        queryKey: ['feature-experiments'],
        queryFn: featureOpsService.getExperiments,
        refetchInterval: 60000,
    });

    const isLoading = featuresLoading || rolloutsLoading || experimentsLoading;

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 pb-24">
            <FeatureHeroBanner 
                overview={overview} 
                isLoading={overviewLoading} 
            />
            
            <EnterpriseFeatureCenter
                features={features}
                rollouts={rollouts}
                experiments={experiments}
                isLoading={isLoading}
                refetchFeatures={refetchFeatures}
            />
        </div>
    );
}

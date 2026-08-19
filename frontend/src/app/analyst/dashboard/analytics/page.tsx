import { Metadata } from "next";
import { DynamicViewerAnalyticsCenter as ViewerAnalyticsCenter } from "@/components/charts/dynamic";

export const metadata: Metadata = {
  title: "Analytics | Viewer | Data Insight",
  description: "Personalized Business Intelligence Analytics",
};

export default function ViewerAnalyticsPage() {
  return (
    <div className="flex-1 p-6 lg:p-8 h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto h-full">
        <ViewerAnalyticsCenter />
      </div>
    </div>
  );
}

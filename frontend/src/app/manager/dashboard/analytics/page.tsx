import { Metadata } from "next";
import { DynamicManagerAnalyticsCenter as ManagerAnalyticsCenter } from "@/components/charts/dynamic";

export const metadata: Metadata = {
  title: "Analytics | Manager | Data Insight",
  description: "Personalized Business Intelligence Analytics",
};

export default function ManagerAnalyticsPage() {
  return (
    <div className="flex-1 p-6 lg:p-8 h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <ManagerAnalyticsCenter />
      </div>
    </div>
  );
}

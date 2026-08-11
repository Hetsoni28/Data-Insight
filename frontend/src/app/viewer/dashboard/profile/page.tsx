import { Metadata } from "next";
import { ViewerProfileCenter } from "@/components/organisms/profile/ViewerProfileCenter";

export const metadata: Metadata = {
  title: "Profile | Viewer | Data Insight",
  description: "Manage your personal account, security, and preferences",
};

export default function ViewerProfilePage() {
  return (
    <div className="flex-1 p-6 lg:p-8 h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto h-full">
        <ViewerProfileCenter />
      </div>
    </div>
  );
}

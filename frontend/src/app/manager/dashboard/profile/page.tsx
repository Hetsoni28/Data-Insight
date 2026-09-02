import dynamic from "next/dynamic"
import { Metadata } from "next";

const ViewerProfileCenter = dynamic(() => import('@/components/organisms/profile/ViewerProfileCenter').then(m => m.ViewerProfileCenter), { ssr: false })


export const metadata: Metadata = {
  title: "Profile | Viewer | Data Insight",
  description: "Manage your personal account, security, and preferences",
};

export default function ViewerProfilePage() {
  return (
    <div className="flex-1 p-6 lg:p-8 min-h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto min-h-full">
        <ViewerProfileCenter />
      </div>
    </div>
  );
}

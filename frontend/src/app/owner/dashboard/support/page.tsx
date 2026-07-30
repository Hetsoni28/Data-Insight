"use client";

import { LifeBuoy, Send, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/molecules/PageHeader";
import { SettingCard } from "@/components/molecules/SettingCard";
import { FormInput } from "@/components/molecules/FormInput";
import { Button } from "@/components/ui/button";

export default function SupportCenterPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Support Ticket Submitted", {
      description: "Our enterprise support team will respond within 2 hours."
    });
    const form = e.target as HTMLFormElement;
    form.reset();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
      <PageHeader 
        title="Enterprise Support Center" 
        description="Get 24/7 priority assistance from our data engineers and platform specialists."
        icon={LifeBuoy}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Submit Ticket */}
        <div className="lg:col-span-2">
          <SettingCard title="Open a Support Ticket" delay={0.1}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput 
                label="Subject" 
                required 
                placeholder="e.g. Database connection failing"
              />
              
              <div>
                <label className="text-[13px] font-medium text-slate-700 block mb-1.5">Severity Level</label>
                <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-sm text-slate-900 transition-all duration-200 focus:outline-none focus:bg-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10">
                  <option>Low (General Inquiry)</option>
                  <option>Medium (Feature not working)</option>
                  <option>High (Data pipeline failing)</option>
                  <option>Critical (Complete system outage)</option>
                </select>
              </div>

              <FormInput 
                label="Description" 
                required 
                multiline
                rows={4}
                placeholder="Describe the issue in detail..."
              />
              
              <div className="pt-2">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Send className="w-4 h-4 mr-2" />
                  Submit Ticket
                </Button>
              </div>
            </form>
          </SettingCard>
        </div>

        {/* Previous Tickets */}
        <div>
          <SettingCard title="Recent Tickets" delay={0.2} icon={MessageSquareText}>
            <div className="space-y-4 mt-2">
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-slate-900">Issue with CSV Upload</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Resolved</span>
                </div>
                <p className="text-xs text-slate-500">Ticket #1042 • 2 days ago</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-slate-900">Billing Plan Upgrade</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Resolved</span>
                </div>
                <p className="text-xs text-slate-500">Ticket #0981 • 1 week ago</p>
              </div>
            </div>
          </SettingCard>
        </div>
      </div>
    </div>
  );
}

"use client"
import { useState } from "react"
import { Building2, Users, CreditCard, Settings2, Save } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"
import { StateLayout } from "@/components/molecules/StateLayout"
import { AccessRestrictedIllustration } from "@/components/molecules/AccessRestrictedIllustration"
import { PageHeader } from "@/components/molecules/PageHeader"
import { SettingCard } from "@/components/molecules/SettingCard"
import { FormInput } from "@/components/molecules/FormInput"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  const router = useRouter()
  const { data: user } = useAuth()
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user && !user.is_owner && user.role !== "org_admin") {
      router.push("/dashboard")
    }
  }, [user, router])

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      toast.success("Settings Saved", { description: "Your organization profile has been updated." })
    }, 1000)
  }

  if (!user || (!user.is_owner && user.role !== "org_admin")) {
    return (
      <div className="p-8 max-w-3xl mx-auto flex items-center justify-center min-h-[calc(100vh-100px)]">
        <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden p-6">
          <StateLayout
            illustration={<AccessRestrictedIllustration />}
            headline="Access Restricted"
            description="You do not have permission to view or modify organization settings. Please contact your organization owner to upgrade your role."
            primaryAction={{
              label: "Return to Dashboard",
              icon: <Building2 className="w-4 h-4" />,
              onClick: () => router.push("/dashboard"),
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
      <PageHeader 
        title="System Settings" 
        description="Manage your organization's core profile, billing, and team structure."
        icon={Settings2}
        action={
          <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        }
      />

      <div className="grid md:grid-cols-2 gap-6">
        <SettingCard title="Organization Profile" description="Update your company name and workspace defaults." icon={Building2} delay={0.1}>
          <div className="space-y-4 mt-4">
            <FormInput 
              label="Company Name" 
              defaultValue="Data Insight Corp" 
              placeholder="e.g. Acme Inc"
            />
            <FormInput 
              label="Support Email" 
              type="email" 
              defaultValue="support@datainsight.com" 
              placeholder="e.g. hello@company.com"
            />
          </div>
        </SettingCard>

        <SettingCard title="Team Management" description="Invite members and configure roles." icon={Users} delay={0.2}>
          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
              <div>
                <p className="font-medium text-sm text-slate-900">12 Active Members</p>
                <p className="text-xs text-slate-500">3 pending invitations</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push("/owner/dashboard/users")}>Manage Team</Button>
            </div>
          </div>
        </SettingCard>

        <SettingCard title="Billing & Subscriptions" description="View current plan and payment methods." icon={CreditCard} delay={0.3} className="md:col-span-2">
          <div className="flex flex-col sm:flex-row gap-6 mt-4 p-4 rounded-xl border border-slate-100 bg-slate-50">
            <div className="flex-1">
              <p className="text-xs font-semibold text-emerald-600 tracking-wider uppercase mb-1">Current Plan</p>
              <p className="text-2xl font-bold text-slate-900">Enterprise AI <span className="text-sm font-normal text-slate-500">/ $999/mo</span></p>
              <p className="text-sm text-slate-500 mt-2">Your next billing date is August 15, 2026.</p>
            </div>
            <div className="flex gap-3 items-center">
              <Button variant="outline" onClick={() => toast.info("Downloading Invoice...")}>View Invoices</Button>
              <Button className="bg-slate-900 hover:bg-slate-800 text-white" onClick={() => router.push("/owner/dashboard/subscriptions")}>Upgrade Plan</Button>
            </div>
          </div>
        </SettingCard>
      </div>
    </div>
  )
}

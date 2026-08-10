"use client"
import { useState, useEffect } from "react"
import { Building2, Save, Loader2, Settings2 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { StateLayout } from "@/components/molecules/StateLayout"
import { AccessRestrictedIllustration } from "@/components/molecules/AccessRestrictedIllustration"
import { PageHeader } from "@/components/molecules/PageHeader"
import { Button } from "@/components/ui/button"
import { TenantService, Tenant } from "@/lib/tenant.service"
import { getActiveUsers, getPendingUsers } from "@/lib/users.service"
import { WebhooksService, Webhook } from "@/lib/webhooks.service"
import { SettingsGrid } from "@/components/organisms/SettingsGrid"

export default function SettingsPage() {
  const router = useRouter()
  const { data: user } = useAuth()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [companyName, setCompanyName] = useState("")
  const [domain, setDomain] = useState("")
  const [customDomain, setCustomDomain] = useState("")
  const [customDomainStatus, setCustomDomainStatus] = useState<string | null>(null)
  const [industry, setIndustry] = useState("")
  const [timezone, setTimezone] = useState("UTC")
  const [currency, setCurrency] = useState("USD")
  const [primaryColor, setPrimaryColor] = useState("#059669")
  const [accentColor, setAccentColor] = useState("#10b981")
  const [customLogoUrl, setCustomLogoUrl] = useState("")
  const [dataResidency, setDataResidency] = useState("us-east-1")
  const [gdprMode, setGdprMode] = useState(false)
  const [enforce2FA, setEnforce2FA] = useState(false)
  const [ssoEnabled, setSsoEnabled] = useState(false)
  const [ssoProvider, setSsoProvider] = useState("okta")
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [newWebhookUrl, setNewWebhookUrl] = useState("")
  const [activeMembers, setActiveMembers] = useState(0)
  const [pendingMembers, setPendingMembers] = useState(0)

  useEffect(() => {
    if (user && !user.is_owner && user.role !== "org_admin") return router.push("/dashboard")
    if (user) loadData()
  }, [user, router])

  const loadData = async () => {
    try {
      const [tenantData, activeUsers, pendingUsers, webhooksData] = await Promise.all([
        TenantService.getMe(), getActiveUsers(), getPendingUsers(), WebhooksService.getWebhooks().catch(() => [])
      ])
      setTenant(tenantData)
      setCompanyName(tenantData.name)
      setDomain(tenantData.domain || "")
      setCustomDomain(tenantData.custom_domain || "")
      setCustomDomainStatus(tenantData.custom_domain_status || null)
      setIndustry(tenantData.industry || "")
      setTimezone(tenantData.timezone || "UTC")
      setCurrency(tenantData.currency || "USD")
      if (tenantData.white_label_config) {
        setPrimaryColor(tenantData.white_label_config.primaryColor || "#059669")
        setAccentColor(tenantData.white_label_config.accentColor || "#10b981")
        setCustomLogoUrl(tenantData.white_label_config.customLogoUrl || "")
        setDataResidency(tenantData.white_label_config.dataResidency || "us-east-1")
        setGdprMode(tenantData.white_label_config.gdprMode || false)
        setEnforce2FA(tenantData.white_label_config.enforce2FA || false)
      }
      if (tenantData.sso_config) {
        setSsoEnabled(tenantData.sso_config.enabled || false)
        setSsoProvider(tenantData.sso_config.provider || "okta")
      }
      setWebhooks(webhooksData)
      setActiveMembers(activeUsers.length + 1)
      setPendingMembers(pendingUsers.length)
    } catch { toast.error("Failed to load organization profile.") } finally { setIsLoading(false) }
  }

  const handleSave = async () => {
    if (!companyName.trim()) return toast.error("Company name cannot be empty.")
    setIsSaving(true)
    try {
      await TenantService.updateMe({ 
        name: companyName, domain: domain || undefined, custom_domain: customDomain || undefined, industry: industry || undefined, timezone, currency,
        white_label_config: { primaryColor, accentColor, customLogoUrl, dataResidency, gdprMode, enforce2FA },
        sso_config: { enabled: ssoEnabled, provider: ssoProvider }
      })
      toast.success("Settings Saved")
    } catch { toast.error("Failed to update settings.") } finally { setIsSaving(false) }
  }

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWebhookUrl.trim()) return
    try {
      const webhook = await WebhooksService.createWebhook("Integration Webhook", newWebhookUrl, ["*"])
      setWebhooks([webhook, ...webhooks]); setNewWebhookUrl(""); toast.success("Webhook created")
    } catch { toast.error("Failed to create webhook") }
  }

  const handleDeleteWebhook = async (id: string) => {
    try { await WebhooksService.deleteWebhook(id); setWebhooks(webhooks.filter(w => w.id !== id)); toast.success("Webhook deleted") } catch { toast.error("Failed to delete webhook") }
  }

  const handleDeleteOrganization = () => { if (confirm("WARNING: Irreversible!")) if (confirm("Confirm?")) toast.error("Cannot delete demo org") }

  if (!user || (!user.is_owner && user.role !== "org_admin")) return (
    <div className="p-8 max-w-3xl mx-auto min-h-[calc(100vh-100px)]">
      <StateLayout illustration={<AccessRestrictedIllustration />} headline="Access Restricted" description="No permission." primaryAction={{ label: "Dashboard", icon: <Building2 className="w-4 h-4" />, onClick: () => router.push("/dashboard") }} />
    </div>
  )
  if (isLoading) return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="h-12 w-72 rounded-lg bg-slate-100 dark:bg-white/5 animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse" />
        ))}
      </div>
      <div className="h-32 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse" />
    </div>
  )

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
      <PageHeader 
        title="System Settings" description="Manage organization profile, branding, and security." icon={Settings2}
        action={<Button onClick={handleSave} disabled={isSaving || !companyName.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">{isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}{isSaving ? "Saving..." : "Save Changes"}</Button>}
      />
      <SettingsGrid 
        tenant={tenant} companyName={companyName} setCompanyName={setCompanyName} domain={domain} setDomain={setDomain} customDomain={customDomain} setCustomDomain={setCustomDomain} customDomainStatus={customDomainStatus} industry={industry} setIndustry={setIndustry} timezone={timezone} setTimezone={setTimezone} currency={currency} setCurrency={setCurrency} customLogoUrl={customLogoUrl} setCustomLogoUrl={setCustomLogoUrl} primaryColor={primaryColor} setPrimaryColor={setPrimaryColor} accentColor={accentColor} setAccentColor={setAccentColor} dataResidency={dataResidency} setDataResidency={setDataResidency} ssoEnabled={ssoEnabled} setSsoEnabled={setSsoEnabled} ssoProvider={ssoProvider} setSsoProvider={setSsoProvider} gdprMode={gdprMode} setGdprMode={setGdprMode} enforce2FA={enforce2FA} setEnforce2FA={setEnforce2FA} webhooks={webhooks} newWebhookUrl={newWebhookUrl} setNewWebhookUrl={setNewWebhookUrl} handleCreateWebhook={handleCreateWebhook} handleDeleteWebhook={handleDeleteWebhook} activeMembers={activeMembers} pendingMembers={pendingMembers} onManageTeamClick={() => router.push("/owner/dashboard/users")} onManageBillingClick={() => router.push("/owner/dashboard/subscriptions")} handleDeleteOrganization={handleDeleteOrganization}
      />
    </div>
  )
}

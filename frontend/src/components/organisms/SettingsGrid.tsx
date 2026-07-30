import { 
  Building2, Users, CreditCard, Palette, Shield, Link, AlertTriangle 
} from "lucide-react"
import { SettingCard } from "@/components/molecules/SettingCard"
import { 
  TenantProfileForm, WhiteLabelForm, SecurityForm, WebhooksForm, 
  TeamManagementCard, BillingCard, DangerZoneCard 
} from "@/components/molecules/SettingsForms"
import { Tenant } from "@/lib/tenant.service"
import { Webhook } from "@/lib/webhooks.service"

interface SettingsGridProps {
  tenant: Tenant | null
  // Tenant Profile Props
  companyName: string
  setCompanyName: (val: string) => void
  domain: string
  setDomain: (val: string) => void
  customDomain: string
  setCustomDomain: (val: string) => void
  customDomainStatus: string | null
  industry: string
  setIndustry: (val: string) => void
  timezone: string
  setTimezone: (val: string) => void
  currency: string
  setCurrency: (val: string) => void
  
  // White Label Props
  customLogoUrl: string
  setCustomLogoUrl: (val: string) => void
  primaryColor: string
  setPrimaryColor: (val: string) => void
  accentColor: string
  setAccentColor: (val: string) => void
  
  // Security Props
  dataResidency: string
  setDataResidency: (val: string) => void
  ssoEnabled: boolean
  setSsoEnabled: (val: boolean) => void
  ssoProvider: string
  setSsoProvider: (val: string) => void
  gdprMode: boolean
  setGdprMode: (val: boolean) => void
  enforce2FA: boolean
  setEnforce2FA: (val: boolean) => void

  // Webhooks Props
  webhooks: Webhook[]
  newWebhookUrl: string
  setNewWebhookUrl: (val: string) => void
  handleCreateWebhook: (e: React.FormEvent) => Promise<void>
  handleDeleteWebhook: (id: string) => Promise<void>

  // Team & Billing Props
  activeMembers: number
  pendingMembers: number
  onManageTeamClick: () => void
  onManageBillingClick: () => void

  // Danger Zone
  handleDeleteOrganization: () => void
}

export function SettingsGrid(props: SettingsGridProps) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <SettingCard title="Organization Profile" description="Update your company details and localization." icon={Building2} delay={0.1}>
        <TenantProfileForm 
          companyName={props.companyName} setCompanyName={props.setCompanyName}
          domain={props.domain} setDomain={props.setDomain}
          customDomain={props.customDomain} setCustomDomain={props.setCustomDomain}
          customDomainStatus={props.customDomainStatus}
          industry={props.industry} setIndustry={props.setIndustry}
          timezone={props.timezone} setTimezone={props.setTimezone}
          currency={props.currency} setCurrency={props.setCurrency}
        />
      </SettingCard>

      <SettingCard title="White-labeling & Branding" description="Customize the visual appearance of your dashboard." icon={Palette} delay={0.15}>
        <WhiteLabelForm 
          customLogoUrl={props.customLogoUrl} setCustomLogoUrl={props.setCustomLogoUrl}
          primaryColor={props.primaryColor} setPrimaryColor={props.setPrimaryColor}
          accentColor={props.accentColor} setAccentColor={props.setAccentColor}
        />
      </SettingCard>

      <SettingCard title="Security & Compliance" description="Configure organization-wide security policies." icon={Shield} delay={0.2}>
        <SecurityForm 
          dataResidency={props.dataResidency} setDataResidency={props.setDataResidency}
          ssoEnabled={props.ssoEnabled} setSsoEnabled={props.setSsoEnabled}
          ssoProvider={props.ssoProvider} setSsoProvider={props.setSsoProvider}
          gdprMode={props.gdprMode} setGdprMode={props.setGdprMode}
          enforce2FA={props.enforce2FA} setEnforce2FA={props.setEnforce2FA}
        />
      </SettingCard>

      <SettingCard title="Developers & Webhooks" description="Configure outbound webhooks for real-time events." icon={Link} delay={0.25}>
        <WebhooksForm 
          webhooks={props.webhooks} 
          newWebhookUrl={props.newWebhookUrl} setNewWebhookUrl={props.setNewWebhookUrl}
          handleCreateWebhook={props.handleCreateWebhook} handleDeleteWebhook={props.handleDeleteWebhook}
        />
      </SettingCard>

      <SettingCard title="Team Management" description="Invite members and configure roles." icon={Users} delay={0.3}>
        <TeamManagementCard 
          activeMembers={props.activeMembers} pendingMembers={props.pendingMembers}
          onManageClick={props.onManageTeamClick}
        />
      </SettingCard>

      <SettingCard title="Billing & Limits" description="View your current plan capabilities." icon={CreditCard} delay={0.3}>
        <BillingCard 
          tenant={props.tenant} activeMembers={props.activeMembers}
          onManageClick={props.onManageBillingClick}
        />
      </SettingCard>

      <SettingCard title="Danger Zone" description="Irreversible organization actions." icon={AlertTriangle} delay={0.35} className="border-red-200 bg-red-50/50">
        <DangerZoneCard onDeleteClick={props.handleDeleteOrganization} />
      </SettingCard>
    </div>
  )
}

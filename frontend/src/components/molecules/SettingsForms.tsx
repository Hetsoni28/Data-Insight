import { FormInput } from "./FormInput"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { 
  Globe, Briefcase, Clock, Coins, CheckCircle2, Loader2, XCircle, Building2 
} from "lucide-react"
import { Tenant } from "@/lib/tenant.service"
import { Webhook } from "@/lib/webhooks.service"

export function TenantProfileForm(props: any) {
  return (
    <div className="space-y-4 mt-4">
      <FormInput 
        label="Company Name" 
        value={props.companyName} 
        onChange={(e: any) => props.setCompanyName(e.target.value)}
        placeholder="e.g. Acme Inc"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><Globe className="w-4 h-4 text-slate-500 dark:text-slate-400" /> Internal Domain</Label>
          <div className="flex rounded-md shadow-sm">
            <Input value={props.domain} onChange={(e) => props.setDomain(e.target.value)} placeholder="acme" className="rounded-r-none border-r-0" />
            <span className="inline-flex items-center rounded-r-md border border-l-0 border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 text-sm text-slate-500 dark:text-slate-400">
              .datainsight.com
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2">Custom External Domain</Label>
          <div className="flex items-center gap-2">
            <Input value={props.customDomain} onChange={(e) => props.setCustomDomain(e.target.value)} placeholder="data.acme.com" />
            {props.customDomainStatus === 'verified' ? (
              <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Verified</span>
            ) : props.customDomainStatus === 'pending' ? (
              <span className="flex items-center text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Pending DNS</span>
            ) : props.customDomainStatus === 'failed' ? (
              <span className="flex items-center text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200"><XCircle className="w-3 h-3 mr-1" /> Failed</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-slate-500 dark:text-slate-400" /> Industry</Label>
          <Input value={props.industry} onChange={(e) => props.setIndustry(e.target.value)} placeholder="e.g. Finance" />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" /> Timezone</Label>
          <select value={props.timezone} onChange={(e) => props.setTimezone(e.target.value)} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><Coins className="w-4 h-4 text-slate-500 dark:text-slate-400" /> Currency</Label>
          <select value={props.currency} onChange={(e) => props.setCurrency(e.target.value)} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="INR">INR (₹)</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export function WhiteLabelForm(props: any) {
  return (
    <div className="space-y-4 mt-4">
      <FormInput 
        label="Custom Logo URL" 
        value={props.customLogoUrl} 
        onChange={(e: any) => props.setCustomLogoUrl(e.target.value)}
        placeholder="https://example.com/logo.png"
      />
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Primary Color</Label>
          <div className="flex gap-2 items-center">
            <input type="color" value={props.primaryColor} onChange={(e) => props.setPrimaryColor(e.target.value)} className="w-10 h-10 p-1 border rounded-md cursor-pointer" />
            <Input value={props.primaryColor} onChange={(e) => props.setPrimaryColor(e.target.value)} className="uppercase font-mono text-sm" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Accent Color</Label>
          <div className="flex gap-2 items-center">
            <input type="color" value={props.accentColor} onChange={(e) => props.setAccentColor(e.target.value)} className="w-10 h-10 p-1 border rounded-md cursor-pointer" />
            <Input value={props.accentColor} onChange={(e) => props.setAccentColor(e.target.value)} className="uppercase font-mono text-sm" />
          </div>
        </div>
      </div>

      <div className="pt-2">
        <div className="p-4 rounded-lg border border-slate-100 dark:border-white/5 flex items-center justify-between" style={{ backgroundColor: props.primaryColor + '10', borderColor: props.primaryColor + '30' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: props.primaryColor }}>
              <Building2 className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm" style={{ color: props.primaryColor }}>Branding Preview</span>
          </div>
          <Button size="sm" style={{ backgroundColor: props.accentColor, color: '#fff' }}>Test Button</Button>
        </div>
      </div>
    </div>
  )
}

export function SecurityForm(props: any) {
  return (
    <div className="space-y-6 mt-4">
      <div className="space-y-2">
        <Label className="flex items-center gap-2">Data Residency</Label>
        <select value={props.dataResidency} onChange={(e) => props.setDataResidency(e.target.value)} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <option value="us-east-1">US East (N. Virginia)</option>
          <option value="us-west-2">US West (Oregon)</option>
          <option value="eu-central-1">EU Central (Frankfurt)</option>
          <option value="ap-southeast-2">Asia Pacific (Sydney)</option>
        </select>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Changes to data residency may take up to 24 hours to migrate.</p>
      </div>

      <div className="flex items-center justify-between border-t pt-4 border-b pb-4">
        <div>
          <Label className="text-sm font-medium">Enterprise Single Sign-On (SSO)</Label>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[280px]">Allow users to authenticate via SAML or OIDC.</p>
        </div>
        <Switch checked={props.ssoEnabled} onCheckedChange={props.setSsoEnabled} />
      </div>
      
      {props.ssoEnabled && (
        <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 mt-2 space-y-4">
          <div className="space-y-2">
            <Label>SSO Provider</Label>
            <select value={props.ssoProvider} onChange={(e) => props.setSsoProvider(e.target.value)} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="okta">Okta (SAML)</option>
              <option value="azure">Azure Active Directory</option>
              <option value="google">Google Workspace</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>SAML Metadata URL</Label>
            <Input placeholder="https://example.okta.com/app/exk..." />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <Label className="text-sm font-medium">Strict GDPR Compliance Mode</Label>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[280px]">Automatically enforces 30-day data retention and PII masking across all reports.</p>
        </div>
        <Switch checked={props.gdprMode} onCheckedChange={props.setGdprMode} />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Enforce 2FA for all members</Label>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[280px]">Require all organization members to set up Two-Factor Authentication upon next login.</p>
        </div>
        <Switch checked={props.enforce2FA} onCheckedChange={props.setEnforce2FA} />
      </div>
    </div>
  )
}

export function WebhooksForm(props: any) {
  return (
    <div className="space-y-4 mt-4">
      <form onSubmit={props.handleCreateWebhook} className="flex gap-2">
        <Input value={props.newWebhookUrl} onChange={(e) => props.setNewWebhookUrl(e.target.value)} placeholder="https://your-api.com/webhooks" type="url" required />
        <Button type="submit">Add Webhook</Button>
      </form>
      
      <div className="space-y-2 mt-4">
        {props.webhooks.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4 border border-dashed rounded-lg">No webhooks configured.</p>
        ) : (
          props.webhooks.map((webhook: Webhook) => (
            <div key={webhook.id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 dark:bg-white/5">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{webhook.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px] truncate">{webhook.url}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => props.handleDeleteWebhook(webhook.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                Remove
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export function TeamManagementCard(props: any) {
  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between p-4 rounded-lg border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
        <div>
          <p className="font-medium text-sm text-slate-900 dark:text-white">{props.activeMembers} Active {props.activeMembers === 1 ? 'Member' : 'Members'}</p>
          {props.pendingMembers > 0 && <p className="text-xs font-medium text-amber-600 mt-1">{props.pendingMembers} pending invitations</p>}
          {props.pendingMembers === 0 && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No pending invitations</p>}
        </div>
        <Button variant="outline" size="sm" onClick={props.onManageClick}>Manage Team</Button>
      </div>
    </div>
  )
}

export function BillingCard(props: any) {
  const tenant = props.tenant as Tenant | null;
  return (
    <div className="flex flex-col sm:flex-row gap-6 mt-4 p-5 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
      <div className="flex-1">
        <p className="text-xs font-semibold text-emerald-600 tracking-wider uppercase mb-1">Current Plan</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white capitalize">{tenant?.plan || "Free"} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">Tier</span></p>
        
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Team Members</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{props.activeMembers} / {tenant?.max_users || 5}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Storage Limit</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">0 GB / {tenant?.max_storage_gb || 5} GB</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">AI Tokens (Monthly)</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">0 / {(tenant?.max_ai_tokens_per_month || 100000).toLocaleString()}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3 justify-center">
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white w-full shadow-sm" onClick={props.onManageClick}>Manage Subscription</Button>
      </div>
    </div>
  )
}

export function DangerZoneCard(props: any) {
  return (
    <div className="mt-4 p-5 rounded-xl border border-red-100 bg-white dark:bg-white/5">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Delete Organization</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[250px]">Permanently delete your organization, all datasets, workspaces, and team access. This action cannot be undone.</p>
        </div>
        <Button variant="destructive" onClick={props.onDeleteClick}>Delete Organization</Button>
      </div>
    </div>
  )
}

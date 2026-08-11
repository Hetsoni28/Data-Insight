import os

filepath = r"c:\Users\Het\OneDrive\Desktop\data-insight\frontend\src\app\organization-admin\dashboard\settings\page.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports to include Switch, Select, and more Lucide icons
import_old = """import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Sparkles,
  Shield,
  Database,
  Link as LinkIcon,
  Bell,
  ScrollText,
  Settings,
  Upload,
} from "lucide-react";"""

import_new = """import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Sparkles,
  Shield,
  Database,
  Link as LinkIcon,
  Bell,
  ScrollText,
  Settings,
  Upload,
  MessageSquare,
  Cloud,
  Mail,
  AlertTriangle
} from "lucide-react";"""

if "import { Switch }" not in content:
    content = content.replace(import_old, import_new)

# 2. Replace Security tab
security_old = """            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Security & SSO</h3>
                  <p className="text-sm text-slate-500">Manage access controls and single sign-on.</p>
                </div>
                <Separator />
                <Card>
                  <CardHeader>
                    <CardTitle>Authentication</CardTitle>
                    <CardDescription>Configure how users authenticate.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enforce Two-Factor Authentication</Label>
                        <p className="text-sm text-slate-500">Require 2FA for all organization members.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={securityConfig?.enforce_2fa || false}
                        onChange={(e) => setSecurityConfig({...securityConfig, enforce_2fa: e.target.checked})}
                        className="w-5 h-5 accent-emerald-600"
                      />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label>SSO Provider (SAML/OIDC)</Label>
                      <select 
                        value={securityConfig?.sso_provider || "none"}
                        onChange={(e) => setSecurityConfig({...securityConfig, sso_provider: e.target.value})}
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 dark:border-slate-800 dark:bg-[#0B0F17] dark:ring-offset-slate-950"
                      >
                        <option value="none">Disabled</option>
                        <option value="okta">Okta</option>
                        <option value="azure">Azure AD</option>
                        <option value="google">Google Workspace</option>
                      </select>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end border-t p-6 dark:border-[#1f1f1f]">
                    <Button onClick={() => handleSaveConfig('security', securityConfig)} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      {saving ? "Saving..." : "Save Security Settings"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}"""

security_new = """            {activeTab === 'security' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Security & SSO</h3>
                  <p className="text-sm text-slate-500">Manage access controls and single sign-on across your enterprise.</p>
                </div>
                <Separator />
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Authentication Policies</CardTitle>
                    <CardDescription>Configure how users authenticate and secure their accounts.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <div className="space-y-0.5">
                        <Label className="text-base font-medium">Enforce Two-Factor Authentication</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Require 2FA for all organization members. Highly recommended.</p>
                      </div>
                      <Switch 
                        checked={securityConfig?.enforce_2fa || false}
                        onCheckedChange={(checked) => setSecurityConfig({...securityConfig, enforce_2fa: checked})}
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label className="text-base font-medium">SSO Provider (SAML/OIDC)</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400 -mt-2">Delegate authentication to an enterprise identity provider.</p>
                      <Select 
                        value={securityConfig?.sso_provider || "none"}
                        onValueChange={(val) => setSecurityConfig({...securityConfig, sso_provider: val})}
                      >
                        <SelectTrigger className="w-full md:w-[300px]">
                          <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Disabled</SelectItem>
                          <SelectItem value="okta">Okta</SelectItem>
                          <SelectItem value="azure">Azure Active Directory</SelectItem>
                          <SelectItem value="google">Google Workspace</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end border-t border-slate-100 p-6 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                    <Button onClick={() => handleSaveConfig('security', securityConfig)} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                      {saving ? "Saving..." : "Save Security Settings"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}"""

content = content.replace(security_old, security_new)


# 3. Replace Data Connections tab
data_old = """            {activeTab === 'data' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Data Connections</h3>
                  <p className="text-sm text-slate-500">Manage external database connections for your BI platform.</p>
                </div>
                <Separator />
                <Card>
                  <CardHeader>
                    <CardTitle>Warehouse Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Snowflake Sync</Label>
                        <p className="text-sm text-slate-500">Nightly data sync from Snowflake.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={dataConnections?.snowflake_enabled || false}
                        onChange={(e) => setDataConnections({...dataConnections, snowflake_enabled: e.target.checked})}
                        className="w-5 h-5 accent-emerald-600"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Postgres Direct Query</Label>
                        <p className="text-sm text-slate-500">Allow direct querying to external Postgres.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={dataConnections?.postgres_enabled || false}
                        onChange={(e) => setDataConnections({...dataConnections, postgres_enabled: e.target.checked})}
                        className="w-5 h-5 accent-emerald-600"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end border-t p-6 dark:border-[#1f1f1f]">
                    <Button onClick={() => handleSaveConfig('data-connections', dataConnections)} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      {saving ? "Saving..." : "Save Data Connections"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}"""

data_new = """            {activeTab === 'data' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Data Connections</h3>
                  <p className="text-sm text-slate-500">Manage external database connections for your BI platform.</p>
                </div>
                <Separator />
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Warehouse Configuration</CardTitle>
                    <CardDescription>Activate and sync your external data lakes and data warehouses.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start space-x-4 rounded-lg border border-slate-200 dark:border-slate-800 p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#29b5e8]/10">
                        <Database className="h-5 w-5 text-[#29b5e8]" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-base font-medium">Snowflake Data Cloud</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Nightly automated data sync from your Snowflake instance.</p>
                      </div>
                      <Switch 
                        checked={dataConnections?.snowflake_enabled || false}
                        onCheckedChange={(checked) => setDataConnections({...dataConnections, snowflake_enabled: checked})}
                      />
                    </div>
                    
                    <div className="flex items-start space-x-4 rounded-lg border border-slate-200 dark:border-slate-800 p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#336791]/10">
                        <Database className="h-5 w-5 text-[#336791]" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-base font-medium">PostgreSQL Direct Query</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Allow direct live querying to external Postgres databases.</p>
                      </div>
                      <Switch 
                        checked={dataConnections?.postgres_enabled || false}
                        onCheckedChange={(checked) => setDataConnections({...dataConnections, postgres_enabled: checked})}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end border-t border-slate-100 p-6 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                    <Button onClick={() => handleSaveConfig('data-connections', dataConnections)} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                      {saving ? "Saving..." : "Save Connections"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}"""

content = content.replace(data_old, data_new)


# 4. Replace Integrations and Notifications tabs
int_notif_old = """            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Integrations</h3>
                  <p className="text-sm text-slate-500">Connect third-party apps.</p>
                </div>
                <Separator />
                <Card>
                  <CardContent className="space-y-4 pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Slack Integration</Label>
                        <p className="text-sm text-slate-500">Send reports directly to Slack channels.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={integrations?.slack_enabled || false}
                        onChange={(e) => setIntegrations({...integrations, slack_enabled: e.target.checked})}
                        className="w-5 h-5 accent-emerald-600"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Salesforce Integration</Label>
                        <p className="text-sm text-slate-500">Sync Salesforce CRM data automatically.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={integrations?.salesforce_enabled || false}
                        onChange={(e) => setIntegrations({...integrations, salesforce_enabled: e.target.checked})}
                        className="w-5 h-5 accent-emerald-600"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end border-t p-6 dark:border-[#1f1f1f]">
                    <Button onClick={() => handleSaveConfig('integrations', integrations)} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      {saving ? "Saving..." : "Save Integrations"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Notifications</h3>
                  <p className="text-sm text-slate-500">Manage global organization alerts.</p>
                </div>
                <Separator />
                <Card>
                  <CardContent className="space-y-4 pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email Alerts for Data Anomalies</Label>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={notifications?.anomaly_emails || false}
                        onChange={(e) => setNotifications({...notifications, anomaly_emails: e.target.checked})}
                        className="w-5 h-5 accent-emerald-600"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Weekly Summary Report</Label>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={notifications?.weekly_summary || false}
                        onChange={(e) => setNotifications({...notifications, weekly_summary: e.target.checked})}
                        className="w-5 h-5 accent-emerald-600"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end border-t p-6 dark:border-[#1f1f1f]">
                    <Button onClick={() => handleSaveConfig('notifications', notifications)} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      {saving ? "Saving..." : "Save Notifications"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}"""

int_notif_new = """            {activeTab === 'integrations' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Integrations</h3>
                  <p className="text-sm text-slate-500">Connect third-party apps to streamline your workflows.</p>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-[#E01E5A]/10 rounded-md">
                          <MessageSquare className="h-5 w-5 text-[#E01E5A]" />
                        </div>
                        <CardTitle className="text-base">Slack</CardTitle>
                      </div>
                      <Switch 
                        checked={integrations?.slack_enabled || false}
                        onCheckedChange={(checked) => setIntegrations({...integrations, slack_enabled: checked})}
                      />
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Send automated reports, alerts, and insights directly to your team's Slack channels.</p>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-[#00A1E0]/10 rounded-md">
                          <Cloud className="h-5 w-5 text-[#00A1E0]" />
                        </div>
                        <CardTitle className="text-base">Salesforce</CardTitle>
                      </div>
                      <Switch 
                        checked={integrations?.salesforce_enabled || false}
                        onCheckedChange={(checked) => setIntegrations({...integrations, salesforce_enabled: checked})}
                      />
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Sync CRM data bidirectionally and enrich your analytics with live customer data.</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={() => handleSaveConfig('integrations', integrations)} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                    {saving ? "Saving..." : "Save Integrations"}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Notifications</h3>
                  <p className="text-sm text-slate-500">Configure global organization alerts and communication preferences.</p>
                </div>
                <Separator />
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardContent className="space-y-6 pt-6">
                    <div className="flex items-start space-x-4">
                      <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <Label className="text-base font-medium">Email Alerts for Data Anomalies</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Receive immediate alerts when our AI detects significant deviations in your primary metrics.</p>
                      </div>
                      <Switch 
                        checked={notifications?.anomaly_emails || false}
                        onCheckedChange={(checked) => setNotifications({...notifications, anomaly_emails: checked})}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-start space-x-4">
                      <ScrollText className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <Label className="text-base font-medium">Weekly Executive Summary</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Send an automated AI-generated summary report to all org admins every Monday morning.</p>
                      </div>
                      <Switch 
                        checked={notifications?.weekly_summary || false}
                        onCheckedChange={(checked) => setNotifications({...notifications, weekly_summary: checked})}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end border-t border-slate-100 p-6 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                    <Button onClick={() => handleSaveConfig('notifications', notifications)} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                      {saving ? "Saving..." : "Save Notification Preferences"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}"""

content = content.replace(int_notif_old, int_notif_new)


# 5. Replace Advanced and Audit tabs
audit_advanced_old = """            {activeTab === 'audit' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Audit Logs</h3>
                  <p className="text-sm text-slate-500">Review recent activity across the organization.</p>
                </div>
                <Separator />
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-[#1a1a1a]">
                        <tr>
                          <th className="px-6 py-3">Timestamp</th>
                          <th className="px-6 py-3">Action</th>
                          <th className="px-6 py-3">User</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">IP Address</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.length > 0 ? auditLogs.map((log) => (
                          <tr key={log.id} className="border-b dark:border-[#1f1f1f]">
                            <td className="px-6 py-4">{new Date(log.created_at).toLocaleString()}</td>
                            <td className="px-6 py-4 font-medium">{log.action}</td>
                            <td className="px-6 py-4">{log.user_email}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-xs ${log.status === 'success' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-800'}`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs">{log.ip_address}</td>
                          </tr>
                        )) : (
                          <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No audit logs found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Advanced Settings</h3>
                  <p className="text-sm text-slate-500">Danger zone and custom domains.</p>
                </div>
                <Separator />
                <Card>
                  <CardHeader>
                    <CardTitle>Custom Domain</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>CNAME Record</Label>
                      <Input 
                        value={advancedConfig?.custom_domain || ""}
                        onChange={(e) => setAdvancedConfig({...advancedConfig, custom_domain: e.target.value})}
                        placeholder="analytics.yourcompany.com"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end border-t p-6 dark:border-[#1f1f1f]">
                    <Button onClick={() => handleSaveConfig('advanced', advancedConfig)} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      {saving ? "Saving..." : "Save Advanced Config"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}"""

audit_advanced_new = """            {activeTab === 'audit' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">Audit Logs</h3>
                    <p className="text-sm text-slate-500">Immutable record of significant organization events.</p>
                  </div>
                  <Button variant="outline" className="text-slate-600 dark:text-slate-300">
                    <Upload className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
                <Separator />
                <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-6 py-4 font-semibold tracking-wider">Timestamp</th>
                          <th className="px-6 py-4 font-semibold tracking-wider">Action</th>
                          <th className="px-6 py-4 font-semibold tracking-wider">Actor</th>
                          <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                          <th className="px-6 py-4 font-semibold tracking-wider">IP Address</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {auditLogs.length > 0 ? auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {new Date(log.created_at).toLocaleString(undefined, {
                                year: 'numeric', month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit', second: '2-digit'
                              })}
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">{log.action}</td>
                            <td className="px-6 py-4">
                              <Badge variant="secondary" className="font-normal bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {log.user_email}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <Badge 
                                variant="outline" 
                                className={`font-medium ${log.status === 'success' 
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400' 
                                  : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400'}`}
                              >
                                {log.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-500">{log.ip_address}</td>
                          </tr>
                        )) : (
                          <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No recent audit logs found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Advanced Settings</h3>
                  <p className="text-sm text-slate-500">System configurations and dangerous actions.</p>
                </div>
                <Separator />
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Custom Domain</CardTitle>
                    <CardDescription>White-label the platform by hosting it on your own domain.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>CNAME Record</Label>
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                            https://
                          </div>
                          <Input 
                            value={advancedConfig?.custom_domain || ""}
                            onChange={(e) => setAdvancedConfig({...advancedConfig, custom_domain: e.target.value})}
                            placeholder="analytics.yourcompany.com"
                            className="pl-16"
                          />
                        </div>
                        <Button variant="outline">Verify</Button>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end border-t border-slate-100 p-6 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                    <Button onClick={() => handleSaveConfig('advanced', advancedConfig)} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                      {saving ? "Saving..." : "Save Domain Settings"}
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="border-red-200 dark:border-red-900/50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base text-red-600 dark:text-red-400 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Danger Zone
                    </CardTitle>
                    <CardDescription>Destructive actions that cannot be undone.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Delete Organization</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Permanently remove your organization and all associated data.</p>
                      </div>
                      <Button variant="destructive" className="shrink-0">
                        Delete Organization
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}"""

content = content.replace(audit_advanced_old, audit_advanced_new)


with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

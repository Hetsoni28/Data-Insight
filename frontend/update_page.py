import json

filepath = r"c:\Users\Het\OneDrive\Desktop\data-insight\frontend\src\app\organization-admin\dashboard\settings\page.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the sidebar rendering to remove the "Soon" badges
sidebar_old = """            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              // Only first two are implemented for Phase 1
              const isImplemented = tab.id === 'general' || tab.id === 'branding';
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  disabled={!isImplemented}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${isActive 
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#1f1f1f]'}
                    ${!isImplemented && 'opacity-50 cursor-not-allowed'}
                  `}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                  {tab.label}
                  {!isImplemented && (
                    <span className="ml-auto text-[10px] uppercase tracking-wider font-semibold text-slate-400 bg-slate-100 dark:bg-[#2a2a2a] px-1.5 py-0.5 rounded">
                      Soon
                    </span>
                  )}
                </button>
              );
            })}"""

sidebar_new = """            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${isActive 
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#1f1f1f]'}
                  `}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              );
            })}"""

content = content.replace(sidebar_old, sidebar_new)

# 2. Add state hooks for new configurations
state_hooks_old = """  const [primaryColor, setPrimaryColor] = useState("#059669");
  const [logoUrl, setLogoUrl] = useState("");"""

state_hooks_new = """  const [primaryColor, setPrimaryColor] = useState("#059669");
  const [logoUrl, setLogoUrl] = useState("");
  
  const [securityConfig, setSecurityConfig] = useState<any>({});
  const [dataConnections, setDataConnections] = useState<any>({});
  const [integrations, setIntegrations] = useState<any>({});
  const [notifications, setNotifications] = useState<any>({});
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [advancedConfig, setAdvancedConfig] = useState<any>({});"""

content = content.replace(state_hooks_old, state_hooks_new)

# 3. Add fetch logic for new configs
fetch_logic_old = """        const [profileRes, brandingRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/v1/tenant-settings/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_BASE_URL}/api/v1/tenant-settings/branding`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);"""

fetch_logic_new = """        const [profileRes, brandingRes, secRes, dataRes, intRes, notifRes, advRes, auditRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/v1/tenant-settings/profile`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/v1/tenant-settings/branding`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/v1/tenant-settings/security`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/v1/tenant-settings/data-connections`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/v1/tenant-settings/integrations`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/v1/tenant-settings/notifications`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/v1/tenant-settings/advanced`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/v1/tenant-settings/audit-logs`, { headers: { Authorization: `Bearer ${token}` } })
        ]);"""

content = content.replace(fetch_logic_old, fetch_logic_new)

# 4. Add set state logic for new configs
set_logic_old = """        if (brandingRes.ok) {
          const data = await brandingRes.json();
          setBranding(data);
          setLogoUrl(data.logo_url || "");
          setPrimaryColor(data.white_label_config?.primary_color || "#059669");
        }"""

set_logic_new = """        if (brandingRes.ok) {
          const data = await brandingRes.json();
          setBranding(data);
          setLogoUrl(data.logo_url || "");
          setPrimaryColor(data.white_label_config?.primary_color || "#059669");
        }
        if (secRes.ok) setSecurityConfig(await secRes.json());
        if (dataRes.ok) setDataConnections(await dataRes.json());
        if (intRes.ok) setIntegrations(await intRes.json());
        if (notifRes.ok) setNotifications(await notifRes.json());
        if (advRes.ok) setAdvancedConfig(await advRes.json());
        if (auditRes.ok) setAuditLogs(await auditRes.json());"""

content = content.replace(set_logic_old, set_logic_new)

# 5. Add universal save function
save_functions_old = """  const handleSaveBranding = async () => {"""
save_functions_new = """  const handleSaveConfig = async (endpoint: string, configData: any) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/tenant-settings/${endpoint}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: configData })
      });
      if (res.ok) alert("Settings saved successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBranding = async () => {"""

content = content.replace(save_functions_old, save_functions_new)

# 6. Append new UI Tabs
new_tabs = """            {activeTab === 'security' && (
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
            )}

            {activeTab === 'data' && (
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
            )}

            {activeTab === 'integrations' && (
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
            )}

            {activeTab === 'audit' && (
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

content = content.replace("          </div>\n        </main>", new_tabs + "\n          </div>\n        </main>")

# 7. Apply proper SVGs
logo_old = """                            <Building2 className="h-8 w-8 text-slate-400" />"""
logo_new = """                            <img src="/icon.svg" className="h-8 w-8 text-slate-400" alt="Data Insight Logo" />"""
content = content.replace(logo_old, logo_new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

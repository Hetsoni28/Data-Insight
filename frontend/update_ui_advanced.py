import os

filepath = r"c:\Users\Het\OneDrive\Desktop\data-insight\frontend\src\app\organization-admin\dashboard\settings\page.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# I need to add state for connection testing and domain verification, plus imports for Dialog/Toast if possible
# Alternatively, I can just use raw window.alert or basic state for simplicity.
# Let's add new states near the top.

# We will use simple component states to track testing, like `isTestingConnection`, `testResult`.

state_old = """  const [activeTab, setActiveTab] = useState("security");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);"""

state_new = """  const [activeTab, setActiveTab] = useState("security");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{status: string, message: string} | null>(null);
  const [dbCredentials, setDbCredentials] = useState({ host: "", port: "", database: "", username: "", password: "" });
  const [apiKeys, setApiKeys] = useState({ slack: "", salesforce: "" });
  
  const testDataConnection = async (provider: string) => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`${API_BASE_URL}/api/v1/tenant-settings/data-connections/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          provider,
          ...dbCredentials,
          port: dbCredentials.port ? parseInt(dbCredentials.port) : undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult({ status: 'success', message: data.message });
      } else {
        setTestResult({ status: 'error', message: data.detail || 'Connection failed' });
      }
    } catch (e) {
      setTestResult({ status: 'error', message: 'Network error occurred' });
    } finally {
      setTestingConnection(false);
    }
  };

  const verifyDomain = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`${API_BASE_URL}/api/v1/tenant-settings/advanced/verify-domain`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ domain: advancedConfig.custom_domain })
      });
      const data = await res.json();
      setTestResult({ status: data.status, message: data.message });
      // Update local state if verified
      if (data.status === 'verified') {
         setAdvancedConfig({...advancedConfig, domain_verified: true});
      }
    } catch (e) {
      setTestResult({ status: 'error', message: 'Verification failed' });
    } finally {
      setTestingConnection(false);
    }
  };

  const connectIntegration = async (provider: string) => {
    setTestingConnection(true);
    try {
      const token = useAuthStore.getState().token;
      const key = provider === 'slack' ? apiKeys.slack : apiKeys.salesforce;
      const res = await fetch(`${API_BASE_URL}/api/v1/tenant-settings/integrations/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ provider, api_key: key })
      });
      const data = await res.json();
      if (res.ok) {
         setTestResult({ status: 'success', message: data.message });
         setIntegrations({...integrations, [`${provider}_enabled`]: true});
      } else {
         setTestResult({ status: 'error', message: data.detail || 'Connection failed' });
      }
    } finally {
      setTestingConnection(false);
    }
  };

  const testNotification = async (type: string) => {
    setTestingConnection(true);
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`${API_BASE_URL}/api/v1/tenant-settings/notifications/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ type })
      });
      const data = await res.json();
      setTestResult({ status: 'success', message: data.message });
    } finally {
      setTestingConnection(false);
    }
  };
"""

content = content.replace(state_old, state_new)

# Update Data Connections tab to show the credential inputs and test button
data_old = """                    <div className="flex items-start space-x-4 rounded-lg border border-slate-200 dark:border-slate-800 p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
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
                    </div>"""

data_new = """                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
                      <div className="flex items-start space-x-4 mb-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#336791]/10">
                          <Database className="h-5 w-5 text-[#336791]" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <Label className="text-base font-medium">PostgreSQL Direct Query</Label>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Connect to your external Postgres database.</p>
                        </div>
                        <Switch 
                          checked={dataConnections?.postgres_enabled || false}
                          onCheckedChange={(checked) => setDataConnections({...dataConnections, postgres_enabled: checked})}
                        />
                      </div>
                      
                      {dataConnections?.postgres_enabled && (
                        <div className="pl-14 space-y-4 animate-in slide-in-from-top-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Host</Label>
                              <Input placeholder="db.example.com" value={dbCredentials.host} onChange={e => setDbCredentials({...dbCredentials, host: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                              <Label>Port</Label>
                              <Input placeholder="5432" value={dbCredentials.port} onChange={e => setDbCredentials({...dbCredentials, port: e.target.value})} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Username</Label>
                              <Input placeholder="admin" value={dbCredentials.username} onChange={e => setDbCredentials({...dbCredentials, username: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                              <Label>Password</Label>
                              <Input type="password" placeholder="••••••••" value={dbCredentials.password} onChange={e => setDbCredentials({...dbCredentials, password: e.target.value})} />
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button 
                              variant="outline" 
                              onClick={() => testDataConnection("postgres")}
                              disabled={testingConnection}
                            >
                              {testingConnection ? "Testing..." : "Test Connection"}
                            </Button>
                            {testResult && testResult.status === 'success' && (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Connection Successful</Badge>
                            )}
                            {testResult && testResult.status === 'error' && (
                              <Badge className="bg-red-100 text-red-800 border-red-200">{testResult.message}</Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>"""

content = content.replace(data_old, data_new)

# Update domain Verification logic
domain_old = """                        <div className="relative flex-1">
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
                      </div>"""

domain_new = """                        <div className="relative flex-1">
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
                        <Button variant="outline" onClick={verifyDomain} disabled={testingConnection || !advancedConfig?.custom_domain}>
                          {testingConnection ? "Verifying..." : "Verify DNS"}
                        </Button>
                      </div>
                      {testResult && (testResult.status === 'verified' || testResult.status === 'failed') && (
                        <div className={`p-3 rounded-md text-sm font-medium ${testResult.status === 'verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {testResult.message}
                        </div>
                      )}"""
content = content.replace(domain_old, domain_new)

# Update Integrations logic
int_old = """                      <Switch 
                        checked={integrations?.slack_enabled || false}
                        onCheckedChange={(checked) => setIntegrations({...integrations, slack_enabled: checked})}
                      />
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Send automated reports, alerts, and insights directly to your team's Slack channels.</p>
                    </CardContent>"""

int_new = """                    </CardHeader>
                    <CardContent className="space-y-4 mt-2">
                      <p className="text-sm text-slate-500 dark:text-slate-400">Send automated reports, alerts, and insights directly to your team's Slack channels.</p>
                      
                      {!integrations?.slack_enabled ? (
                        <div className="space-y-2 pt-2">
                          <Label className="text-xs">Slack API Key</Label>
                          <div className="flex gap-2">
                            <Input 
                              type="password" 
                              placeholder="xoxb-..." 
                              value={apiKeys.slack} 
                              onChange={e => setApiKeys({...apiKeys, slack: e.target.value})}
                            />
                            <Button size="sm" onClick={() => connectIntegration('slack')} disabled={!apiKeys.slack || testingConnection}>Connect</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded border border-emerald-200 dark:border-emerald-800">
                          <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium flex items-center"><Sparkles className="w-4 h-4 mr-2"/> Connected</span>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500" onClick={() => setIntegrations({...integrations, slack_enabled: false})}>Disconnect</Button>
                        </div>
                      )}
                    </CardContent>"""
content = content.replace(int_old, int_new)

# Update Notifications logic (Add Test Notification button)
notif_old = """                    <div className="flex items-start space-x-4">
                      <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <Label className="text-base font-medium">Email Alerts for Data Anomalies</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Receive immediate alerts when our AI detects significant deviations in your primary metrics.</p>
                      </div>
                      <Switch 
                        checked={notifications?.anomaly_emails || false}
                        onCheckedChange={(checked) => setNotifications({...notifications, anomaly_emails: checked})}
                      />
                    </div>"""
notif_new = """                    <div className="flex items-start space-x-4">
                      <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <Label className="text-base font-medium">Email Alerts for Data Anomalies</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Receive immediate alerts when our AI detects significant deviations in your primary metrics.</p>
                        
                        {notifications?.anomaly_emails && (
                           <div className="pt-2 flex items-center gap-3">
                             <Button variant="outline" size="sm" onClick={() => testNotification('email')} disabled={testingConnection}>
                               {testingConnection ? "Sending..." : "Send Test Alert"}
                             </Button>
                             {testResult && testResult.status === 'success' && <span className="text-xs text-emerald-600">{testResult.message}</span>}
                           </div>
                        )}
                      </div>
                      <Switch 
                        checked={notifications?.anomaly_emails || false}
                        onCheckedChange={(checked) => setNotifications({...notifications, anomaly_emails: checked})}
                      />
                    </div>"""

content = content.replace(notif_old, notif_new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Building2, Users, Shield, Database, Sparkles, Link as LinkIcon, 
  CreditCard, Bell, ScrollText, Settings, Upload, Save,
  MessageSquare, Cloud, Mail, AlertTriangle
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface TenantProfile {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  timezone: string;
  currency: string;
  domain: string | null;
}

interface TenantBranding {
  logo_url: string | null;
  white_label_config: {
    primary_color?: string;
  };
}

export default function OrganizationSettingsPage() {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [branding, setBranding] = useState<TenantBranding | null>(null);
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
      const res = await fetch(`${API_BASE_URL}/api/v1/tenant-settings/advanced/verify-domain`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ domain: advancedConfig?.custom_domain })
      });
      const data = await res.json();
      setTestResult({ status: data.status, message: data.message });
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

  
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setTestingConnection(true);
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/tenant-settings/branding/logo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Logo uploaded successfully");
        queryClient.invalidateQueries({ queryKey: ['orgSettings'] });
      } else {
        toast.error(data.detail || "Failed to upload logo");
      }
    } catch (err) {
      toast.error("Network error during upload");
    } finally {
      setTestingConnection(false);
    }
  };

  const testNotification = async (type: string) => {
    setTestingConnection(true);
    try {
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

  // Form states
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [currency, setCurrency] = useState("USD");
  
  const [primaryColor, setPrimaryColor] = useState("#059669");
  const [logoUrl, setLogoUrl] = useState("");
  
  const [securityConfig, setSecurityConfig] = useState<any>({});
  const [dataConnections, setDataConnections] = useState<any>({});
  const [integrations, setIntegrations] = useState<any>({});
  const [notifications, setNotifications] = useState<any>({});
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [advancedConfig, setAdvancedConfig] = useState<any>({});

  const TABS = [
    { id: "general", label: "General", icon: Building2 },
    { id: "branding", label: "Branding", icon: Sparkles },
    { id: "security", label: "Security & SSO", icon: Shield },
    { id: "data", label: "Data Connections", icon: Database },
    { id: "integrations", label: "Integrations", icon: LinkIcon },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "audit", label: "Audit Logs", icon: ScrollText },
    { id: "advanced", label: "Advanced", icon: Settings },
  ];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam && TABS.some(t => t.id === tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const [profileRes, brandingRes, secRes, dataRes, intRes, notifRes, advRes, auditRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/v1/tenant-settings/profile`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/v1/tenant-settings/branding`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/v1/tenant-settings/security`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/v1/tenant-settings/data-connections`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/v1/tenant-settings/integrations`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/v1/tenant-settings/notifications`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/v1/tenant-settings/advanced`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/v1/tenant-settings/audit-logs`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile(data);
          setName(data.name || "");
          setIndustry(data.industry || "");
          setTimezone(data.timezone || "UTC");
          setCurrency(data.currency || "USD");
        }
        
        if (brandingRes.ok) {
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
        if (auditRes.ok) setAuditLogs(await auditRes.json());
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [token]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/tenant-settings/profile`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, industry, timezone, currency })
      });
      if (res.ok) {
        toast.success("Profile saved successfully"); queryClient.invalidateQueries({ queryKey: ["orgSettings"] }); setIsDirty(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConfig = async (endpoint: string, configData: any) => {
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

  const handleSaveBranding = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/tenant-settings/branding`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          logo_url: logoUrl,
          white_label_config: { primary_color: primaryColor }
        })
      });
      if (res.ok) {
        toast.success("Branding saved successfully"); queryClient.invalidateQueries({ queryKey: ["orgSettings"] }); setIsDirty(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save branding");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center">Loading settings...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-200 dark:border-[#1f1f1f] bg-white dark:bg-[#0a0a0a]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Organization Settings
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manage your organization profile, branding, and global configuration.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-200 dark:border-[#1f1f1f] bg-white dark:bg-[#0a0a0a] overflow-y-auto">
          <nav className="p-4 space-y-1">
            {TABS.map((tab) => {
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
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Organization Profile</h3>
                  <p className="text-sm text-slate-500">Update your company name and details.</p>
                </div>
                <Separator />
                <Card>
                  <CardHeader>
                    <CardTitle>General Information</CardTitle>
                    <CardDescription>
                      This information will be displayed across your BI reports and dashboards.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Organization Name</Label>
                      <Input 
                        id="name" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Acme Corp"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Input 
                        id="industry" 
                        value={industry} 
                        onChange={(e) => setIndustry(e.target.value)}
                        placeholder="e.g. Finance, Healthcare, Technology"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="timezone">Default Timezone</Label>
                        <select 
                          id="timezone"
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-[#0B0F17] dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                        >
                          <option value="UTC">UTC (Coordinated Universal Time)</option>
                          <option value="America/New_York">Eastern Time (US & Canada)</option>
                          <option value="America/Chicago">Central Time (US & Canada)</option>
                          <option value="America/Denver">Mountain Time (US & Canada)</option>
                          <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                          <option value="Europe/London">London</option>
                          <option value="Europe/Paris">Paris</option>
                          <option value="Asia/Tokyo">Tokyo</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency">Default Currency</Label>
                        <select 
                          id="currency"
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-[#0B0F17] dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="JPY">JPY (¥)</option>
                          <option value="CAD">CAD ($)</option>
                          <option value="AUD">AUD ($)</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t p-6 dark:border-[#1f1f1f]">
                    <p className="text-sm text-slate-500">Please save your changes.</p>
                    <Button 
                      onClick={handleSaveProfile} 
                      disabled={saving}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {saving ? "Saving..." : "Save Profile"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}

            {activeTab === 'branding' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Branding</h3>
                  <p className="text-sm text-slate-500">Customize the look and feel of your platform.</p>
                </div>
                <Separator />
                <Card>
                  <CardHeader>
                    <CardTitle>White Label Configuration</CardTitle>
                    <CardDescription>
                      Upload your logo and choose your primary brand color to match your company&apos;s identity.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <Label>Company Logo</Label>
                      <div className="flex items-center gap-6">
                        <div className="h-24 w-24 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-slate-50 dark:bg-[#1a1a1a] overflow-hidden">
                          {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="object-contain h-full w-full p-2" />
                          ) : (
                            <img src="/icon.svg" className="h-8 w-8 text-slate-400" alt="Data Insight Logo" />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Input 
                            value={logoUrl}
                            onChange={(e) => setLogoUrl(e.target.value)}
                            placeholder="https://example.com/logo.png"
                            className="w-full max-w-sm"
                          />
                          <p className="text-xs text-slate-500">
                            Provide a URL to your logo. We recommend a square or wide logo with a transparent background.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label>Primary Brand Color</Label>
                      <div className="flex items-center gap-4">
                        <div 
                          className="h-10 w-10 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm"
                          style={{ backgroundColor: primaryColor }}
                        />
                        <Input 
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-24 h-10 p-1"
                        />
                        <Input 
                          type="text"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-32 font-mono"
                          placeholder="#059669"
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        This color will be used for buttons, charts, and key accents across the platform.
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t p-6 dark:border-[#1f1f1f]">
                    <p className="text-sm text-slate-500">Changes apply to all users in your organization.</p>
                    <Button 
                      onClick={handleSaveBranding} 
                      disabled={saving}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {saving ? "Saving..." : "Save Branding"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
            {activeTab === 'security' && (
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
            )}

            {activeTab === 'data' && (
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
                    
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
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
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end border-t border-slate-100 p-6 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                    <Button onClick={() => handleSaveConfig('data-connections', dataConnections)} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                      {saving ? "Saving..." : "Save Connections"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}

            {activeTab === 'integrations' && (
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
                    </CardHeader>
                    <CardContent className="space-y-4 mt-2">
                      <p className="text-sm text-slate-500 dark:text-slate-400">Send automated reports, alerts, and insights directly to your team&apos;s Slack channels.</p>
                      
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
            )}

            {activeTab === 'audit' && (
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
                        <Button variant="outline" onClick={verifyDomain} disabled={testingConnection || !advancedConfig?.custom_domain}>
                          {testingConnection ? "Verifying..." : "Verify DNS"}
                        </Button>
                      </div>
                      {testResult && (testResult.status === 'verified' || testResult.status === 'failed') && (
                        <div className={`p-3 rounded-md text-sm font-medium ${testResult.status === 'verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {testResult.message}
                        </div>
                      )}
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
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

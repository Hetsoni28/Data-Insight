"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, Users, Shield, Database, Sparkles, Link as LinkIcon, 
  CreditCard, Bell, ScrollText, Settings, Upload, Save
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
  const [activeTab, setActiveTab] = useState("general");
  
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [currency, setCurrency] = useState("USD");
  
  const [primaryColor, setPrimaryColor] = useState("#059669");
  const [logoUrl, setLogoUrl] = useState("");

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
        const [profileRes, brandingRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/v1/tenant-settings/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_BASE_URL}/api/v1/tenant-settings/branding`, {
            headers: { Authorization: `Bearer ${token}` }
          })
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
        alert("Profile saved successfully");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save profile");
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
        alert("Branding saved successfully");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save branding");
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
                          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
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
                          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
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
                      Upload your logo and choose your primary brand color to match your company's identity.
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
                            <Building2 className="h-8 w-8 text-slate-400" />
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
          </div>
        </main>
      </div>
    </div>
  );
}

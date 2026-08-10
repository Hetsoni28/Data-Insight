import os

filepath = r"c:\Users\Het\OneDrive\Desktop\data-insight\frontend\src\app\organization-admin\dashboard\settings\page.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add imports
if "from '@tanstack/react-query'" not in content:
    content = content.replace(
        'import React, { useState, useEffect } from "react";',
        'import React, { useState, useEffect } from "react";\nimport { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";\nimport { toast } from "sonner";'
    )

# 2. Add queryClient to component
if "const queryClient = useQueryClient();" not in content:
    content = content.replace(
        'const { token } = useAuthStore();',
        'const { token } = useAuthStore();\n  const queryClient = useQueryClient();\n  const [isDirty, setIsDirty] = useState(false);'
    )

# 3. Replace useEffect data fetching with useQuery
use_effect_fetch_old = '''  useEffect(() => {
    if (!token) return;
    
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const [profileRes, brandingRes, secRes, dataRes, intRes, notifRes, advRes, auditRes] = await Promise.all([
          fetch(${API_BASE_URL}/api/v1/tenant-settings/profile, { headers: { Authorization: Bearer  } }),
          fetch(${API_BASE_URL}/api/v1/tenant-settings/branding, { headers: { Authorization: Bearer  } }),
          fetch(${API_BASE_URL}/api/v1/tenant-settings/security, { headers: { Authorization: Bearer  } }),
          fetch(${API_BASE_URL}/api/v1/tenant-settings/data-connections, { headers: { Authorization: Bearer  } }),
          fetch(${API_BASE_URL}/api/v1/tenant-settings/integrations, { headers: { Authorization: Bearer  } }),
          fetch(${API_BASE_URL}/api/v1/tenant-settings/notifications, { headers: { Authorization: Bearer  } }),
          fetch(${API_BASE_URL}/api/v1/tenant-settings/advanced, { headers: { Authorization: Bearer  } }),
          fetch(${API_BASE_URL}/api/v1/tenant-settings/audit-logs, { headers: { Authorization: Bearer  } })
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
        console.error("Failed to load tenant settings", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, [token]);'''

use_query_fetch_new = '''  const { data: settingsData, isLoading: queryLoading } = useQuery({
    queryKey: ['orgSettings', token],
    queryFn: async () => {
      const [profileRes, brandingRes, secRes, dataRes, intRes, notifRes, advRes, auditRes] = await Promise.all([
        fetch(${API_BASE_URL}/api/v1/tenant-settings/profile, { headers: { Authorization: Bearer  } }),
        fetch(${API_BASE_URL}/api/v1/tenant-settings/branding, { headers: { Authorization: Bearer  } }),
        fetch(${API_BASE_URL}/api/v1/tenant-settings/security, { headers: { Authorization: Bearer  } }),
        fetch(${API_BASE_URL}/api/v1/tenant-settings/data-connections, { headers: { Authorization: Bearer  } }),
        fetch(${API_BASE_URL}/api/v1/tenant-settings/integrations, { headers: { Authorization: Bearer  } }),
        fetch(${API_BASE_URL}/api/v1/tenant-settings/notifications, { headers: { Authorization: Bearer  } }),
        fetch(${API_BASE_URL}/api/v1/tenant-settings/advanced, { headers: { Authorization: Bearer  } }),
        fetch(${API_BASE_URL}/api/v1/tenant-settings/audit-logs, { headers: { Authorization: Bearer  } })
      ]);
      return {
        profile: profileRes.ok ? await profileRes.json() : null,
        branding: brandingRes.ok ? await brandingRes.json() : null,
        security: secRes.ok ? await secRes.json() : null,
        dataConnections: dataRes.ok ? await dataRes.json() : null,
        integrations: intRes.ok ? await intRes.json() : null,
        notifications: notifRes.ok ? await notifRes.json() : null,
        advanced: advRes.ok ? await advRes.json() : null,
        auditLogs: auditRes.ok ? await auditRes.json() : null,
      };
    },
    enabled: !!token,
  });

  useEffect(() => {
    if (settingsData) {
      if (settingsData.profile) {
        setProfile(settingsData.profile);
        setName(settingsData.profile.name || "");
        setIndustry(settingsData.profile.industry || "");
        setTimezone(settingsData.profile.timezone || "UTC");
        setCurrency(settingsData.profile.currency || "USD");
      }
      if (settingsData.branding) {
        setBranding(settingsData.branding);
        setLogoUrl(settingsData.branding.logo_url || "");
        setPrimaryColor(settingsData.branding.white_label_config?.primary_color || "#059669");
      }
      if (settingsData.security) setSecurityConfig(settingsData.security);
      if (settingsData.dataConnections) setDataConnections(settingsData.dataConnections);
      if (settingsData.integrations) setIntegrations(settingsData.integrations);
      if (settingsData.notifications) setNotifications(settingsData.notifications);
      if (settingsData.advanced) setAdvancedConfig(settingsData.advanced);
      if (settingsData.auditLogs) setAuditLogs(settingsData.auditLogs);
      
      setLoading(false);
      setIsDirty(false);
    }
  }, [settingsData]);'''

content = content.replace(use_effect_fetch_old, use_query_fetch_new)

# 4. Replace alerts with toast
content = content.replace('alert("Profile saved successfully");', 'toast.success("Profile saved successfully"); queryClient.invalidateQueries({ queryKey: ["orgSettings"] }); setIsDirty(false);')
content = content.replace('alert("Failed to save profile");', 'toast.error("Failed to save profile");')

content = content.replace('alert("Branding saved successfully");', 'toast.success("Branding saved successfully"); queryClient.invalidateQueries({ queryKey: ["orgSettings"] }); setIsDirty(false);')
content = content.replace('alert("Failed to save branding");', 'toast.error("Failed to save branding");')

content = content.replace('alert("Security settings saved successfully");', 'toast.success("Security settings saved successfully"); queryClient.invalidateQueries({ queryKey: ["orgSettings"] }); setIsDirty(false);')
content = content.replace('alert("Failed to save security settings");', 'toast.error("Failed to save security settings");')

# 5. Add true logo upload function
logo_upload_func = '''
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setTestingConnection(true);
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await fetch(${API_BASE_URL}/api/v1/tenant-settings/branding/logo, {
        method: 'POST',
        headers: { 'Authorization': Bearer  },
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
'''

if "const handleLogoUpload =" not in content:
    content = content.replace(
        'const testNotification = async (type: string) => {',
        logo_upload_func + '\n  const testNotification = async (type: string) => {'
    )

# 6. Bind logo upload handler to the input
content = content.replace(
    '<Input type="file" className="max-w-md" accept="image/*" />',
    '<Input type="file" className="max-w-md" accept="image/png, image/jpeg, image/svg+xml" onChange={handleLogoUpload} disabled={testingConnection} />'
)

# 7. Add isDirty detection to forms (simplistic approach: just set isDirty on changes)
content = content.replace('onChange={e => setName(e.target.value)}', 'onChange={e => {setName(e.target.value); setIsDirty(true);}}')
content = content.replace('onChange={e => setIndustry(e.target.value)}', 'onChange={e => {setIndustry(e.target.value); setIsDirty(true);}}')
content = content.replace('onValueChange={setTimezone}', 'onValueChange={val => {setTimezone(val); setIsDirty(true);}}')
content = content.replace('onValueChange={setCurrency}', 'onValueChange={val => {setCurrency(val); setIsDirty(true);}}')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

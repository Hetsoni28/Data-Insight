"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface WhiteLabelConfig {
  primaryColor?: string;
  accentColor?: string;
  customLogoUrl?: string;
}

export function TenantBrandingProvider({ 
  children,
  tenantDomain
}: { 
  children: React.ReactNode,
  tenantDomain?: string | null
}) {
  const [config, setConfig] = useState<WhiteLabelConfig | null>(null);
  const { data: user } = useAuth(); 

  useEffect(() => {
    async function fetchBranding() {
      // 1. If we are on a custom domain, fetch the config from the public API
      if (tenantDomain) {
        try {
          const { data } = await api.get(`/public/tenant-branding?domain=${tenantDomain}`);
          if (data?.white_label_config) {
            setConfig({
              primaryColor: data.white_label_config.primaryColor || data.white_label_config.primary_color,
              accentColor: data.white_label_config.accentColor || data.white_label_config.accent_color,
              customLogoUrl: data.white_label_config.customLogoUrl || data.white_label_config.custom_logo_url,
            });
          }
        } catch (err) {
          console.error("Failed to fetch tenant branding", err);
        }
      } 
      // 2. If we are logged in, use the tenant's white_label_config from the user profile
      // EXCEPTION: If the user is the platform 'owner', do not overwrite their platform dashboard styling
      // unless they are explicitly testing a custom domain.
      else if (user?.tenant?.white_label_config && user.role !== 'owner') {
        setConfig({
          primaryColor: user.tenant.white_label_config.primaryColor || user.tenant.white_label_config.primary_color,
          accentColor: user.tenant.white_label_config.accentColor || user.tenant.white_label_config.accent_color,
          customLogoUrl: user.tenant.white_label_config.customLogoUrl || user.tenant.white_label_config.custom_logo_url,
        });
      }
    }
    
    fetchBranding();
  }, [tenantDomain, user]);

  // Convert HEX to OKLCH approximation, or simply inject HEX directly.
  // Tailwind v4 allows variables to hold hex values directly if we override them.
  const customStyles = config?.primaryColor ? `
    :root {
      --primary: ${config.primaryColor};
      ${config.accentColor ? `--secondary: ${config.accentColor};` : ''}
      ${config.primaryColor ? `--ring: ${config.primaryColor};` : ''}
    }
    
    /* Apply custom theme overwrites to dark mode */
    .dark {
      --primary: ${config.primaryColor};
      ${config.accentColor ? `--secondary: ${config.accentColor};` : ''}
      ${config.primaryColor ? `--ring: ${config.primaryColor};` : ''}
    }
  ` : "";

  return (
    <>
      {customStyles && (
        <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      )}
      {children}
    </>
  );
}
